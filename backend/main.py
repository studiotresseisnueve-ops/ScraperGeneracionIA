from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.routers import auth, branding, generation, history, scraping
from app.routers.auth import verify_session

app = FastAPI(
    title="AI Inspiration Engine",
    docs_url=None,
    redoc_url=None,
)

_PUBLIC_PATHS = {"/health", "/auth/login"}


@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    if request.method == "OPTIONS" or request.url.path in _PUBLIC_PATHS:
        return await call_next(request)
    token = request.cookies.get("auth_token")
    if not token or not verify_session(token):
        return JSONResponse({"detail": "No autenticado"}, status_code=401)
    return await call_next(request)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://frontend:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,        prefix="/auth",       tags=["auth"])
app.include_router(branding.router,    prefix="/branding",   tags=["branding"])
app.include_router(scraping.router,    prefix="/scraping",   tags=["scraping"])
app.include_router(generation.router,  prefix="/generation", tags=["generation"])
app.include_router(history.router,     prefix="/history",    tags=["history"])


@app.get("/health")
async def health():
    return {"status": "ok"}

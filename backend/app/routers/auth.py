import secrets

from fastapi import APIRouter, Cookie, HTTPException, Response
from pydantic import BaseModel

from app.config import AUTH_EMAIL, AUTH_PASSWORD

router = APIRouter()

_MAX_AGE = 8 * 3600
_active_sessions: set[str] = set()


def verify_session(token: str) -> bool:
    return token in _active_sessions


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
async def login(body: LoginRequest, response: Response):
    if body.email != AUTH_EMAIL or body.password != AUTH_PASSWORD:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    token = secrets.token_hex(32)
    _active_sessions.add(token)
    response.set_cookie(
        key="auth_token",
        value=token,
        httponly=True,
        max_age=_MAX_AGE,
        samesite="lax",
    )
    return {"ok": True}


@router.post("/logout")
async def logout(response: Response, auth_token: str = Cookie(None)):
    if auth_token:
        _active_sessions.discard(auth_token)
    response.delete_cookie("auth_token", samesite="lax")
    return {"ok": True}


@router.get("/me")
async def me(auth_token: str = Cookie(None)):
    if not auth_token or not verify_session(auth_token):
        raise HTTPException(status_code=401, detail="No autenticado")
    return {"ok": True}

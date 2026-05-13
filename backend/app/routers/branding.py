from pathlib import Path
from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from .. import storage, progress
from ..agents import branding as branding_agent
from ..models import BrandProfile, SessionCosts

router = APIRouter()


class BrandFormInput(BaseModel):
    brand_name: str
    product_type: str
    target_audience: str
    colors: list[str]
    keywords: list[str]
    trending_keywords: list[str]
    style_descriptors: list[str]


@router.post("/from-form")
async def create_from_form(body: BrandFormInput):
    session_id = storage.new_session_id()
    profile = BrandProfile(
        session_id=session_id,
        filename=body.brand_name,
        tone_of_voice=body.product_type,
        colors=body.colors[:6],
        keywords=body.keywords[:5],
        trending_keywords=body.trending_keywords[:5],
        target_audience=body.target_audience,
        style_descriptors=body.style_descriptors[:5],
    )
    storage.save_profile(profile)
    storage.save_costs(SessionCosts(session_id=session_id))
    return {"session_id": session_id}


async def _run_branding(pdf_path: str, session_id: str, filename: str):
    try:
        await branding_agent.process_pdf(pdf_path, session_id, filename)
    except Exception as exc:
        await progress.push(session_id, "error", f"Error al procesar el PDF: {exc}", "error")


@router.post("/upload")
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Solo se aceptan archivos PDF.")

    session_id = storage.new_session_id()
    upload_dir = storage.uploads_dir(session_id)
    pdf_path = str(upload_dir / "original.pdf")

    Path(pdf_path).write_bytes(await file.read())

    progress.init_session(session_id)
    background_tasks.add_task(_run_branding, pdf_path, session_id, file.filename)

    return {"session_id": session_id}


@router.get("/progress/{session_id}")
async def stream_progress(session_id: str):
    return StreamingResponse(
        progress.stream(session_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/profile/{session_id}")
async def get_profile(session_id: str):
    profile = storage.load_profile(session_id)
    if not profile:
        raise HTTPException(404, "Perfil no encontrado.")
    return profile

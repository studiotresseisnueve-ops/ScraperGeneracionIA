from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from pydantic import BaseModel
from .. import storage, progress
from ..agents import generation as gen_agent

router = APIRouter()


class GenerateRequest(BaseModel):
    format: str = "square"
    count: int = 4


async def _run_generation(session_id: str, format_type: str, count: int):
    try:
        await gen_agent.generate(session_id, format_type, count)
    except Exception as exc:
        await progress.push(session_id, "error", f"Error generando imágenes: {exc}", "error")


@router.post("/{session_id}/create")
async def start_generation(
    session_id: str, req: GenerateRequest, background_tasks: BackgroundTasks
):
    if not storage.load_profile(session_id):
        raise HTTPException(404, "Sesión no encontrada.")

    progress.init_session(session_id)
    background_tasks.add_task(_run_generation, session_id, req.format, min(req.count, 4))

    return {"status": "started"}


@router.get("/{session_id}/progress")
async def stream_generation(session_id: str):
    return StreamingResponse(
        progress.stream(session_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{session_id}/images")
async def get_images(session_id: str):
    return storage.load_images(session_id)


@router.get("/{session_id}/download/{image_id}")
async def download_image(session_id: str, image_id: str):
    images = storage.load_images(session_id)
    image = next((i for i in images if i.image_id == image_id), None)
    if not image:
        raise HTTPException(404, "Imagen no encontrada.")
    return FileResponse(
        image.local_path,
        media_type="image/png",
        filename=f"asset-{image_id}-{image.format}.png",
    )

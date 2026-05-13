
from pathlib import Path
from fastapi import APIRouter, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, FileResponse
from .. import storage, progress
from ..agents import scraping as scraping_agent
from ..config import HISTORY_DIR

router = APIRouter()


async def _run_scraping(keywords: list[str], session_id: str):
    try:
        await scraping_agent.scrape_reels(keywords, session_id)
    except Exception as exc:
        await progress.push(session_id, "error", f"Error en scraping: {exc}", "error")


@router.post("/{session_id}/search")
async def start_scraping(session_id: str, background_tasks: BackgroundTasks):
    profile = storage.load_profile(session_id)
    if not profile:
        raise HTTPException(404, "Sesión no encontrada.")

    progress.init_session(session_id)
    background_tasks.add_task(_run_scraping, profile.trending_keywords, session_id)

    return {"status": "started"}


@router.get("/{session_id}/progress")
async def stream_scraping(session_id: str):
    return StreamingResponse(
        progress.stream(session_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{session_id}/videos")
async def get_videos(session_id: str):
    return storage.load_videos(session_id)


@router.get("/{session_id}/thumbnail/{video_id}")
async def get_thumbnail(session_id: str, video_id: str):
    thumb = Path(HISTORY_DIR) / session_id / "thumbnails" / f"{video_id}.jpg"
    if not thumb.exists():
        raise HTTPException(404, "Thumbnail no encontrado.")
    return FileResponse(thumb, media_type="image/jpeg")

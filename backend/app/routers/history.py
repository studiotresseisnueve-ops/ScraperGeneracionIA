import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException
from .. import storage
from ..config import UPLOADS_DIR, HISTORY_DIR

router = APIRouter()


@router.get("/")
async def list_history():
    return storage.list_sessions()


@router.get("/{session_id}")
async def get_session(session_id: str):
    profile = storage.load_profile(session_id)
    if not profile:
        raise HTTPException(404, "Sesión no encontrada.")
    return {
        "profile": profile,
        "videos": storage.load_videos(session_id),
        "images": storage.load_images(session_id),
        "costs": storage.load_costs(session_id),
    }


@router.get("/{session_id}/costs")
async def get_costs(session_id: str):
    return storage.load_costs(session_id)


@router.delete("/{session_id}")
async def delete_session(session_id: str):
    for base in (HISTORY_DIR, UPLOADS_DIR):
        path = Path(base) / session_id
        if path.exists():
            shutil.rmtree(path)
    return {"deleted": session_id}

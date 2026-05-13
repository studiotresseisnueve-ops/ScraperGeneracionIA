import json
import uuid
from datetime import datetime
from pathlib import Path

from .config import UPLOADS_DIR, HISTORY_DIR
from .models import BrandProfile, VideoAnalysis, GeneratedImage, SessionCosts


def new_session_id() -> str:
    return uuid.uuid4().hex[:12]


def session_dir(session_id: str) -> Path:
    path = Path(HISTORY_DIR) / session_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def uploads_dir(session_id: str) -> Path:
    path = Path(UPLOADS_DIR) / session_id
    path.mkdir(parents=True, exist_ok=True)
    return path


def save_profile(profile: BrandProfile):
    (session_dir(profile.session_id) / "profile.json").write_text(
        profile.model_dump_json(indent=2)
    )


def load_profile(session_id: str) -> BrandProfile | None:
    p = session_dir(session_id) / "profile.json"
    if not p.exists():
        return None
    return BrandProfile.model_validate_json(p.read_text())


def save_videos(session_id: str, videos: list[VideoAnalysis]):
    (session_dir(session_id) / "videos.json").write_text(
        json.dumps([v.model_dump() for v in videos], indent=2)
    )


def load_videos(session_id: str) -> list[VideoAnalysis]:
    p = session_dir(session_id) / "videos.json"
    if not p.exists():
        return []
    return [VideoAnalysis(**v) for v in json.loads(p.read_text())]


def save_images(session_id: str, images: list[GeneratedImage]):
    (session_dir(session_id) / "images.json").write_text(
        json.dumps([i.model_dump() for i in images], indent=2)
    )


def load_images(session_id: str) -> list[GeneratedImage]:
    p = session_dir(session_id) / "images.json"
    if not p.exists():
        return []
    return [GeneratedImage(**i) for i in json.loads(p.read_text())]


def save_costs(costs: SessionCosts):
    (session_dir(costs.session_id) / "costs.json").write_text(
        costs.model_dump_json(indent=2)
    )


def load_costs(session_id: str) -> SessionCosts:
    p = session_dir(session_id) / "costs.json"
    if not p.exists():
        return SessionCosts(session_id=session_id)
    return SessionCosts.model_validate_json(p.read_text())


def list_sessions() -> list[dict]:
    history = Path(HISTORY_DIR)
    if not history.exists():
        return []
    sessions = []
    for d in sorted(history.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
        profile_file = d / "profile.json"
        if not profile_file.exists():
            continue
        profile = BrandProfile.model_validate_json(profile_file.read_text())
        costs = load_costs(d.name)
        sessions.append({
            "session_id": d.name,
            "timestamp": datetime.fromtimestamp(d.stat().st_mtime).isoformat(),
            "filename": profile.filename,
            "keywords": profile.keywords[:3],
            "videos_count": len(load_videos(d.name)),
            "images_count": len(load_images(d.name)),
            "costs": costs.model_dump(),
        })
    return sessions

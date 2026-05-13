import asyncio
import json
from typing import AsyncGenerator

_queues: dict[str, asyncio.Queue] = {}


def init_session(session_id: str):
    _queues[session_id] = asyncio.Queue()


async def push(session_id: str, stage: str, message: str, status: str = "loading"):
    if session_id in _queues:
        await _queues[session_id].put({"stage": stage, "message": message, "status": status})


async def stream(session_id: str) -> AsyncGenerator[str, None]:
    if session_id not in _queues:
        yield f"data: {json.dumps({'status': 'error', 'message': 'Sesión no encontrada'})}\n\n"
        return

    q = _queues[session_id]
    while True:
        try:
            msg = await asyncio.wait_for(q.get(), timeout=180.0)
            yield f"data: {json.dumps(msg)}\n\n"
            if msg.get("status") in ("complete", "error"):
                break
        except asyncio.TimeoutError:
            yield f"data: {json.dumps({'status': 'error', 'message': 'Tiempo de espera agotado'})}\n\n"
            break

    _queues.pop(session_id, None)

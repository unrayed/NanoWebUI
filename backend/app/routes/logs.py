import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.gateway import gateway_manager

router = APIRouter(tags=["logs"])


@router.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await websocket.accept()

    queue: asyncio.Queue = asyncio.Queue()

    def on_log(line: str):
        queue.put_nowait(line)

    gateway_manager.add_log_listener(on_log)

    try:
        while True:
            try:
                line = await asyncio.wait_for(queue.get(), timeout=30)
                await websocket.send_text(json.dumps({"type": "log", "data": line}))
            except asyncio.TimeoutError:
                await websocket.send_text(json.dumps({"type": "ping"}))
    except WebSocketDisconnect:
        pass
    finally:
        gateway_manager.remove_log_listener(on_log)

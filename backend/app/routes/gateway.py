from fastapi import APIRouter
from app.gateway import gateway_manager

router = APIRouter(prefix="/api/gateway", tags=["gateway"])


@router.get("/status")
def gateway_status():
    return gateway_manager.get_status()


@router.post("/start")
async def gateway_start():
    result = await gateway_manager.start()
    if result["status"] == "error":
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@router.post("/stop")
async def gateway_stop():
    result = await gateway_manager.stop()
    if result["status"] == "error":
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@router.post("/restart")
async def gateway_restart():
    result = await gateway_manager.restart()
    if result["status"] == "error":
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=result["message"])
    return result


@router.get("/logs")
def gateway_logs(limit: int = 200):
    return {"logs": gateway_manager.get_logs(limit)}

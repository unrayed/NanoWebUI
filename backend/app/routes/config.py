from fastapi import APIRouter, HTTPException
from app.nanobot_config import load_config, save_config, get_config_path, Config

router = APIRouter(prefix="/api/config", tags=["config"])


@router.get("")
def get_config():
    try:
        cfg = load_config(get_config_path())
        return cfg.model_dump(by_alias=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("")
def update_config(cfg: dict):
    try:
        config_obj = Config(**cfg)
        save_config(config_obj, get_config_path())
        return {"message": "Config saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/path")
def get_config_path_endpoint():
    return {"path": get_config_path()}


@router.get("/section/{section}")
def get_config_section(section: str):
    try:
        cfg = load_config(get_config_path())
        data = cfg.model_dump(by_alias=True)
        if section not in data:
            raise HTTPException(status_code=404, detail=f"Section '{section}' not found")
        return {section: data[section]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

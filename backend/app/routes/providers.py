from fastapi import APIRouter, HTTPException
import httpx
from app.providers import PROVIDERS, PROVIDER_MAP
from app.nanobot_config import load_config, get_config_path

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("")
def list_providers():
    config = load_config(get_config_path())
    providers_data = config.model_dump(by_alias=True).get("providers", {})
    result = []
    for p in PROVIDERS:
        provider_cfg = providers_data.get(p["name"], {})
        has_key = bool(provider_cfg.get("apiKey", ""))
        result.append({
            **p,
            "configured": has_key,
            "apiKey": provider_cfg.get("apiKey", ""),
            "apiBase": provider_cfg.get("apiBase", p.get("defaultApiBase")),
        })
    return result


@router.post("/{name}/test")
async def test_provider(name: str):
    if name not in PROVIDER_MAP:
        raise HTTPException(status_code=404, detail=f"Provider '{name}' not found")

    provider_meta = PROVIDER_MAP[name]
    test_model = provider_meta.get("testModel")

    config = load_config(get_config_path())
    providers_data = config.model_dump(by_alias=True).get("providers", {})
    provider_cfg = providers_data.get(name, {})
    api_key = provider_cfg.get("apiKey", "")
    api_base = provider_cfg.get("apiBase") or provider_meta.get("defaultApiBase")

    if not api_key:
        raise HTTPException(status_code=400, detail="No API key configured for this provider")

    test_base = api_base.rstrip("/") if api_base else None
    if not test_base:
        raise HTTPException(status_code=400, detail="No API base URL configured")

    try:
        if test_model:
            test_url = f"{test_base}/chat/completions"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            }
            body = {
                "model": test_model,
                "messages": [{"role": "user", "content": "Hi"}],
                "max_tokens": 1,
            }
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(test_url, headers=headers, json=body)
        else:
            test_url = f"{test_base}/models"
            headers = {"Authorization": f"Bearer {api_key}"}
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(test_url, headers=headers)

        if resp.status_code == 200:
            return {"success": True, "message": "Connection successful"}
        elif resp.status_code == 401:
            return {"success": False, "message": "Invalid API key"}
        elif resp.status_code == 403:
            return {"success": False, "message": "Access forbidden. Check API key permissions."}
        elif resp.status_code == 404:
            return {"success": False, "message": f"Model '{test_model}' not found. Try a different model."}
        elif resp.status_code == 429:
            return {"success": False, "message": "Rate limited. Try again later."}
        else:
            return {"success": False, "message": f"HTTP {resp.status_code}: {resp.text[:200]}"}
    except httpx.ConnectError:
        return {"success": False, "message": "Could not connect. Check the API base URL."}
    except httpx.TimeoutException:
        return {"success": False, "message": "Connection timed out"}
    except Exception as e:
        return {"success": False, "message": str(e)}

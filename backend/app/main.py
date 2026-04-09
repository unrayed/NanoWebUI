import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
from jose import jwt

from app.auth import init_default
from app.routes import auth, config, gateway, providers, logs

JWT_SECRET = os.environ.get("NANOWEBUI_SECRET_KEY", "nanowebui-dev-secret-change-in-production")

PUBLIC_PATHS = {"/api/auth/login", "/docs", "/openapi.json", "/redoc"}


async def verify_auth(request: Request, call_next):
    if request.url.path in PUBLIC_PATHS or request.url.path.startswith("/ws/"):
        return await call_next(request)

    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    token = auth_header.split(" ", 1)[1]
    try:
        jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})

    return await call_next(request)


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_default()
    yield


app = FastAPI(title="NanoWebUI", version="0.1.0", lifespan=lifespan)

app.middleware("http")(verify_auth)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(config.router)
app.include_router(gateway.router)
app.include_router(providers.router)
app.include_router(logs.router)

FRONTEND_DIST = Path(__file__).parent.parent.parent / "frontend" / "dist"


@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    if FRONTEND_DIST.exists():
        file_path = FRONTEND_DIST / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        index = FRONTEND_DIST / "index.html"
        if index.exists():
            return FileResponse(index)
    raise HTTPException(status_code=404, detail="Frontend not built. Run npm run build in frontend/")


def start():
    import uvicorn
    host = os.environ.get("HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", "3000"))
    uvicorn.run("app.main:app", host=host, port=port, reload=False)


if __name__ == "__main__":
    start()

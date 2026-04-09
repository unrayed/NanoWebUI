from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.auth import verify_credentials, change_password, change_username, get_force_change_flag, get_username
from app.token import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: str
    password: str


class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str


class UsernameChangeRequest(BaseModel):
    currentPassword: str
    newUsername: str


@router.post("/login")
def login(req: LoginRequest):
    if not verify_credentials(req.username, req.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": req.username})
    return {
        "token": token,
        "forceChange": get_force_change_flag(),
    }


@router.post("/change-password")
def change_password_endpoint(req: PasswordChangeRequest):
    ok, msg = change_password(req.currentPassword, req.newPassword)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}


@router.post("/change-username")
def change_username_endpoint(req: UsernameChangeRequest):
    ok, msg = change_username(req.currentPassword, req.newUsername)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg, "username": req.newUsername}


@router.get("/me")
def get_me():
    return {"username": get_username(), "forceChange": get_force_change_flag()}

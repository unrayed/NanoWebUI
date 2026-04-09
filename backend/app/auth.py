import json
import os
from pathlib import Path
import bcrypt

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
AUTH_FILE = DATA_DIR / "auth.json"


def _load():
    if AUTH_FILE.exists():
        with open(AUTH_FILE) as f:
            return json.load(f)
    return None


def _save(data):
    with open(AUTH_FILE, "w") as f:
        json.dump(data, f, indent=2)


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def init_default():
    if not _load():
        _save({
            "username": "admin",
            "password_hash": _hash_password("admin"),
            "force_change": True,
        })


def verify_credentials(username, password):
    data = _load()
    if not data:
        return False
    if data["username"] != username:
        return False
    return _verify_password(password, data["password_hash"])


def change_password(current_password, new_password):
    data = _load()
    if not data:
        return False, "No auth data found"
    if not _verify_password(current_password, data["password_hash"]):
        return False, "Current password is incorrect"
    data["password_hash"] = _hash_password(new_password)
    data["force_change"] = False
    _save(data)
    return True, "Password changed successfully"


def change_username(current_password, new_username):
    data = _load()
    if not data:
        return False, "No auth data found"
    if not _verify_password(current_password, data["password_hash"]):
        return False, "Current password is incorrect"
    data["username"] = new_username
    _save(data)
    return True, "Username changed successfully"


def get_force_change_flag():
    data = _load()
    if not data:
        return False
    return data.get("force_change", False)


def get_username():
    data = _load()
    if not data:
        return "admin"
    return data.get("username", "admin")

import asyncio
import os
import shutil
import socket
import sys
from pathlib import Path
from typing import Callable
import psutil


def _find_nanobot_cmd() -> str | None:
    candidates = []

    nanobot_projects = Path.home() / "Desktop" / "Projects" / "nanobot"
    if (nanobot_projects / ".venv").exists():
        if sys.platform == "win32":
            candidates.append(nanobot_projects / ".venv" / "Scripts" / "nanobot.exe")
            candidates.append(nanobot_projects / ".venv" / "Scripts" / "nanobot")
        else:
            candidates.append(nanobot_projects / ".venv" / "bin" / "nanobot")

    venv_scripts = Path(sys.prefix) / ("Scripts" if sys.platform == "win32" else "bin")
    candidates.append(venv_scripts / "nanobot.exe")
    candidates.append(venv_scripts / "nanobot")

    candidates.append(shutil.which("nanobot"))

    for c in candidates:
        if c and Path(c).exists():
            return str(c)
    return None


class GatewayManager:
    def __init__(self):
        self._process: asyncio.subprocess.Process | None = None
        self._log_buffer: list[str] = []
        self._max_log_buffer = 5000
        self._listeners: list[Callable] = []
        self._mode = self._detect_mode()
        self._nanobot_cmd = _find_nanobot_cmd()

    def _detect_mode(self) -> str:
        if os.environ.get("NANOBOT_URL"):
            return "remote"
        return "local"

    @property
    def mode(self) -> str:
        return self._mode

    def add_log_listener(self, callback: Callable):
        self._listeners.append(callback)

    def remove_log_listener(self, callback: Callable):
        if callback in self._listeners:
            self._listeners.remove(callback)

    def _emit_log(self, line: str):
        self._log_buffer.append(line)
        if len(self._log_buffer) > self._max_log_buffer:
            self._log_buffer = self._log_buffer[-self._max_log_buffer:]
        for cb in self._listeners:
            try:
                cb(line)
            except Exception:
                pass

    def get_logs(self, limit: int = 200) -> list[str]:
        return self._log_buffer[-limit:]

    def clear_logs(self):
        self._log_buffer.clear()

    async def _read_stream(self, stream):
        while True:
            line = await stream.readline()
            if not line:
                break
            text = line.decode("utf-8", errors="replace").rstrip()
            self._emit_log(text)

    async def start(self, verbose: bool = True):
        if self._mode == "remote":
            return {"status": "error", "message": "Cannot start gateway in remote mode"}

        if self.is_running():
            return {"status": "ok", "message": "Gateway already running"}

        if not self._nanobot_cmd:
            return {
                "status": "error",
                "message": "nanobot command not found. Set NANOBOT_CMD env var or install nanobot.",
            }

        cmd = [self._nanobot_cmd, "gateway"]
        if verbose:
            cmd.append("--verbose")

        env = os.environ.copy()
        config_path = os.environ.get("NANOBOT_CONFIG_PATH")
        if config_path:
            env["NANOBOT_CONFIG_PATH"] = config_path

        try:
            self._process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
            )
            asyncio.ensure_future(self._read_stream(self._process.stdout))
            asyncio.ensure_future(self._read_stream(self._process.stderr))
            return {"status": "ok", "message": "Gateway started"}
        except FileNotFoundError:
            return {"status": "error", "message": f"nanobot not found at {self._nanobot_cmd}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}

    async def stop(self):
        if self._mode == "remote":
            return {"status": "error", "message": "Cannot stop gateway in remote mode"}

        if self._process and self._process.returncode is None:
            self._process.terminate()
            try:
                await asyncio.wait_for(self._process.wait(), timeout=10)
            except asyncio.TimeoutError:
                self._process.kill()
                await self._process.wait()
            self._emit_log("[WebUI] Gateway stopped")
            self._process = None
            return {"status": "ok", "message": "Gateway stopped"}
        return {"status": "ok", "message": "Gateway not running"}

    async def restart(self, verbose: bool = True):
        await self.stop()
        await asyncio.sleep(1)
        return await self.start(verbose=verbose)

    def is_running(self) -> bool:
        if self._mode == "remote":
            return self._check_remote_health()

        if self._process and self._process.returncode is None:
            return True
        if self._check_gateway_port():
            return True
        return self._check_nanobot_process()

    def _check_gateway_port(self) -> bool:
        port = int(os.environ.get("NANOBOT_GATEWAY_PORT", "18790"))
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.5)
            result = s.connect_ex(("127.0.0.1", port))
            s.close()
            return result == 0
        except Exception:
            return False

    def _check_nanobot_process(self) -> bool:
        try:
            for proc in psutil.process_iter(["pid", "name", "cmdline"]):
                try:
                    cmdline = " ".join(proc.info["cmdline"] or [])
                    if "nanobot" in cmdline and "gateway" in cmdline:
                        return True
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
        except Exception:
            pass
        return False

    def _check_remote_health(self) -> bool:
        import httpx
        url = os.environ.get("NANOBOT_URL", "http://localhost:18790")
        try:
            resp = httpx.get(f"{url}/health", timeout=3)
            return resp.status_code == 200
        except Exception:
            return False

    def get_status(self) -> dict:
        running = self.is_running()
        return {
            "running": running,
            "mode": self._mode,
            "pid": self._process.pid if self._process else None,
            "nanobotCmd": self._nanobot_cmd,
        }


gateway_manager = GatewayManager()

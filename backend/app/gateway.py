import asyncio
import os
import sys
from pathlib import Path
from typing import Callable
import psutil


class GatewayManager:
    def __init__(self):
        self._process: asyncio.subprocess.Process | None = None
        self._log_buffer: list[str] = []
        self._max_log_buffer = 5000
        self._listeners: list[Callable] = []
        self._mode = self._detect_mode()

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

        cmd = [sys.executable, "-m", "nanobot", "gateway"]
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
            return {"status": "error", "message": "nanobot not found. Install it first."}
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
        return self._check_port_binding()

    def _check_port_binding(self) -> bool:
        try:
            for conn in psutil.net_connections(kind="inet"):
                if conn.laddr.port == 18790 and conn.status == "LISTEN":
                    return True
        except (psutil.AccessDenied, PermissionError):
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
        }


gateway_manager = GatewayManager()

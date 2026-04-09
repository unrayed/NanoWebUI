import json
import os
from pathlib import Path
from pydantic import BaseModel, Field
from typing import Any

DEFAULT_CONFIG_PATH = Path.home() / ".nanobot" / "config.json"


class ProviderConfig(BaseModel):
    apiKey: str = ""
    apiBase: str | None = None
    extraHeaders: dict[str, str] | None = None


class HeartbeatConfig(BaseModel):
    enabled: bool = True
    intervalS: int = 1800
    keepRecentMessages: int = 8


class DreamConfig(BaseModel):
    intervalH: int = 2
    modelOverride: str | None = None
    maxBatchSize: int = 20
    maxIterations: int = 10


class AgentDefaults(BaseModel):
    workspace: str = str(Path.home() / ".nanobot" / "workspace")
    model: str = "anthropic/claude-opus-4-5"
    provider: str = "auto"
    maxTokens: int = 8192
    contextWindowTokens: int = 65536
    contextBlockLimit: int | None = None
    temperature: float = 0.1
    maxToolIterations: int = 200
    maxToolResultChars: int = 16000
    providerRetryMode: str = "standard"
    reasoningEffort: str | None = None
    logThoughtBlocks: bool = False
    timezone: str = "UTC"
    unifiedSession: bool = False
    dream: DreamConfig = Field(default_factory=DreamConfig)


class AgentsConfig(BaseModel):
    defaults: AgentDefaults = Field(default_factory=AgentDefaults)


class ChannelsConfig(BaseModel):
    sendProgress: bool = True
    sendToolHints: bool = False
    sendMaxRetries: int = 3
    transcriptionProvider: str = "groq"


class WebSearchConfig(BaseModel):
    provider: str = "duckduckgo"
    apiKey: str = ""
    baseUrl: str = ""
    maxResults: int = 5
    timeout: int = 30


class WebToolsConfig(BaseModel):
    enable: bool = True
    proxy: str | None = None
    search: WebSearchConfig = Field(default_factory=WebSearchConfig)


class ExecToolConfig(BaseModel):
    enable: bool = True
    timeout: int = 60
    pathAppend: str = ""
    sandbox: str = ""


class MCPServerConfig(BaseModel):
    type: str | None = None
    command: str = ""
    args: list[str] = []
    env: dict[str, str] = {}
    url: str = ""
    headers: dict[str, str] = {}
    toolTimeout: int = 30
    enabledTools: list[str] = ["*"]


class ToolsConfig(BaseModel):
    web: WebToolsConfig = Field(default_factory=WebToolsConfig)
    exec: ExecToolConfig = Field(default_factory=ExecToolConfig)
    restrictToWorkspace: bool = False
    mcpServers: dict[str, MCPServerConfig] = {}
    ssrfWhitelist: list[str] = []


class ApiConfig(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8900
    timeout: float = 120.0


class GatewayConfig(BaseModel):
    host: str = "0.0.0.0"
    port: int = 18790
    heartbeat: HeartbeatConfig = Field(default_factory=HeartbeatConfig)


class Config(BaseModel):
    agents: AgentsConfig = Field(default_factory=AgentsConfig)
    channels: ChannelsConfig = Field(default_factory=ChannelsConfig)
    providers: dict[str, ProviderConfig] = Field(default_factory=dict)
    api: ApiConfig = Field(default_factory=ApiConfig)
    gateway: GatewayConfig = Field(default_factory=GatewayConfig)
    tools: ToolsConfig = Field(default_factory=ToolsConfig)


def _make_default_providers() -> dict[str, ProviderConfig]:
    names = [
        "custom", "azureOpenai", "anthropic", "openai", "openrouter",
        "deepseek", "groq", "zhipu", "dashscope", "vllm", "ollama",
        "ovms", "gemini", "moonshot", "minimax", "mistral", "stepfun",
        "xiaomiMimo", "aihubmix", "siliconflow", "volcengine",
        "volcengineCodingPlan", "byteplus", "byteplusCodingPlan", "qianfan",
    ]
    return {name: ProviderConfig() for name in names}


def load_config(path: str | None = None) -> Config:
    config_path = Path(path) if path else DEFAULT_CONFIG_PATH
    if not config_path.exists():
        cfg = Config()
        cfg.providers = _make_default_providers()
        return cfg
    with open(config_path, encoding="utf-8") as f:
        raw = json.load(f)
    try:
        return Config(**raw)
    except Exception:
        cfg = Config()
        cfg.providers = _make_default_providers()
        return cfg


def save_config(config: Config, path: str | None = None):
    config_path = Path(path) if path else DEFAULT_CONFIG_PATH
    config_path.parent.mkdir(parents=True, exist_ok=True)
    dump = config.model_dump(by_alias=True, exclude_none=False)
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(dump, f, indent=2)


def get_config_path() -> str:
    env_path = os.environ.get("NANOBOT_CONFIG_PATH")
    if env_path:
        return env_path
    return str(DEFAULT_CONFIG_PATH)

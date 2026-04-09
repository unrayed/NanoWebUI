# NanoWebUI

A modern web UI for managing [nanobot](https://github.com/nickfleck/nanobot) AI agent. Configure providers, manage settings, monitor gateway status, and view logs — all from a polished dashboard.

## Features

- **Authentication** — JWT-based auth with default `admin/admin`, forced password change on first login
- **Config Editor** — Visual editor for all nanobot config sections (agent, providers, tools, channels, gateway)
- **Provider Management** — Configure 20+ LLM providers with API key testing
- **Gateway Control** — Start/stop/restart the nanobot gateway (local mode)
- **Live Logs** — Real-time log streaming via WebSocket (local mode)
- **Two Modes** — Local (full control) and Remote (config-only for Docker deployments)

## Quick Start

### Development

**Backend:**
```bash
cd backend
pip install -e .
python -m app.main
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

The backend runs on `http://localhost:3000` and proxies API requests during development.

### Docker

```bash
docker compose up -d
```

Access at `http://localhost:3000`. Default login: `admin` / `admin`.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Backend bind host | `0.0.0.0` |
| `PORT` | Backend port | `3000` |
| `NANOWEBUI_SECRET_KEY` | JWT signing key | (dev default) |
| `NANOBOT_CONFIG_PATH` | Path to nanobot config.json | `~/.nanobot/config.json` |
| `NANOBOT_URL` | Set to enable remote mode | (unset = local mode) |

### Remote Mode

When running nanobot and NanoWebUI in separate containers, set `NANOBOT_URL` to point to the nanobot instance:

```yaml
environment:
  - NANOBOT_URL=http://nanobot:18790
```

In remote mode, gateway control and log streaming are unavailable. Config editing works normally.

## Project Structure

```
NanoWebUI/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── auth.py              # User auth & password management
│   │   ├── token.py             # JWT utilities
│   │   ├── nanobot_config.py    # Config schema & I/O
│   │   ├── gateway.py           # Gateway subprocess manager
│   │   ├── providers.py         # Provider metadata registry
│   │   └── routes/              # API route handlers
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/client.ts        # Axios instance with auth
│   │   ├── stores/              # Zustand state stores
│   │   ├── components/          # Reusable UI components
│   │   └── pages/               # Page components
│   └── package.json
├── Dockerfile
└── docker-compose.yml
```

## License

MIT

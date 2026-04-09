FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app

RUN pip install --no-cache-dir \
    fastapi \
    uvicorn[standard] \
    pydantic \
    pydantic-settings \
    python-jose[cryptography] \
    passlib[bcrypt] \
    psutil \
    websockets \
    httpx

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist/

ENV HOST=0.0.0.0
ENV PORT=3000

EXPOSE 3000

CMD ["python", "-m", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "3000"]

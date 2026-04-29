import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from api.models.model_manager import ModelManager
from api.routers import live_stream, video_upload

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"

model_manager = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model_manager

    print("\n" + "=" * 60)
    print("SECURE VISION - Starting up...")
    print("=" * 60 + "\n")

    os.makedirs("uploads", exist_ok=True)
    print("✓ Uploads directory ready")

    print("\n Loading AI models...")
    model_manager = ModelManager()
    model_manager.get_violence_model()
    model_manager.get_report_model()

    print("\n" + "=" * 60)
    print("✓ Secure Vision is ready!")
    print("=" * 60 + "\n")

    yield


app = FastAPI(
    title="Secure Vision API",
    description="Real-time violence detection with video upload and live camera streaming",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount frontend static assets
if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

# Register API and WebSocket routers first
app.include_router(video_upload.router, prefix="/api", tags=["Video Upload"])
app.include_router(live_stream.router, tags=["Live Stream"])


@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "Secure Vision API",
        "models_loaded": model_manager is not None
    }


@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Catch-all route — serves React SPA for all non-API routes (enables React Router)."""
    frontend_index = FRONTEND_DIST_DIR / "index.html"
    if frontend_index.exists():
        return FileResponse(frontend_index)
    return {"error": "Frontend not built. Run: cd frontend && npm run build"}

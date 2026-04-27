"""
FastAPI Main Application - Secure Vision Web Interface
"""
import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from api.models.model_manager import ModelManager
from api.routers import video_upload, live_stream

# Initialize FastAPI app
app = FastAPI(
    title="Secure Vision API",
    description="Real-time violence detection with video upload and live camera streaming",
    version="1.0.0"
)

# CORS middleware for browser access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIST_DIR = BASE_DIR / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=assets_dir), name="frontend-assets")

# Global model manager instance
model_manager = None


@app.on_event("startup")
async def startup_event():
    """Initialize models and create required directories on startup"""
    global model_manager

    print("\n" + "="*60)
    print("SECURE VISION - Starting up...")
    print("="*60 + "\n")

    # Create uploads directory if it doesn't exist
    os.makedirs("uploads", exist_ok=True)
    print("✓ Uploads directory ready")

    # Initialize model manager (loads models)
    print("\n Loading AI models...")
    model_manager = ModelManager()

    # Pre-load models
    model_manager.get_violence_model()
    model_manager.get_report_model()

    print("\n" + "="*60)
    print("✓ Secure Vision is ready!")
    print("="*60 + "\n")


@app.get("/")
async def root():
    """Serve the React frontend build."""
    frontend_index = FRONTEND_DIST_DIR / "index.html"
    return FileResponse(frontend_index)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Secure Vision API",
        "models_loaded": model_manager is not None
    }


# Register routers
app.include_router(video_upload.router, prefix="/api", tags=["Video Upload"])
app.include_router(live_stream.router, tags=["Live Stream"])

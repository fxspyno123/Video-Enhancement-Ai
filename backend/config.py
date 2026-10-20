import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
PROCESSED_FOLDER = BASE_DIR / "processed"
MODELS_DIR = BASE_DIR / "models"
TEMP_FOLDER = BASE_DIR / "temp"

# Create required directories
for folder in [UPLOAD_FOLDER, PROCESSED_FOLDER, MODELS_DIR, TEMP_FOLDER]:
    folder.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "enhanceai-studio-secret-key-2026")
    MAX_CONTENT_LENGTH = 1024 * 1024 * 1024  # 1 GB
    ALLOWED_EXTENSIONS = {"mp4", "mov", "mkv", "avi", "webm", "m4v"}
    UPLOAD_FOLDER = str(UPLOAD_FOLDER)
    PROCESSED_FOLDER = str(PROCESSED_FOLDER)
    MODELS_DIR = str(MODELS_DIR)
    TEMP_FOLDER = str(TEMP_FOLDER)
    FFMPEG_BINARY = os.getenv("FFMPEG_BINARY", "ffmpeg")
    FFPROBE_BINARY = os.getenv("FFPROBE_BINARY", "ffprobe")
    DEVICE = "cuda" if os.getenv("USE_CUDA", "true").lower() == "true" else "cpu"
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

from fastapi import APIRouter, UploadFile, File, HTTPException, Request
import os
import uuid

from app.config import settings
from app.security import apply_rate_limit, save_upload_file

router = APIRouter()


def ensure_local_vision_enabled() -> None:
    if not settings.enable_local_vision:
        raise HTTPException(
            status_code=503,
            detail="Uploads are disabled in this environment. Deploy local vision separately if needed."
        )

@router.post("/image")
async def upload_image(request: Request, file: UploadFile = File(...)):
    """Generic image upload endpoint."""
    ensure_local_vision_enabled()
    apply_rate_limit(
        request,
        "upload-image",
        "image",
        settings.detect_rate_limit_count,
        settings.detect_rate_limit_window_seconds,
    )

    # Generate unique filename
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1].lower()
    filename = f"{file_id}{ext}"
    file_path = os.path.join(settings.uploads_dir, filename)
    
    os.makedirs(settings.uploads_dir, exist_ok=True)
    await save_upload_file(file, file_path, settings.max_upload_bytes, {'.jpg', '.jpeg', '.png', '.webp'})
    
    return {
        "file_id": file_id,
        "filename": filename,
        "url": f"/uploads/{filename}"
    }

@router.post("/video")
async def upload_video(request: Request, file: UploadFile = File(...)):
    """Video upload for equipment scanning."""
    ensure_local_vision_enabled()
    apply_rate_limit(
        request,
        "upload-video",
        "video",
        settings.detect_rate_limit_count,
        settings.detect_rate_limit_window_seconds,
    )
    
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename or "")[1].lower()
    filename = f"{file_id}{ext}"
    file_path = os.path.join(settings.uploads_equipment_dir, filename)
    
    os.makedirs(settings.uploads_equipment_dir, exist_ok=True)
    await save_upload_file(file, file_path, settings.max_upload_bytes, {'.mp4', '.mov', '.webm', '.avi'})
    
    return {
        "file_id": file_id,
        "filename": filename,
        "url": f"/uploads/equipment/{filename}"
    }

@router.delete("/{file_id}")
async def delete_file(file_id: str):
    """Delete an uploaded file."""
    ensure_local_vision_enabled()
    if settings.is_production:
        raise HTTPException(403, "File deletion is disabled in production.")
    # Search for file with this ID
    for root, dirs, files in os.walk(settings.uploads_dir):
        for filename in files:
            if os.path.splitext(filename)[0] == file_id:
                os.remove(os.path.join(root, filename))
                return {"message": "File deleted"}
    
    raise HTTPException(404, "File not found")

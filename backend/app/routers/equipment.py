import logging
import os
import uuid
from typing import List

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from sqlalchemy.orm import Session

from app.config import settings
from app.models.database import EquipmentScan, get_db
from app.security import apply_rate_limit, save_upload_file
from app.services.detection_service import EquipmentDetector

router = APIRouter()
logger = logging.getLogger("optifit.equipment")

# Initialize detector
detector = EquipmentDetector()


def ensure_local_vision_enabled() -> None:
    if not settings.enable_local_vision and settings.cloud_vision_provider not in {"openai", "gemini"}:
        raise HTTPException(
            status_code=503,
            detail="Upload analysis is disabled in this environment. Use manual equipment selection instead."
        )


IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
VIDEO_EXTENSIONS = {'.mp4', '.mov', '.webm'}
ALLOWED_EXTENSIONS = IMAGE_EXTENSIONS | VIDEO_EXTENSIONS


async def _detect_equipment_batch_files(
    files: List[UploadFile],
    confidence: float,
):
    all_detections = []
    all_equipment = set()
    processed_files = 0

    for upload in files:
        ext = os.path.splitext(upload.filename or "")[1].lower()
        if ext not in IMAGE_EXTENSIONS:
            continue

        file_id = str(uuid.uuid4())
        file_path = os.path.join(settings.uploads_equipment_dir, f"{file_id}{ext}")

        os.makedirs(settings.uploads_equipment_dir, exist_ok=True)
        await save_upload_file(upload, file_path, settings.max_upload_bytes, IMAGE_EXTENSIONS)

        try:
            detections = detector.detect(file_path, confidence_threshold=confidence)
            all_detections.extend(detections)
            all_equipment.update(d["label"] for d in detections)
            processed_files += 1
        except Exception:
            logger.exception("batch_detection_failed filename=%s", upload.filename)

    if processed_files == 0:
        raise HTTPException(422, "Batch scan requires at least one supported image file.")

    unique_equipment = {}
    for det in all_detections:
        label = det["label"]
        if label not in unique_equipment or unique_equipment[label]["confidence"] < det["confidence"]:
            unique_equipment[label] = det

    unique_detections = sorted(
        unique_equipment.values(),
        key=lambda det: (-float(det.get("confidence", 0)), det.get("label", "")),
    )

    return {
        "scan_id": str(uuid.uuid4()),
        "filename": "batch_scan",
        "detections": unique_detections,
        "equipment_found": sorted(all_equipment),
        "annotated_image": None,
        "total_items": len(unique_detections),
        "files_processed": processed_files,
        "total_scans": len(files),
        "detection_mode": detector.mode,
    }

@router.post("/detect")
async def detect_equipment(
    request: Request,
    file: UploadFile | None = File(None),
    files: List[UploadFile] | None = File(None),
    confidence: float = Form(0.5),
    db: Session = Depends(get_db)
):
    """Upload image/video and detect equipment."""
    ensure_local_vision_enabled()

    uploads = files or ([file] if file is not None else [])
    if not uploads:
        raise HTTPException(400, "No file provided")
    if len(uploads) > 5:
        raise HTTPException(400, "Upload at most 5 files per scan.")

    apply_rate_limit(
        request,
        "equipment-detect",
        "scan",
        settings.detect_rate_limit_count,
        settings.detect_rate_limit_window_seconds,
    )

    if len(uploads) > 1:
        if any(os.path.splitext(upload.filename or "")[1].lower() in VIDEO_EXTENSIONS for upload in uploads):
            raise HTTPException(422, "Batch scan supports images only. Upload one video at a time.")
        return await _detect_equipment_batch_files(uploads, confidence)

    upload = uploads[0]

    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"Unsupported file type: {ext}")
    if ext in VIDEO_EXTENSIONS and detector.mode != "local":
        raise HTTPException(422, "Video analysis is only available in local vision mode. Upload photos instead.")
    
    # Save file
    file_id = str(uuid.uuid4())
    filename = f"{file_id}{ext}"
    file_path = os.path.join(settings.uploads_equipment_dir, filename)
    
    os.makedirs(settings.uploads_equipment_dir, exist_ok=True)
    await save_upload_file(upload, file_path, settings.max_upload_bytes, ALLOWED_EXTENSIONS)
    
    # Detect equipment
    try:
        if ext in {'.mp4', '.mov', '.webm'}:
            detections = detector.detect_from_video(file_path)
        else:
            detections = detector.detect(file_path, confidence_threshold=confidence)
        
        # Annotate image for response
        annotated_path = None
        if ext not in {'.mp4', '.mov', '.webm'}:
            annotated_path = detector.annotate_image(file_path, detections)
    
    except HTTPException:
        raise
    except Exception:
        logger.exception("detection_failed filename=%s mode=%s", upload.filename, detector.mode)
        raise HTTPException(500, "Detection failed. Please try again with a clearer image or switch to manual selection.")
    
    # Extract unique equipment names
    equipment_list = sorted(set(d["label"] for d in detections))
    
    # Save scan to database (optional - for logged-in users)
    # scan = EquipmentScan(
    #     user_id=current_user.id,
    #     image_path=file_path,
    #     detected_equipment=detections
    # )
    # db.add(scan)
    # db.commit()
    
    return {
        "scan_id": file_id,
        "filename": filename,
        "detections": detections,
        "equipment_found": equipment_list,
        "annotated_image": f"/uploads/equipment/{os.path.basename(annotated_path)}" if annotated_path else None,
        "total_items": len(detections),
        "detection_mode": detector.mode,
    }

@router.post("/detect/batch")
async def detect_equipment_batch(
    request: Request,
    files: List[UploadFile] = File(...),
    confidence: float = Form(0.5)
):
    """Upload multiple images for better coverage."""
    ensure_local_vision_enabled()
    if len(files) > 5:
        raise HTTPException(400, "Upload at most 5 files per scan.")

    apply_rate_limit(
        request,
        "equipment-detect",
        "batch",
        settings.detect_rate_limit_count,
        settings.detect_rate_limit_window_seconds,
    )
    
    if any(os.path.splitext(upload.filename or "")[1].lower() in VIDEO_EXTENSIONS for upload in files):
        raise HTTPException(422, "Batch scan supports images only. Upload one video at a time.")

    return await _detect_equipment_batch_files(files, confidence)

@router.get("/equipment-types")
async def get_equipment_types():
    """List all detectable equipment types."""
    return {
        "categories": [
            {
                "id": "free_weights",
                "name": "Free Weights",
                "items": ["barbell", "dumbbell", "kettlebell", "medicine_ball"]
            },
            {
                "id": "machines", 
                "name": "Machines",
                "items": ["squat_rack", "cable_machine", "leg_press", "lat_pulldown"]
            },
            {
                "id": "bodyweight",
                "name": "Bodyweight",
                "items": ["pull_up_bar", "yoga_mat", "dip_station"]
            },
            {
                "id": "accessories",
                "name": "Accessories",
                "items": ["resistance_band", "jump_rope", "foam_roller"]
            }
        ],
        "total_detectable": 20
    }

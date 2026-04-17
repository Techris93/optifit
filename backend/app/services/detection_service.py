import base64
import json
import logging
import os
import re
import tempfile
from pathlib import Path
from typing import Any, Dict, List

from app.config import settings

try:
    import cv2
except ImportError:
    cv2 = None

try:
    from ultralytics import YOLO

    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False


logger = logging.getLogger("optifit.detection")


class EquipmentDetector:
    """Detection service that supports local YOLO or cloud multimodal providers."""

    EQUIPMENT_CLASSES = {
        0: "barbell",
        1: "dumbbell",
        2: "kettlebell",
        3: "bench",
        4: "pull_up_bar",
        5: "resistance_band",
        6: "yoga_mat",
        7: "jump_rope",
        8: "medicine_ball",
        9: "squat_rack",
        10: "cable_machine",
        12: "leg_press",
        13: "lat_pulldown",
        14: "treadmill",
        15: "rowing_machine",
    }

    SUPPORTED_LABELS = {
        "barbell",
        "bench",
        "cable_machine",
        "dip_station",
        "dumbbell",
        "foam_roller",
        "jump_rope",
        "kettlebell",
        "lat_pulldown",
        "leg_press",
        "medicine_ball",
        "pull_up_bar",
        "resistance_band",
        "rowing_machine",
        "squat_rack",
        "treadmill",
        "yoga_mat",
    }

    LABEL_ALIASES = {
        "barbells": "barbell",
        "bar bell": "barbell",
        "barbells and plates": "barbell",
        "dumbbells": "dumbbell",
        "db": "dumbbell",
        "bench press bench": "bench",
        "weight bench": "bench",
        "flat bench": "bench",
        "adjustable bench": "bench",
        "kettlebells": "kettlebell",
        "pullup bar": "pull_up_bar",
        "pull-up bar": "pull_up_bar",
        "chin-up bar": "pull_up_bar",
        "resistance bands": "resistance_band",
        "bands": "resistance_band",
        "mat": "yoga_mat",
        "exercise mat": "yoga_mat",
        "yoga mat": "yoga_mat",
        "medicine ball": "medicine_ball",
        "squat stand": "squat_rack",
        "power rack": "squat_rack",
        "rack": "squat_rack",
        "cables": "cable_machine",
        "cable station": "cable_machine",
        "lat pulldown": "lat_pulldown",
        "lat pull-down": "lat_pulldown",
        "leg press machine": "leg_press",
        "rower": "rowing_machine",
        "rowing erg": "rowing_machine",
        "foam roller": "foam_roller",
        "dip bars": "dip_station",
    }

    def __init__(self, model_path: str | None = None):
        self.model = None
        self.model_path = model_path or "models/yolov8m_fitness.pt"
        self.allow_fallback_download = os.getenv("ALLOW_YOLO_FALLBACK_DOWNLOAD", "false").lower() == "true"

    @property
    def mode(self) -> str:
        provider = settings.cloud_vision_provider
        if provider in {"openai", "gemini"}:
            return provider
        return "local"

    def load_model(self):
        if not YOLO_AVAILABLE:
            raise RuntimeError("Ultralytics not installed. Run: pip install ultralytics")

        if Path(self.model_path).exists():
            self.model = YOLO(self.model_path)
            return

        if not self.allow_fallback_download:
            raise RuntimeError(
                f"Detection model not found at {self.model_path}. "
                "Upload analysis is local-only by default, so no fallback model will be downloaded automatically."
            )

        self.model = YOLO("yolov8n.pt")

    def detect(self, image_path: str, confidence_threshold: float = 0.5) -> List[Dict[str, Any]]:
        if self.mode == "openai":
            return self.detect_with_openai(image_path)
        if self.mode == "gemini":
            return self.detect_with_gemini(image_path)
        return self.detect_with_local_model(image_path, confidence_threshold)

    def detect_with_local_model(self, image_path: str, confidence_threshold: float = 0.5) -> List[Dict[str, Any]]:
        if self.model is None:
            self.load_model()

        results = self.model(image_path, conf=confidence_threshold)[0]
        detections = []
        for box in results.boxes:
            cls_id = int(box.cls.item())
            confidence = float(box.conf.item())
            bbox = box.xyxy[0].tolist()
            equipment_name = self.EQUIPMENT_CLASSES.get(cls_id, f"equipment_{cls_id}")
            detections.append(
                {
                    "label": equipment_name,
                    "confidence": round(confidence, 3),
                    "bbox": [round(x, 2) for x in bbox],
                    "class_id": cls_id,
                }
            )
        return detections

    def detect_with_openai(self, image_path: str) -> List[Dict[str, Any]]:
        if not settings.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY is required when CLOUD_VISION_PROVIDER=openai")

        requests = self._requests()
        mime_type = self._guess_mime_type(image_path)
        encoded_image = self._encode_file(image_path)
        prompt = self._cloud_prompt()
        response = requests.post(
            "https://api.openai.com/v1/responses",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_vision_model,
                "input": [
                    {
                        "role": "user",
                        "content": [
                            {"type": "input_text", "text": prompt},
                            {
                                "type": "input_image",
                                "image_url": f"data:{mime_type};base64,{encoded_image}",
                                "detail": "low",
                            },
                        ],
                    }
                ],
                "max_output_tokens": 500,
            },
            timeout=settings.cloud_vision_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        output_text = payload.get("output_text") or self._extract_openai_output_text(payload)
        return self._normalize_cloud_detections(output_text)

    def detect_with_gemini(self, image_path: str) -> List[Dict[str, Any]]:
        if not settings.gemini_api_key:
            raise RuntimeError("GEMINI_API_KEY is required when CLOUD_VISION_PROVIDER=gemini")

        requests = self._requests()
        mime_type = self._guess_mime_type(image_path)
        encoded_image = self._encode_file(image_path)
        prompt = self._cloud_prompt()
        response = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_vision_model}:generateContent",
            params={"key": settings.gemini_api_key},
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [
                            {"text": prompt},
                            {"inline_data": {"mime_type": mime_type, "data": encoded_image}},
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                },
            },
            timeout=settings.cloud_vision_timeout_seconds,
        )
        response.raise_for_status()
        payload = response.json()
        output_text = self._extract_gemini_output_text(payload)
        return self._normalize_cloud_detections(output_text)

    def detect_from_video(self, video_path: str, sample_every_n_frames: int = 30) -> List[Dict[str, Any]]:
        if self.mode != "local":
            raise RuntimeError("Cloud vision mode currently supports images only. Use photo uploads or manual selection.")

        if cv2 is None:
            raise RuntimeError("opencv-python-headless is required for video analysis")

        cap = cv2.VideoCapture(video_path)
        all_detections = []
        frame_count = 0
        temp_paths: list[str] = []

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                if frame_count % sample_every_n_frames == 0:
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".jpg") as temp_file:
                        temp_path = temp_file.name
                    temp_paths.append(temp_path)
                    cv2.imwrite(temp_path, frame)
                    all_detections.extend(self.detect(temp_path))

                frame_count += 1
        finally:
            cap.release()
            for temp_path in temp_paths:
                try:
                    os.remove(temp_path)
                except FileNotFoundError:
                    continue
                except OSError:
                    logger.warning("failed_to_remove_temp_frame path=%s", temp_path)

        unique_equipment = {}
        for det in all_detections:
            label = det["label"]
            if label not in unique_equipment or unique_equipment[label]["confidence"] < det["confidence"]:
                unique_equipment[label] = det

        return list(unique_equipment.values())

    def annotate_image(self, image_path: str, detections: List[Dict[str, Any]], output_path: str | None = None) -> str | None:
        if self.mode != "local":
            return None

        if cv2 is None:
            raise RuntimeError("opencv-python-headless is required for image annotation")

        img = cv2.imread(image_path)
        for det in detections:
            bbox = det.get("bbox") or []
            if len(bbox) != 4:
                continue

            x1, y1, x2, y2 = map(int, bbox)
            label = f"{det['label']} ({det['confidence']:.2f})"
            cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(img, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

        if output_path is None:
            output_path = image_path.replace(".", "_annotated.")

        cv2.imwrite(output_path, img)
        return output_path

    def _encode_file(self, image_path: str) -> str:
        return base64.b64encode(Path(image_path).read_bytes()).decode("utf-8")

    def _requests(self):
        try:
            import requests
        except ImportError as exc:
            raise RuntimeError("The requests package is required for cloud vision mode") from exc
        return requests

    def _guess_mime_type(self, image_path: str) -> str:
        suffix = Path(image_path).suffix.lower()
        if suffix in {".jpg", ".jpeg"}:
            return "image/jpeg"
        if suffix == ".png":
            return "image/png"
        if suffix == ".webp":
            return "image/webp"
        raise RuntimeError(f"Unsupported image type for cloud vision: {suffix}")

    def _cloud_prompt(self) -> str:
        labels = ", ".join(sorted(self.SUPPORTED_LABELS))
        return (
            "You analyze gym and home workout setup images. "
            "Return only JSON with the shape "
            '{"detections":[{"label":"dumbbell","confidence":0.92}]}. '
            "Use only these canonical labels: "
            f"{labels}. "
            "Include only equipment clearly visible in the image. "
            "Confidence must be between 0 and 1. "
            "Do not include explanations, markdown, or labels outside the allowed set."
        )

    def _extract_openai_output_text(self, payload: Dict[str, Any]) -> str:
        texts: List[str] = []
        for item in payload.get("output", []):
            for content in item.get("content", []):
                text = content.get("text")
                if text:
                    texts.append(text)
        return "\n".join(texts)

    def _extract_gemini_output_text(self, payload: Dict[str, Any]) -> str:
        texts: List[str] = []
        for candidate in payload.get("candidates", []):
            content = candidate.get("content", {})
            for part in content.get("parts", []):
                text = part.get("text")
                if text:
                    texts.append(text)
        return "\n".join(texts)

    def _normalize_cloud_detections(self, raw_text: str) -> List[Dict[str, Any]]:
        cleaned_text = self._strip_code_fences(raw_text)
        payload = json.loads(cleaned_text) if cleaned_text else {"detections": []}
        detections = payload.get("detections", [])
        normalized = []
        for idx, detection in enumerate(detections):
            label = self._normalize_label(str(detection.get("label", "")))
            if not label:
                continue

            try:
                confidence = float(detection.get("confidence", 0.5))
            except (TypeError, ValueError):
                confidence = 0.5

            normalized.append(
                {
                    "label": label,
                    "confidence": max(0.0, min(round(confidence, 3), 1.0)),
                    "bbox": [],
                    "class_id": None,
                    "source_index": idx,
                }
            )
        return normalized

    def _normalize_label(self, label: str) -> str | None:
        slug = re.sub(r"[^a-z0-9]+", "_", label.strip().lower()).strip("_")
        slug = self.LABEL_ALIASES.get(slug, slug)
        if slug in self.SUPPORTED_LABELS:
            return slug
        return None

    def _strip_code_fences(self, value: str) -> str:
        stripped = value.strip()
        if stripped.startswith("```"):
            stripped = re.sub(r"^```[a-zA-Z0-9_-]*\n?", "", stripped)
            stripped = re.sub(r"\n?```$", "", stripped)
        return stripped.strip()

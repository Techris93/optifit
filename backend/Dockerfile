FROM python:3.11-slim

WORKDIR /app

ARG INSTALL_VISION=false

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt .
COPY backend/requirements-vision.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN if [ "$INSTALL_VISION" = "true" ]; then pip install --no-cache-dir -r requirements-vision.txt; fi
RUN if [ "$INSTALL_VISION" = "true" ]; then python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"; fi

# Copy application code
COPY backend/app ./app
COPY database ./database

# Create upload directories
RUN mkdir -p uploads/equipment

# Initialize database
RUN python -c "
from app.models.database import Base, engine
Base.metadata.create_all(bind=engine)
"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

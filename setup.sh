#!/bin/bash

# OptiFit Setup Script

echo "🏋️  OptiFit Setup"
echo "=================="

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed"
    exit 1
fi

echo "✅ Python and Node.js found"

PYTHON_BIN="python3"
if command -v python3.10 &> /dev/null; then
    PYTHON_BIN="python3.10"
fi

echo "🐍 Using ${PYTHON_BIN} for backend setup"

# Setup backend
echo ""
echo "📦 Setting up backend..."
cd backend
"${PYTHON_BIN}" -m venv venv
source venv/bin/activate || . venv/Scripts/activate
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python -c "
from app.models.database import Base, engine
Base.metadata.create_all(bind=engine)
print('Database created')
"

# Seed data
echo "🌱 Seeding exercise data..."
python ../database/seed_data/seed_exercises.py

cd ..

# Setup frontend
echo ""
echo "📦 Setting up frontend..."
cd frontend
npm install

cd ..

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the app:"
echo "  ./run-local.sh"
echo ""
echo "Optional local-only analysis stack:"
echo "  cd backend && source venv/bin/activate && pip install -r requirements-vision.txt"
echo "  Put your local model at backend/models/yolov8m_fitness.pt"
echo ""
echo "Or use Docker: docker-compose up --build"

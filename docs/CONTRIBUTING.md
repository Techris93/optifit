# Contributing

## Local Setup

```bash
git clone https://github.com/Techris93/optifit.git
cd optifit
./setup.sh
cp .env.example .env
```

Optional local-only analysis setup:

```bash
cd backend
source venv/bin/activate
pip install -r requirements-vision.txt
```

Start the backend and frontend in separate shells:

```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

```bash
cd frontend
npm run dev
```

## Expectations

- Keep API request and response shapes aligned with the frontend.
- Prefer small patches with clear intent.
- Update docs when behavior or setup changes.
- Do not add placeholder routes or dead README steps.
- Keep the browser flow reliable even when optional AI services are unavailable.

## Verification

- Backend: `python3 -m compileall backend/app`
- Frontend: `npm run build`

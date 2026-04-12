# OptiFit Deployment Guide

This guide covers deploying OptiFit to Render with Gemini API integration.

## Prerequisites

- GitHub account
- Render account (https://render.com)
- Gemini API key (https://ai.google.dev/)

## Deployment Steps

### 1. Push to GitHub

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit with Gemini API integration"

# Add your GitHub repository as remote
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Render

#### Option A: Using Render Dashboard (Recommended)

1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically detect `render.yaml` and create both services

#### Option B: Manual Service Creation

**Backend Service (optifit-api):**
1. Click "New +" → "Web Service"
2. Connect your GitHub repo
3. Configure:
   - **Name:** optifit-api
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory:** `backend`
4. Add Environment Variables (see below)
5. Add Disk:
   - **Name:** optifit-data
   - **Mount Path:** `/opt/render/project/data`
   - **Size:** 1 GB

**Frontend Service (optifit-web):**
1. Click "New +" → "Static Site"
2. Connect your GitHub repo
3. Configure:
   - **Name:** optifit-web
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
   - **Root Directory:** `frontend`
4. Add Environment Variables (see below)

### 3. Required Environment Variables

#### Backend (optifit-api)

| Variable | Value | Source |
|----------|-------|--------|
| `GEMINI_API_KEY` | Your Gemini API key | Render Dashboard |
| `CORS_ORIGINS` | Your frontend URL | Render Dashboard |
| `JWT_SECRET` | Auto-generated | Render (auto) |

**Note:** Your Gemini API key should already be set in your Render environment.

#### Frontend (optifit-web)

| Variable | Value | Example |
|----------|-------|---------|
| `VITE_API_URL` | Your backend URL + `/api` | `https://optifit-api.onrender.com/api` |
| `VITE_ENABLE_ANALYZE` | `true` | `true` |

### 4. Post-Deployment Configuration

1. **Get your backend URL** (e.g., `https://optifit-api.onrender.com`)
2. **Update frontend environment variable:**
   - Go to optifit-web service → Environment
   - Set `VITE_API_URL` to `https://optifit-api.onrender.com/api`
   - Redeploy frontend

3. **Update backend CORS:**
   - Go to optifit-api service → Environment
   - Set `CORS_ORIGINS` to your frontend URL (e.g., `https://optifit-web.onrender.com`)
   - Redeploy backend

### 5. Verify Deployment

Check these endpoints:
- Health: `https://optifit-api.onrender.com/health`
- Ready: `https://optifit-api.onrender.com/readyz`

Both should return status information including the detection mode.

## Gemini API Configuration

The application is pre-configured to use Gemini for:

1. **Equipment Detection** (Vision API)
   - Model: `gemini-2.5-flash`
   - Analyzes uploaded gym equipment photos

2. **Workout Generation** (Text API)
   - Model: `gemini-2.5-flash`
   - Generates personalized workout plans

### Setting Your Gemini API Key

1. Go to https://ai.google.dev/ to get your API key
2. In Render Dashboard:
   - Go to your `optifit-api` service
   - Click "Environment" tab
   - Add `GEMINI_API_KEY` with your key
   - Click "Save Changes"
   - The service will auto-redeploy

## Troubleshooting

### Build Failures

**Backend:**
```bash
# Check Python version (should be 3.10+)
python --version

# Verify requirements.txt exists in backend/
ls backend/requirements.txt
```

**Frontend:**
```bash
# Check Node.js version (should be 18+)
node --version

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Connection Issues

1. Verify `VITE_API_URL` is set correctly in frontend environment
2. Verify `CORS_ORIGINS` includes your frontend URL in backend environment
3. Check backend logs for CORS errors

### Gemini API Issues

1. Verify `GEMINI_API_KEY` is set in backend environment
2. Check backend logs for API errors
3. Test the API key locally:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{
    "contents": [{"parts":[{"text": "Hello"}]}]
  }'
```

## Updating the Application

After making changes:

```bash
git add .
git commit -m "Your changes"
git push origin main
```

Render will automatically redeploy both services.

## Monitoring

- **Backend Logs:** Render Dashboard → optifit-api → Logs
- **Frontend Deploys:** Render Dashboard → optifit-web → Deploys
- **Health Checks:** The `/readyz` endpoint monitors database connectivity

## Support

For issues:
1. Check Render logs for error messages
2. Verify all environment variables are set
3. Ensure Gemini API key has sufficient quota

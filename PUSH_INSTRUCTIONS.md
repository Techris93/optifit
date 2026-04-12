# Push to GitHub & Deploy to Render

Follow these steps to push your code to GitHub and deploy on Render.

## Step 1: Create a GitHub Repository

1. Go to https://github.com/new
2. Enter repository name: `optifit` (or your preferred name)
3. Choose visibility: Public or Private
4. **Do NOT initialize with README** (we already have one)
5. Click "Create repository"

## Step 2: Push to GitHub

### Option A: Using the Helper Script

```bash
cd /mnt/okcomputer/output/optifit-deploy
./push-to-github.sh
```

The script will prompt you for:
- Your GitHub repository URL
- Git username and email (if not set)
- Commit message

### Option B: Manual Push

```bash
cd /mnt/okcomputer/output/optifit-deploy

# Configure git (if not already done)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# Add your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/optifit.git

# Stage all files
git add .

# Commit
git commit -m "Initial commit with Gemini API integration"

# Push to main branch
git branch -M main
git push -u origin main
```

## Step 3: Deploy on Render

### Method 1: Blueprint (Recommended)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Blueprint"**
3. Connect your GitHub account
4. Select your `optifit` repository
5. Render will automatically detect `render.yaml` and create both services:
   - `optifit-api` (Python backend)
   - `optifit-web` (Static frontend)

### Method 2: Manual Creation

#### Backend Service (optifit-api)

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `optifit-api`
   - **Runtime:** `Python 3`
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add Environment Variables (see below)
5. Add Disk:
   - **Name:** `optifit-data`
   - **Mount Path:** `/opt/render/project/data`
   - **Size:** `1 GB`

#### Frontend Service (optifit-web)

1. Click **"New +"** → **"Static Site"**
2. Connect your GitHub repo
3. Configure:
   - **Name:** `optifit-web`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm ci && npm run build`
   - **Publish Directory:** `dist`
4. Add Environment Variables (see below)

## Step 4: Set Environment Variables

### Backend (optifit-api)

Go to your `optifit-api` service → **Environment** tab:

| Key | Value | Source |
|-----|-------|--------|
| `GEMINI_API_KEY` | Your Gemini API key | **Set in Render Dashboard** |
| `CORS_ORIGINS` | Your frontend URL | Set after frontend deploy |

**Note:** Your Gemini API key should already be in your Render environment.

### Frontend (optifit-web)

Go to your `optifit-web` service → **Environment** tab:

| Key | Value | Example |
|-----|-------|---------|
| `VITE_API_URL` | Backend URL + `/api` | `https://optifit-api.onrender.com/api` |
| `VITE_ENABLE_ANALYZE` | `true` | `true` |

## Step 5: Post-Deployment Configuration

1. **Wait for both services to deploy**

2. **Get your service URLs:**
   - Backend: `https://optifit-api-xxx.onrender.com`
   - Frontend: `https://optifit-web-xxx.onrender.com`

3. **Update CORS_ORIGINS** in backend:
   - Go to optifit-api → Environment
   - Set `CORS_ORIGINS` to your frontend URL
   - Save and redeploy

4. **Verify VITE_API_URL** in frontend:
   - Go to optifit-web → Environment
   - Ensure `VITE_API_URL` points to your backend + `/api`
   - Redeploy if changed

## Step 6: Verify Deployment

Test these endpoints:

```bash
# Health check
curl https://optifit-api-xxx.onrender.com/health

# Ready check
curl https://optifit-api-xxx.onrender.com/readyz
```

Both should return JSON with status information.

## Troubleshooting

### Git Push Failed

```bash
# Check remote URL
git remote -v

# If wrong, update it
git remote set-url origin https://github.com/YOUR_USERNAME/optifit.git

# Try pushing again
git push -u origin main
```

### Render Build Failed

1. Check logs in Render Dashboard
2. Verify `render.yaml` syntax
3. Ensure all required files are committed

### API Connection Issues

1. Verify `VITE_API_URL` includes `/api` suffix
2. Check `CORS_ORIGINS` includes frontend URL
3. Look for CORS errors in browser console

### Gemini Not Working

1. Verify `GEMINI_API_KEY` is set in Render Dashboard
2. Check backend logs for API errors
3. Test API key locally:
```bash
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_KEY" \
  -H 'Content-Type: application/json' \
  -X POST \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'
```

## Files Included

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint configuration |
| `.env.example` | Environment variables template |
| `DEPLOY.md` | Detailed deployment guide |
| `GEMINI_INTEGRATION.md` | Gemini API documentation |
| `push-to-github.sh` | GitHub push helper script |
| `render-setup.sh` | Render setup helper |

## Next Steps

After successful deployment:

1. 🎉 Test the live application
2. 📸 Try uploading a gym equipment photo
3. 🤖 Generate your first AI workout
4. 📊 Track your progress

## Support

- **Render Docs:** https://render.com/docs
- **Gemini API:** https://ai.google.dev/
- **GitHub Docs:** https://docs.github.com/

---

**Good luck with your deployment! 🚀**

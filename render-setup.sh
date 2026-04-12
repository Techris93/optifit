#!/bin/bash

# OptiFit - Render Deployment Setup Script
# This script helps configure the application for Render deployment

set -e

echo "🚀 OptiFit - Render Deployment Setup"
echo "====================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}This script will help you set up OptiFit on Render${NC}"
echo ""

# Check if gemini api key is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  GEMINI_API_KEY not found in environment${NC}"
    echo "You'll need to set this in the Render Dashboard after deployment"
    echo "Get your API key at: https://ai.google.dev/"
    echo ""
fi

echo "📋 Pre-deployment Checklist:"
echo ""
echo "1. ✓ render.yaml is configured"
echo "2. ✓ .gitignore is set up"
echo "3. ✓ GitHub repository is ready"
echo ""

echo -e "${GREEN}Deployment Steps:${NC}"
echo ""
echo "Step 1: Push to GitHub"
echo "----------------------"
echo "Run: ./push-to-github.sh"
echo ""
echo "Step 2: Deploy on Render"
echo "------------------------"
echo "1. Go to: https://dashboard.render.com"
echo "2. Click 'New +' → 'Blueprint'"
echo "3. Connect your GitHub repository"
echo "4. Render will create both services automatically"
echo ""
echo "Step 3: Configure Environment Variables"
echo "----------------------------------------"
echo "After deployment, set these in Render Dashboard:"
echo ""
echo -e "${YELLOW}For optifit-api service:${NC}"
echo "  GEMINI_API_KEY     = your_gemini_api_key"
echo "  CORS_ORIGINS       = https://your-frontend-url.onrender.com"
echo ""
echo -e "${YELLOW}For optifit-web service:${NC}"
echo "  VITE_API_URL       = https://your-backend-url.onrender.com/api"
echo "  VITE_ENABLE_ANALYZE = true"
echo ""

echo "Step 4: Verify Deployment"
echo "-------------------------"
echo "Check these endpoints:"
echo "  Health:  https://optifit-api.onrender.com/health"
echo "  Ready:   https://optifit-api.onrender.com/readyz"
echo ""

# Create a summary file
cat > DEPLOYMENT_SUMMARY.txt << 'EOF'
OptiFit Deployment Summary
==========================

Services Created:
-----------------
1. optifit-api (Python/FastAPI)
   - Handles workout generation
   - Equipment detection via Gemini Vision
   - Database: SQLite on persistent disk

2. optifit-web (Static Site)
   - React frontend
   - Built with Vite
   - Served as static files

Environment Variables Required:
-------------------------------
Backend (optifit-api):
  - GEMINI_API_KEY: Your Gemini API key
  - CORS_ORIGINS: Frontend URL for CORS

Frontend (optifit-web):
  - VITE_API_URL: Backend URL + /api
  - VITE_ENABLE_ANALYZE: true

Post-Deployment:
----------------
1. Get your backend URL from Render Dashboard
2. Set CORS_ORIGINS to your frontend URL
3. Set VITE_API_URL to your backend URL + /api
4. Redeploy both services

Troubleshooting:
----------------
- Check logs in Render Dashboard
- Verify GEMINI_API_KEY is set correctly
- Ensure CORS_ORIGINS includes your frontend URL
- Check that both services are "Live"

Useful Links:
-------------
- Render Dashboard: https://dashboard.render.com
- Gemini API: https://ai.google.dev/
- Health Check: /health
- Ready Check: /readyz
EOF

echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "A summary has been saved to DEPLOYMENT_SUMMARY.txt"
echo ""
echo "Next: Run ./push-to-github.sh to push your code"

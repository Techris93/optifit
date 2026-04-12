#!/bin/bash

# OptiFit - Push to GitHub Script
# This script helps you push the OptiFit project to your GitHub repository

set -e

echo "🚀 OptiFit - GitHub Push Helper"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git is not installed. Please install Git first.${NC}"
    exit 1
fi

# Get GitHub repository URL
echo -n "Enter your GitHub repository URL (e.g., https://github.com/username/optifit.git): "
read REPO_URL

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}❌ Repository URL is required.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📦 Preparing to push to:${NC} $REPO_URL"
echo ""

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo "📝 Initializing git repository..."
    git init
    git branch -M main
fi

# Configure git user if not set
if [ -z "$(git config user.name)" ]; then
    echo -n "Enter your Git username: "
    read GIT_USER
    git config user.name "$GIT_USER"
fi

if [ -z "$(git config user.email)" ]; then
    echo -n "Enter your Git email: "
    read GIT_EMAIL
    git config user.email "$GIT_EMAIL"
fi

# Add remote if not exists
if ! git remote get-url origin &> /dev/null; then
    echo "🔗 Adding remote origin..."
    git remote add origin "$REPO_URL"
else
    echo "🔄 Updating remote origin..."
    git remote set-url origin "$REPO_URL"
fi

# Check for changes
if git diff --quiet && git diff --staged --quiet; then
    echo -e "${YELLOW}⚠️  No changes to commit.${NC}"
else
    echo "📤 Staging changes..."
    git add .
    
    echo -n "Enter commit message (default: 'Update OptiFit with Gemini integration'): "
    read COMMIT_MSG
    COMMIT_MSG=${COMMIT_MSG:-"Update OptiFit with Gemini integration"}
    
    echo "💾 Committing changes..."
    git commit -m "$COMMIT_MSG"
fi

# Push to GitHub
echo ""
echo "🚀 Pushing to GitHub..."
if git push -u origin main; then
    echo ""
    echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Go to your GitHub repository: $REPO_URL"
    echo "2. Verify all files are uploaded"
    echo "3. Go to Render Dashboard: https://dashboard.render.com"
    echo "4. Click 'New +' → 'Blueprint' and connect your repo"
    echo ""
    echo "Don't forget to set your environment variables in Render:"
    echo "  - GEMINI_API_KEY (your Gemini API key)"
    echo "  - CORS_ORIGINS (your frontend URL)"
    echo "  - VITE_API_URL (your backend URL + /api)"
else
    echo ""
    echo -e "${RED}❌ Push failed. Common issues:${NC}"
    echo "1. Authentication: Make sure you're logged into GitHub"
    echo "   Run: gh auth login"
    echo "   Or use HTTPS with a personal access token"
    echo "2. Repository doesn't exist: Create it on GitHub first"
    echo "3. Permission denied: Check your repository access"
    echo ""
    echo "Try manually:"
    echo "  git push -u origin main"
fi

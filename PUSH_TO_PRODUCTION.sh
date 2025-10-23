#!/bin/bash

#############################################################################
# PUSH TO PRODUCTION - Lenkersdorfer CRM Environment Variable Fix
#############################################################################

echo ""
echo "════════════════════════════════════════════════════════════════════"
echo "  PRODUCTION DEPLOYMENT - Environment Variable Fix"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}ERROR: package.json not found. Are you in the project root?${NC}"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo -e "${YELLOW}WARNING: You have uncommitted changes${NC}"
    echo ""
    git status --short
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

echo -e "${BLUE}Step 1/4: Verifying environment variables...${NC}"
npm run verify-env
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Environment verification failed!${NC}"
    echo ""
    echo "Fix: Ensure .env.local file exists with:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=https://zqstpmfatjatnvodiaey.supabase.co"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci..."
    exit 1
fi

echo ""
echo -e "${BLUE}Step 2/4: Testing local build...${NC}"
npm run build > /tmp/build.log 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    echo ""
    echo "Last 20 lines of build log:"
    tail -20 /tmp/build.log
    exit 1
fi

echo -e "${GREEN}✅ Local build successful${NC}"

echo ""
echo -e "${BLUE}Step 3/4: Checking git remote...${NC}"
git remote -v | grep origin

echo ""
echo -e "${BLUE}Step 4/4: Pushing to production...${NC}"
echo ""
echo -e "${YELLOW}This will push to GitHub and trigger Vercel deployment.${NC}"
read -p "Are you sure you want to deploy? (y/N) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo ""
echo "Pushing to origin/main..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  ✅ DEPLOYMENT INITIATED SUCCESSFULLY${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "  1. Monitor deployment at: https://vercel.com/dashboard"
    echo "  2. Watch for build logs showing:"
    echo "     ✓ Environment Variable Verification"
    echo "     ✓ All required environment variables are set"
    echo "     ✓ Compiled successfully"
    echo ""
    echo "  3. After deployment completes, verify:"
    echo "     - Visit: https://lenkersdorfer-crm.vercel.app/"
    echo "     - Should see login page (NOT error page)"
    echo "     - No 'Missing Supabase environment variables' error"
    echo ""
    echo "  4. Test login:"
    echo "     - Email: demo@lenkersdorfer.com"
    echo "     - Password: LuxuryWatch2024!"
    echo ""
    echo "  5. Check debug endpoint (optional):"
    echo "     - https://lenkersdorfer-crm.vercel.app/api/debug/env"
    echo "     - Should return: \"verdict\": \"HEALTHY\""
    echo ""
    echo -e "${YELLOW}If you see 'Missing Supabase environment variables' error:${NC}"
    echo "  1. Go to Vercel dashboard → Settings → Environment Variables"
    echo "  2. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "     are set for ALL environments (Production, Preview, Development)"
    echo "  3. Trigger a FRESH deployment (not redeploy)"
    echo ""
    echo -e "${BLUE}Documentation:${NC}"
    echo "  - Quick Guide: DEPLOY_NOW.md"
    echo "  - Full Guide: ENV_FIX_DEPLOYMENT_GUIDE.md"
    echo "  - Summary: PRODUCTION_FIX_SUMMARY.md"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Git push failed${NC}"
    echo ""
    echo "Check the error message above and try again."
    exit 1
fi

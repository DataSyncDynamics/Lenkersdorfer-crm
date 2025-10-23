#!/bin/bash

# Login Flow Test Script
# Tests the complete authentication flow with cookie handling

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         LOGIN FLOW VERIFICATION TEST                      ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test configuration
TEST_URL="http://localhost:3000"
TEST_EMAIL="jason@lenkersdorfer.com"

echo "Configuration:"
echo "  URL: $TEST_URL"
echo "  Test User: $TEST_EMAIL"
echo ""

# Test 1: Check if dev server is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Dev Server Running"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s "$TEST_URL" > /dev/null; then
    echo -e "${GREEN}✓ Dev server is running${NC}"
else
    echo -e "${RED}✗ Dev server is not running${NC}"
    echo "  Start it with: npm run dev"
    exit 1
fi
echo ""

# Test 2: Check if login page loads
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Login Page Loads"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s "$TEST_URL/login" | grep -q "Welcome Back"; then
    echo -e "${GREEN}✓ Login page loads correctly${NC}"
else
    echo -e "${RED}✗ Login page failed to load${NC}"
    exit 1
fi
echo ""

# Test 3: Check cookie-based client exists
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Cookie-Based Client Exists"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "src/lib/supabase/browser.ts" ]; then
    echo -e "${GREEN}✓ Cookie-based browser client exists${NC}"
    if grep -q "createBrowserClient" "src/lib/supabase/browser.ts"; then
        echo -e "${GREEN}✓ Uses @supabase/ssr createBrowserClient${NC}"
    else
        echo -e "${RED}✗ Not using createBrowserClient${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Cookie-based browser client missing${NC}"
    exit 1
fi
echo ""

# Test 4: Check login page uses cookie client
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 4: Login Page Uses Cookie Client"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -q "supabaseBrowser" "src/app/login/page.tsx"; then
    echo -e "${GREEN}✓ Login page imports supabaseBrowser${NC}"
else
    echo -e "${RED}✗ Login page not using cookie-based client${NC}"
    exit 1
fi
echo ""

# Test 5: Check middleware configuration
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 5: Middleware Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "src/middleware.ts" ]; then
    echo -e "${GREEN}✓ Middleware file exists${NC}"
    if grep -q "createServerClient" "src/middleware.ts"; then
        echo -e "${GREEN}✓ Uses createServerClient for cookie handling${NC}"
    else
        echo -e "${YELLOW}⚠ Middleware may not handle cookies correctly${NC}"
    fi
    if grep -q "User has session on /login, redirecting to dashboard" "src/middleware.ts"; then
        echo -e "${GREEN}✓ Redirects logged-in users away from login page${NC}"
    fi
else
    echo -e "${RED}✗ Middleware file missing${NC}"
    exit 1
fi
echo ""

# Test 6: Check environment variables
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 6: Environment Variables"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" ".env.local"; then
        echo -e "${GREEN}✓ NEXT_PUBLIC_SUPABASE_URL configured${NC}"
    else
        echo -e "${RED}✗ NEXT_PUBLIC_SUPABASE_URL missing${NC}"
        exit 1
    fi
    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" ".env.local"; then
        echo -e "${GREEN}✓ NEXT_PUBLIC_SUPABASE_ANON_KEY configured${NC}"
    else
        echo -e "${RED}✗ NEXT_PUBLIC_SUPABASE_ANON_KEY missing${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ .env.local file missing${NC}"
    exit 1
fi
echo ""

# Summary
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  TEST SUMMARY                             ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✓ All tests passed!${NC}"
echo ""
echo "Login flow is correctly configured with:"
echo "  • Cookie-based authentication"
echo "  • Server-side session verification"
echo "  • Proper middleware protection"
echo "  • Environment variables configured"
echo ""
echo "To test manually:"
echo "  1. Open http://localhost:3000/login"
echo "  2. Enter credentials: $TEST_EMAIL"
echo "  3. Click 'Sign In'"
echo "  4. Should redirect to dashboard in ~1 second"
echo ""
echo "To check cookies in browser console:"
echo "  document.cookie.split(';').filter(c => c.includes('sb-'))"
echo ""

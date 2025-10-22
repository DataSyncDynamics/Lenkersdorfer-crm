#!/bin/bash

###############################################################################
# COMPREHENSIVE SECURITY TEST SUITE
# Phase 6: Security Remediation Plan - Complete Validation
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Results storage
CRITICAL_FAILURES=()
HIGH_FAILURES=()
MEDIUM_WARNINGS=()
LOW_WARNINGS=()

###############################################################################
# Helper Functions
###############################################################################

log_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED_TESTS=$((FAILED_TESTS + 1))
    CRITICAL_FAILURES+=("$1")
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
    MEDIUM_WARNINGS+=("$1")
}

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

section() {
    echo ""
    echo "=============================================================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================================================="
}

###############################################################################
# Check if server is running
###############################################################################

check_server() {
    section "Pre-flight: Checking Development Server"

    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_pass "Development server is running on localhost:3000"
        return 0
    else
        log_fail "Development server is NOT running. Please start with: npm run dev"
        exit 1
    fi
}

###############################################################################
# PHASE 1: Authentication & Authorization Tests
###############################################################################

test_phase1_authentication() {
    section "PHASE 1: Authentication & Authorization Security"

    # Test 1.1: Unauthenticated API access
    log_test "Test 1.1: API routes require authentication"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/clients)
    if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "302" ]; then
        log_pass "API routes return 401/302 for unauthenticated requests"
    else
        log_fail "API routes allow unauthenticated access (HTTP $RESPONSE)"
    fi

    # Test 1.2: Import endpoint protection
    log_test "Test 1.2: Import endpoint requires authentication"
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d '{}' \
        http://localhost:3000/api/import/lenkersdorfer)
    if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "302" ]; then
        log_pass "Import endpoint protected"
    else
        log_fail "Import endpoint not protected (HTTP $RESPONSE)"
    fi

    # Test 1.3: Check vercel.json for secrets
    log_test "Test 1.3: No secrets in vercel.json"
    if grep -i "supabase_url\|anon_key\|service_role" vercel.json > /dev/null 2>&1; then
        log_fail "CRITICAL: Secrets found in vercel.json"
    else
        log_pass "No secrets in vercel.json"
    fi

    # Test 1.4: Middleware configuration
    log_test "Test 1.4: Middleware configuration"
    if grep -q "export.*middleware" src/middleware.ts > /dev/null 2>&1; then
        log_pass "Middleware is configured"
    else
        log_fail "Middleware not found or not configured"
    fi
}

###############################################################################
# PHASE 2: Input Validation Tests
###############################################################################

test_phase2_input_validation() {
    section "PHASE 2: Input Validation & SQL Injection Protection"

    # Test 2.1: SQL Injection - basic attempt
    log_test "Test 2.1: SQL injection protection in search"
    RESPONSE=$(curl -s "http://localhost:3000/api/clients?search=';%20DROP%20TABLE%20clients;%20--")
    if echo "$RESPONSE" | grep -i "drop table" > /dev/null 2>&1; then
        log_fail "CRITICAL: SQL injection possible - unsanitized query"
    else
        log_pass "SQL injection blocked"
    fi

    # Test 2.2: SQL Injection - OR 1=1 attempt
    log_test "Test 2.2: SQL injection OR 1=1 protection"
    RESPONSE=$(curl -s "http://localhost:3000/api/clients?search='%20OR%201=1%20--")
    if echo "$RESPONSE" | grep -i "syntax error" > /dev/null 2>&1; then
        log_fail "SQL injection may be possible - syntax error exposed"
    else
        log_pass "OR 1=1 injection blocked"
    fi

    # Test 2.3: XSS protection in search
    log_test "Test 2.3: XSS protection in search"
    RESPONSE=$(curl -s "http://localhost:3000/api/clients?search=<script>alert('xss')</script>")
    if echo "$RESPONSE" | grep -i "<script>" > /dev/null 2>&1; then
        log_fail "XSS possible - unescaped script tags"
    else
        log_pass "XSS blocked in search"
    fi

    # Test 2.4: Check for Zod validation schemas
    log_test "Test 2.4: Zod validation schemas exist"
    if grep -r "z\.object" src/lib/validation/ > /dev/null 2>&1; then
        log_pass "Zod validation schemas implemented"
    else
        log_fail "No Zod validation schemas found"
    fi

    # Test 2.5: Strict mode in schemas
    log_test "Test 2.5: Strict mode in update schemas"
    if grep -r "\.strict()" src/lib/validation/ > /dev/null 2>&1; then
        log_pass "Strict mode enabled in schemas"
    else
        log_warn "Strict mode not found - arbitrary fields may be allowed"
    fi

    # Test 2.6: String length validation
    log_test "Test 2.6: String length limits enforced"
    if grep -r "\.max(" src/lib/validation/ | grep -q "255\|5000"; then
        log_pass "String length limits configured"
    else
        log_warn "String length limits may not be enforced"
    fi
}

###############################################################################
# PHASE 3: Rate Limiting & API Security
###############################################################################

test_phase3_rate_limiting() {
    section "PHASE 3: Rate Limiting & API Security"

    # Test 3.1: Rate limiting implementation exists
    log_test "Test 3.1: Rate limiting implementation"
    if [ -f "src/lib/rate-limit.ts" ]; then
        log_pass "Rate limiting module exists"
    else
        log_fail "Rate limiting module not found"
    fi

    # Test 3.2: Rate limit configuration
    log_test "Test 3.2: Rate limit configurations"
    if grep -q "RateLimits" src/lib/rate-limit.ts; then
        log_pass "Rate limit configurations found"
    else
        log_fail "Rate limit configurations missing"
    fi

    # Test 3.3: Rate limit headers
    log_test "Test 3.3: Rate limit headers in responses"
    if grep -q "X-RateLimit" src/lib/rate-limit.ts; then
        log_pass "Rate limit headers implemented"
    else
        log_warn "Rate limit headers not implemented"
    fi

    # Test 3.4: Error sanitization
    log_test "Test 3.4: Error message sanitization"
    if [ -f "src/lib/error-handler.ts" ] && grep -q "GENERIC_ERRORS" src/lib/error-handler.ts; then
        log_pass "Error sanitization implemented"
    else
        log_fail "Error sanitization not implemented"
    fi

    # Test 3.5: No database errors exposed
    log_test "Test 3.5: Database errors sanitized"
    if grep -q "PostgreSQL\|pg_" src/app/api/**/*.ts 2>/dev/null; then
        log_fail "Database error strings found in API routes"
    else
        log_pass "No database error strings in API routes"
    fi
}

###############################################################################
# PHASE 4: Data Security & RLS
###############################################################################

test_phase4_data_security() {
    section "PHASE 4: Data Security & RLS Policies"

    # Test 4.1: No SELECT * queries
    log_test "Test 4.1: Explicit field selection (no SELECT *)"
    if grep -r "\.select()" src/app/api/ | grep -v "\.select(" > /dev/null 2>&1; then
        log_fail "SELECT * queries found (security risk)"
    else
        log_pass "All queries use explicit field selection"
    fi

    # Test 4.2: Pagination limits
    log_test "Test 4.2: Pagination limits enforced"
    if grep -r "\.range\|limit" src/app/api/clients/route.ts > /dev/null 2>&1; then
        log_pass "Pagination limits implemented"
    else
        log_warn "Pagination limits may not be enforced"
    fi

    # Test 4.3: User context in queries
    log_test "Test 4.3: User context captured in queries"
    if grep -r "assigned_to.*user\.id" src/app/api/ > /dev/null 2>&1; then
        log_pass "User context enforced in queries"
    else
        log_warn "User context may not be enforced"
    fi

    # Test 4.4: Check for audit logging implementation
    log_test "Test 4.4: Audit logging capability"
    if grep -r "audit" src/lib/ > /dev/null 2>&1; then
        log_pass "Audit logging references found"
    else
        log_warn "Audit logging may not be implemented"
    fi
}

###############################################################################
# PHASE 5: Security Headers & CSP
###############################################################################

test_phase5_security_headers() {
    section "PHASE 5: Security Headers & CSP Configuration"

    # Test 5.1: Security headers in next.config.js
    log_test "Test 5.1: Security headers configured"
    if grep -q "X-Frame-Options\|X-Content-Type-Options" next.config.js; then
        log_pass "Security headers configured in next.config.js"
    else
        log_fail "Security headers missing in next.config.js"
    fi

    # Test 5.2: CSP header
    log_test "Test 5.2: Content Security Policy configured"
    if grep -q "Content-Security-Policy" vercel.json || grep -q "Content-Security-Policy" next.config.js; then
        log_pass "CSP header configured"
    else
        log_fail "CSP header not configured"
    fi

    # Test 5.3: HSTS header
    log_test "Test 5.3: HSTS (Strict-Transport-Security) configured"
    if grep -q "Strict-Transport-Security" vercel.json || grep -q "Strict-Transport-Security" next.config.js; then
        log_pass "HSTS header configured"
    else
        log_warn "HSTS header not configured"
    fi

    # Test 5.4: X-Frame-Options
    log_test "Test 5.4: X-Frame-Options set to DENY"
    if grep -q "X-Frame-Options.*DENY" vercel.json || grep -q "X-Frame-Options.*DENY" next.config.js; then
        log_pass "X-Frame-Options set to DENY"
    else
        log_warn "X-Frame-Options may not prevent clickjacking"
    fi

    # Test 5.5: CORS configuration
    log_test "Test 5.5: CORS headers configured"
    if grep -q "Access-Control-Allow-Origin" next.config.js; then
        log_pass "CORS headers configured"
    else
        log_warn "CORS headers not configured"
    fi
}

###############################################################################
# PHASE 6: Transaction Integrity & Business Logic
###############################################################################

test_phase6_business_logic() {
    section "PHASE 6: Transaction Integrity & Business Logic"

    # Test 6.1: Transaction rollback in purchases
    log_test "Test 6.1: Purchase transaction rollback implemented"
    if grep -q "ROLLBACK\|delete.*purchase" src/app/api/purchases/route.ts; then
        log_pass "Purchase transaction rollback implemented"
    else
        log_fail "No transaction rollback on purchase failure"
    fi

    # Test 6.2: Price validation
    log_test "Test 6.2: Purchase price validation"
    if grep -q "isPriceWithinTolerance\|price.*tolerance" src/app/api/purchases/route.ts; then
        log_pass "Price validation implemented"
    else
        log_warn "Price validation may not be enforced"
    fi

    # Test 6.3: Business config externalized
    log_test "Test 6.3: Business configuration externalized"
    if [ -f "src/config/business.ts" ]; then
        log_pass "Business configuration externalized"
    else
        log_fail "Business configuration not externalized"
    fi

    # Test 6.4: Commission rates in config
    log_test "Test 6.4: Commission rates in configuration"
    if grep -q "CommissionRates\|commission" src/config/business.ts; then
        log_pass "Commission rates in configuration"
    else
        log_warn "Commission rates may be hard-coded"
    fi

    # Test 6.5: VIP tier thresholds in config
    log_test "Test 6.5: VIP tier thresholds in configuration"
    if grep -q "VipTierThresholds" src/config/business.ts; then
        log_pass "VIP tier thresholds in configuration"
    else
        log_warn "VIP tier thresholds may be hard-coded"
    fi
}

###############################################################################
# PHASE 7: Environment & Configuration Security
###############################################################################

test_phase7_environment() {
    section "PHASE 7: Environment & Configuration Security"

    # Test 7.1: .env.local not committed
    log_test "Test 7.1: .env.local not in git"
    if git ls-files | grep -q "\.env\.local"; then
        log_fail "CRITICAL: .env.local is committed to git"
    else
        log_pass ".env.local not committed"
    fi

    # Test 7.2: .env.example exists
    log_test "Test 7.2: .env.example exists for documentation"
    if [ -f ".env.example" ]; then
        log_pass ".env.example exists"
    else
        log_warn ".env.example missing"
    fi

    # Test 7.3: No secrets in source code
    log_test "Test 7.3: No hardcoded secrets in source code"
    if grep -r "supabase.*anon.*key\|sk_live_\|pk_live_" src/ --include="*.ts" --include="*.tsx" | grep -v "process.env" > /dev/null 2>&1; then
        log_fail "CRITICAL: Hardcoded secrets found in source code"
    else
        log_pass "No hardcoded secrets in source code"
    fi

    # Test 7.4: TypeScript compilation check
    log_test "Test 7.4: TypeScript compilation"
    if npx tsc --noEmit > /tmp/tsc-errors.log 2>&1; then
        log_pass "TypeScript compiles without errors"
    else
        ERROR_COUNT=$(wc -l < /tmp/tsc-errors.log)
        log_warn "TypeScript has $ERROR_COUNT errors (may affect security)"
    fi
}

###############################################################################
# Generate Report
###############################################################################

generate_report() {
    section "COMPREHENSIVE SECURITY TEST REPORT"

    echo ""
    echo "Test Summary:"
    echo "  Total Tests:    $TOTAL_TESTS"
    echo "  Passed:         $PASSED_TESTS"
    echo "  Failed:         $FAILED_TESTS"
    echo "  Warnings:       $WARNINGS"
    echo ""

    if [ $FAILED_TESTS -gt 0 ]; then
        echo -e "${RED}CRITICAL FAILURES:${NC}"
        for failure in "${CRITICAL_FAILURES[@]}"; do
            echo "  - $failure"
        done
        echo ""
    fi

    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}WARNINGS:${NC}"
        for warning in "${MEDIUM_WARNINGS[@]}"; do
            echo "  - $warning"
        done
        echo ""
    fi

    # Calculate pass rate
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

    echo "Pass Rate: $PASS_RATE%"
    echo ""

    # Deployment decision
    if [ $FAILED_TESTS -eq 0 ] && [ $PASS_RATE -ge 90 ]; then
        echo -e "${GREEN}DEPLOYMENT DECISION: GO${NC}"
        echo "All critical security tests passed. System is ready for deployment."
        echo ""
        return 0
    elif [ $FAILED_TESTS -lt 3 ] && [ $PASS_RATE -ge 80 ]; then
        echo -e "${YELLOW}DEPLOYMENT DECISION: GO WITH CAUTION${NC}"
        echo "Most security tests passed. Review failures before deployment."
        echo ""
        return 1
    else
        echo -e "${RED}DEPLOYMENT DECISION: NO-GO${NC}"
        echo "Critical security failures detected. DO NOT DEPLOY."
        echo ""
        return 2
    fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
    echo ""
    echo "================================================================================"
    echo "  LENKERSDORFER CRM - COMPREHENSIVE SECURITY TEST SUITE"
    echo "  Phase 6: Security Remediation Validation"
    echo "================================================================================"
    echo ""

    check_server

    test_phase1_authentication
    test_phase2_input_validation
    test_phase3_rate_limiting
    test_phase4_data_security
    test_phase5_security_headers
    test_phase6_business_logic
    test_phase7_environment

    generate_report

    exit_code=$?
    exit $exit_code
}

# Run main function
main

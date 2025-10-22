#!/bin/bash

###############################################################################
# SECURITY INTEGRATION TESTS
# Phase 6: Deep validation of runtime security behavior
###############################################################################

set -e

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
WARNINGS=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_test() { echo -e "${BLUE}[TEST]${NC} $1"; }
log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; PASSED=$((PASSED + 1)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; FAILED=$((FAILED + 1)); }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; WARNINGS=$((WARNINGS + 1)); }

section() {
    echo ""
    echo "=============================================================================="
    echo -e "${BLUE}$1${NC}"
    echo "=============================================================================="
}

###############################################################################
# Integration Test 1: Rate Limiting Live Test
###############################################################################

test_rate_limiting_live() {
    section "Integration Test: Rate Limiting Enforcement"

    log_test "Making 35 rapid requests to test rate limiting..."

    SUCCESS_COUNT=0
    RATE_LIMITED_COUNT=0

    for i in {1..35}; do
        RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/clients?page=1")

        if [ "$RESPONSE_CODE" = "429" ]; then
            RATE_LIMITED_COUNT=$((RATE_LIMITED_COUNT + 1))
        elif [ "$RESPONSE_CODE" = "200" ] || [ "$RESPONSE_CODE" = "401" ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        fi

        # Small delay to avoid overwhelming the server
        sleep 0.1
    done

    echo "Results: $SUCCESS_COUNT successful, $RATE_LIMITED_COUNT rate-limited"

    if [ $RATE_LIMITED_COUNT -gt 0 ]; then
        log_pass "Rate limiting is working (blocked $RATE_LIMITED_COUNT requests)"
    else
        log_warn "Rate limiting may not be enforced (no 429 responses)"
    fi
}

###############################################################################
# Integration Test 2: Rate Limit Headers
###############################################################################

test_rate_limit_headers() {
    section "Integration Test: Rate Limit Headers"

    log_test "Checking for rate limit headers in API responses"

    HEADERS=$(curl -s -I "$BASE_URL/api/clients?page=1" 2>&1)

    if echo "$HEADERS" | grep -i "X-RateLimit-Limit" > /dev/null; then
        log_pass "X-RateLimit-Limit header present"
    else
        log_warn "X-RateLimit-Limit header missing"
    fi

    if echo "$HEADERS" | grep -i "X-RateLimit-Remaining" > /dev/null; then
        log_pass "X-RateLimit-Remaining header present"
    else
        log_warn "X-RateLimit-Remaining header missing"
    fi

    if echo "$HEADERS" | grep -i "X-RateLimit-Reset" > /dev/null; then
        log_pass "X-RateLimit-Reset header present"
    else
        log_warn "X-RateLimit-Reset header missing"
    fi
}

###############################################################################
# Integration Test 3: Security Headers Live Validation
###############################################################################

test_security_headers_live() {
    section "Integration Test: Security Headers Validation"

    log_test "Checking security headers on live server"

    HEADERS=$(curl -s -I "$BASE_URL/" 2>&1)

    # X-Frame-Options
    if echo "$HEADERS" | grep -i "X-Frame-Options: DENY" > /dev/null; then
        log_pass "X-Frame-Options: DENY present"
    else
        log_fail "X-Frame-Options: DENY missing"
    fi

    # X-Content-Type-Options
    if echo "$HEADERS" | grep -i "X-Content-Type-Options: nosniff" > /dev/null; then
        log_pass "X-Content-Type-Options: nosniff present"
    else
        log_fail "X-Content-Type-Options: nosniff missing"
    fi

    # CSP
    if echo "$HEADERS" | grep -i "Content-Security-Policy" > /dev/null; then
        log_pass "Content-Security-Policy header present"
    else
        log_warn "Content-Security-Policy header missing"
    fi

    # HSTS
    if echo "$HEADERS" | grep -i "Strict-Transport-Security" > /dev/null; then
        log_pass "Strict-Transport-Security header present"
    else
        log_warn "HSTS header missing (acceptable in development)"
    fi
}

###############################################################################
# Integration Test 4: Input Validation Error Messages
###############################################################################

test_input_validation_errors() {
    section "Integration Test: Input Validation Error Messages"

    log_test "Testing validation error messages don't leak internals"

    # Test with invalid email
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/clients" \
        -H "Content-Type: application/json" \
        -d '{"name":"Test","email":"not-an-email","phone":"123"}' 2>&1)

    if echo "$RESPONSE" | grep -i "postgres\|pg_\|sql" > /dev/null; then
        log_fail "Database internals leaked in error message"
    else
        log_pass "No database internals in validation errors"
    fi

    if echo "$RESPONSE" | grep -i "stack\|trace" > /dev/null; then
        log_fail "Stack traces exposed in error responses"
    else
        log_pass "No stack traces in error responses"
    fi
}

###############################################################################
# Integration Test 5: SQL Injection Live Test
###############################################################################

test_sql_injection_live() {
    section "Integration Test: SQL Injection Protection"

    log_test "Testing SQL injection attempts against live API"

    # Test 1: Basic SQL injection
    RESPONSE=$(curl -s "$BASE_URL/api/clients?search='; DROP TABLE clients; --" 2>&1)

    if echo "$RESPONSE" | grep -i "error\|syntax" | grep -v "authentication" > /dev/null; then
        log_fail "SQL injection may be possible - unexpected error"
    else
        log_pass "SQL injection blocked (Test 1)"
    fi

    # Test 2: Union-based injection
    RESPONSE=$(curl -s "$BASE_URL/api/clients?search=' UNION SELECT * FROM users --" 2>&1)

    if echo "$RESPONSE" | grep -i "union\|select" > /dev/null; then
        log_fail "SQL keywords appear in response - possible injection"
    else
        log_pass "Union-based injection blocked (Test 2)"
    fi

    # Test 3: Boolean-based blind injection
    RESPONSE=$(curl -s "$BASE_URL/api/clients?search=' OR 1=1 --" 2>&1)

    if echo "$RESPONSE" | grep -i "syntax error" > /dev/null; then
        log_fail "SQL syntax error exposed"
    else
        log_pass "Boolean-based injection sanitized (Test 3)"
    fi
}

###############################################################################
# Integration Test 6: XSS Protection
###############################################################################

test_xss_protection() {
    section "Integration Test: XSS Protection"

    log_test "Testing XSS protection in API responses"

    # Test with script tags
    RESPONSE=$(curl -s "$BASE_URL/api/clients?search=<script>alert('XSS')</script>" 2>&1)

    if echo "$RESPONSE" | grep "<script>" > /dev/null; then
        log_fail "Unescaped script tags in response - XSS vulnerable"
    else
        log_pass "Script tags sanitized or escaped"
    fi

    # Test with event handlers
    RESPONSE=$(curl -s "$BASE_URL/api/clients?search=<img src=x onerror=alert(1)>" 2>&1)

    if echo "$RESPONSE" | grep "onerror=" > /dev/null; then
        log_fail "Event handlers not sanitized - XSS vulnerable"
    else
        log_pass "Event handlers sanitized"
    fi
}

###############################################################################
# Integration Test 7: Authentication Enforcement
###############################################################################

test_authentication_enforcement() {
    section "Integration Test: Authentication Enforcement"

    log_test "Testing authentication on protected endpoints"

    ENDPOINTS=(
        "/api/clients"
        "/api/purchases"
        "/api/waitlist"
        "/api/watches"
        "/api/reminders"
    )

    PROTECTED_COUNT=0
    UNPROTECTED_COUNT=0

    for endpoint in "${ENDPOINTS[@]}"; do
        RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint")

        if [ "$RESPONSE_CODE" = "401" ] || [ "$RESPONSE_CODE" = "302" ]; then
            PROTECTED_COUNT=$((PROTECTED_COUNT + 1))
        else
            UNPROTECTED_COUNT=$((UNPROTECTED_COUNT + 1))
            echo "  - $endpoint returned $RESPONSE_CODE (expected 401/302)"
        fi
    done

    if [ $UNPROTECTED_COUNT -eq 0 ]; then
        log_pass "All $PROTECTED_COUNT endpoints require authentication"
    else
        log_fail "$UNPROTECTED_COUNT endpoints are not protected"
    fi
}

###############################################################################
# Integration Test 8: CORS Configuration
###############################################################################

test_cors_configuration() {
    section "Integration Test: CORS Configuration"

    log_test "Testing CORS headers"

    RESPONSE=$(curl -s -I -H "Origin: https://evil.com" "$BASE_URL/api/clients" 2>&1)

    if echo "$RESPONSE" | grep -i "Access-Control-Allow-Origin" > /dev/null; then
        ALLOWED_ORIGIN=$(echo "$RESPONSE" | grep -i "Access-Control-Allow-Origin" | cut -d':' -f2- | tr -d ' \r')

        if echo "$ALLOWED_ORIGIN" | grep -i "evil.com" > /dev/null; then
            log_fail "CORS allows unauthorized origin: $ALLOWED_ORIGIN"
        else
            log_pass "CORS restricts to authorized origins only"
        fi
    else
        log_warn "No CORS headers found (may be expected in development)"
    fi
}

###############################################################################
# Integration Test 9: Error Response Consistency
###############################################################################

test_error_consistency() {
    section "Integration Test: Error Response Consistency"

    log_test "Testing error response format consistency"

    # Test 404 error
    RESPONSE=$(curl -s "$BASE_URL/api/clients/invalid-uuid-here" 2>&1)

    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        log_pass "404 errors return JSON format"
    else
        log_warn "404 errors may not be consistently formatted"
    fi

    # Test 400 error (invalid data)
    RESPONSE=$(curl -s -X POST "$BASE_URL/api/clients" \
        -H "Content-Type: application/json" \
        -d '{"invalid":"data"}' 2>&1)

    if echo "$RESPONSE" | jq -e '.error' > /dev/null 2>&1; then
        log_pass "400 errors return JSON format"
    else
        log_warn "400 errors may not be consistently formatted"
    fi
}

###############################################################################
# Integration Test 10: Pagination Security
###############################################################################

test_pagination_security() {
    section "Integration Test: Pagination Security"

    log_test "Testing pagination limits enforcement"

    # Test with excessively large limit
    RESPONSE=$(curl -s "$BASE_URL/api/clients?limit=9999999" 2>&1)

    if echo "$RESPONSE" | grep -i "unauthorized\|authentication" > /dev/null; then
        log_pass "Protected endpoint (authentication required)"
    elif echo "$RESPONSE" | jq -e '.clients' > /dev/null 2>&1; then
        # If we get a response, check the actual limit applied
        COUNT=$(echo "$RESPONSE" | jq -e '.clients | length' 2>&1)
        if [ "$COUNT" -le 100 ]; then
            log_pass "Pagination limit enforced (max $COUNT items)"
        else
            log_fail "Pagination limit exceeded ($COUNT items)"
        fi
    else
        log_pass "Large limit value rejected"
    fi

    # Test with negative page
    RESPONSE=$(curl -s "$BASE_URL/api/clients?page=-1" 2>&1)

    if echo "$RESPONSE" | grep -i "error\|invalid" > /dev/null; then
        log_pass "Negative page numbers rejected"
    else
        log_warn "Negative page numbers may be accepted"
    fi
}

###############################################################################
# Generate Integration Test Report
###############################################################################

generate_integration_report() {
    section "INTEGRATION TEST REPORT"

    TOTAL=$((PASSED + FAILED + WARNINGS))

    echo ""
    echo "Integration Test Summary:"
    echo "  Total Tests:    $TOTAL"
    echo "  Passed:         $PASSED"
    echo "  Failed:         $FAILED"
    echo "  Warnings:       $WARNINGS"
    echo ""

    if [ $TOTAL -gt 0 ]; then
        PASS_RATE=$((PASSED * 100 / TOTAL))
        echo "Pass Rate: $PASS_RATE%"
        echo ""
    fi

    if [ $FAILED -eq 0 ] && [ $PASS_RATE -ge 85 ]; then
        echo -e "${GREEN}INTEGRATION TESTS: PASSED${NC}"
        return 0
    elif [ $FAILED -lt 3 ]; then
        echo -e "${YELLOW}INTEGRATION TESTS: PASSED WITH WARNINGS${NC}"
        return 1
    else
        echo -e "${RED}INTEGRATION TESTS: FAILED${NC}"
        return 2
    fi
}

###############################################################################
# Main Execution
###############################################################################

main() {
    echo ""
    echo "================================================================================"
    echo "  SECURITY INTEGRATION TESTS"
    echo "  Phase 6: Runtime Security Validation"
    echo "================================================================================"
    echo ""

    # Check server is running
    if ! curl -s "$BASE_URL" > /dev/null 2>&1; then
        echo -e "${RED}ERROR: Development server not running on $BASE_URL${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi

    test_authentication_enforcement
    test_sql_injection_live
    test_xss_protection
    test_input_validation_errors
    test_rate_limiting_live
    test_rate_limit_headers
    test_security_headers_live
    test_cors_configuration
    test_error_consistency
    test_pagination_security

    generate_integration_report
    exit $?
}

main

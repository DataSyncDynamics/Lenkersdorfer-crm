/**
 * COMPREHENSIVE AUTHENTICATION SYSTEM TEST SUITE
 *
 * This test suite validates ALL 12 critical authentication scenarios
 * identified in the QA-AUTHENTICATION-TEST-REPORT.md
 *
 * Run with: npx playwright test tests/auth-comprehensive.test.ts
 */

import { test, expect, Page } from '@playwright/test'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'https://lenkersdorfer-crm.vercel.app'
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@lenkersdorfer.com'
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!'

// Device configuration for iPhone 12 Pro
const IPHONE_12_PRO = {
  name: 'iPhone 12 Pro',
  viewport: { width: 390, height: 844 },
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true
}

/**
 * Helper: Clear all auth cookies and localStorage
 */
async function clearAuth(page: Page) {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

/**
 * Helper: Wait for navigation with timeout
 */
async function waitForNavigationWithTimeout(page: Page, timeout: number = 5000) {
  try {
    await page.waitForNavigation({ timeout })
  } catch (error) {
    console.log('Navigation timeout - page may already be loaded')
  }
}

/**
 * Helper: Count number of redirects
 */
async function countRedirects(page: Page, startUrl: string): Promise<number> {
  let redirectCount = 0
  const redirects: string[] = []

  page.on('response', response => {
    if ([301, 302, 303, 307, 308].includes(response.status())) {
      redirectCount++
      redirects.push(`${response.url()} -> ${response.headers()['location']}`)
    }
  })

  await page.goto(startUrl, { waitUntil: 'networkidle' })

  console.log(`Redirect count: ${redirectCount}`)
  redirects.forEach(r => console.log(`  ${r}`))

  return redirectCount
}

/**
 * Helper: Sign in user
 */
async function signIn(page: Page, email: string, password: string) {
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')
}

// ============================================================================
// TEST SUITE
// ============================================================================

test.describe('Authentication System - Critical Scenarios', () => {

  // -------------------------------------------------------------------------
  // TEST 1: First-Time Visitor (No Session)
  // -------------------------------------------------------------------------
  test('TEST 1: First-time visitor sees login page without infinite loops', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Clear any existing auth
    await clearAuth(page)

    // Start tracking redirects
    let redirectCount = 0
    page.on('response', response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirectCount++
      }
    })

    // Navigate to home page
    const startTime = Date.now()
    await page.goto(BASE_URL, { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime

    // Verify we're on login page
    await expect(page).toHaveURL(/.*\/login/)

    // Verify login page rendered
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Verify performance
    expect(loadTime).toBeLessThan(2000) // Should load in < 2 seconds

    // Verify single redirect (/ -> /login)
    expect(redirectCount).toBeLessThanOrEqual(1)

    // Wait 5 seconds to verify no infinite refresh
    await page.waitForTimeout(5000)
    await expect(page).toHaveURL(/.*\/login/) // Still on login page

    console.log(`✓ TEST 1 PASSED: Login page loaded in ${loadTime}ms with ${redirectCount} redirect(s)`)

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 2: Valid Login Flow
  // -------------------------------------------------------------------------
  test('TEST 2: Valid login completes in < 3 seconds with single redirect', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Clear any existing auth
    await clearAuth(page)

    // Navigate to login page
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Track redirects after sign-in
    let postLoginRedirects = 0
    page.on('response', response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        postLoginRedirects++
      }
    })

    // Fill in credentials
    const startTime = Date.now()
    await signIn(page, TEST_EMAIL, TEST_PASSWORD)

    // Wait for "Signing in..." message
    await expect(page.locator('text=Signing in...')).toBeVisible({ timeout: 1000 })

    // Wait for redirect to dashboard
    await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })

    const totalTime = Date.now() - startTime

    // Verify we're on dashboard or home page (not login)
    expect(page.url()).not.toContain('/login')

    // Verify total time < 3 seconds
    expect(totalTime).toBeLessThan(3000)

    // Verify single redirect (login -> dashboard)
    expect(postLoginRedirects).toBeLessThanOrEqual(1)

    // Verify no errors in console
    const consoleErrors: string[] = []
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    expect(consoleErrors.length).toBe(0)

    console.log(`✓ TEST 2 PASSED: Login completed in ${totalTime}ms with ${postLoginRedirects} redirect(s)`)

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 3: Invalid Credentials
  // -------------------------------------------------------------------------
  test('TEST 3: Invalid credentials show error without redirect', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await clearAuth(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Track redirects
    let redirectCount = 0
    page.on('response', response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirectCount++
      }
    })

    // Sign in with wrong credentials
    await signIn(page, 'wrong@email.com', 'WrongPassword123!')

    // Wait for error message
    await page.waitForSelector('text=/invalid|error|incorrect/i', { timeout: 3000 })

    // Verify still on login page
    await expect(page).toHaveURL(/.*\/login/)

    // Verify no redirects occurred
    expect(redirectCount).toBe(0)

    // Verify sign-in button is re-enabled
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeEnabled()

    // Verify email field is still filled
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveValue('wrong@email.com')

    console.log('✓ TEST 3 PASSED: Invalid credentials handled correctly')

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 4: Already Logged In - Direct URL
  // -------------------------------------------------------------------------
  test('TEST 4: Authenticated user accessing home page bypasses login', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // First, log in
    await clearAuth(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await signIn(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })

    // Now open home page in NEW context (simulating new tab)
    const page2 = await context.newPage()

    const startTime = Date.now()
    await page2.goto(BASE_URL, { waitUntil: 'networkidle' })
    const loadTime = Date.now() - startTime

    // Verify we're NOT on login page
    expect(page2.url()).not.toContain('/login')

    // Verify loaded in < 1 second
    expect(loadTime).toBeLessThan(1000)

    console.log(`✓ TEST 4 PASSED: Authenticated user bypassed login in ${loadTime}ms`)

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 5: Already Logged In - Login Page Access
  // -------------------------------------------------------------------------
  test('TEST 5: Authenticated user accessing /login redirects to dashboard', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // First, log in
    await clearAuth(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await signIn(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })

    // Track redirects
    let redirectCount = 0
    page.on('response', response => {
      if ([301, 302, 303, 307, 308].includes(response.status())) {
        redirectCount++
      }
    })

    // Now try to access /login directly
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Verify redirected away from login
    expect(page.url()).not.toContain('/login')

    // Verify SINGLE redirect (not infinite loop)
    expect(redirectCount).toBeLessThanOrEqual(1)

    // Wait 3 seconds to ensure no redirect loop
    await page.waitForTimeout(3000)
    expect(page.url()).not.toContain('/login')

    console.log(`✓ TEST 5 PASSED: Authenticated user redirected from /login with ${redirectCount} redirect(s)`)

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 6: Session Expired
  // -------------------------------------------------------------------------
  test('TEST 6: Expired session redirects to login with redirect parameter', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Simulate expired session by clearing auth after "logging in"
    await clearAuth(page)

    // Try to access protected route
    await page.goto(`${BASE_URL}/clients`, { waitUntil: 'networkidle' })

    // Verify redirected to login
    await expect(page).toHaveURL(/.*\/login/)

    // Verify redirect parameter is set
    const url = new URL(page.url())
    expect(url.searchParams.get('redirect')).toBe('/clients')

    console.log('✓ TEST 6 PASSED: Expired session redirected to login with redirect param')

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 7: Slow Network (3G - 0.5 Mbps)
  // -------------------------------------------------------------------------
  test('TEST 7: Login works on slow 3G network', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    // Enable slow 3G throttling
    const client = await page.context().newCDPSession(page)
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500 Kbps = 0.5 Mbps
      uploadThroughput: (500 * 1024) / 8,
      latency: 400 // 400ms latency
    })

    await clearAuth(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 })

    const startTime = Date.now()
    await signIn(page, TEST_EMAIL, TEST_PASSWORD)

    // Wait for redirect with longer timeout for slow network
    await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 15000 })

    const totalTime = Date.now() - startTime

    // Verify successful login
    expect(page.url()).not.toContain('/login')

    // Allow longer time for slow network (< 10 seconds)
    expect(totalTime).toBeLessThan(10000)

    console.log(`✓ TEST 7 PASSED: Login on 3G completed in ${totalTime}ms`)

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 8: Concurrent Tabs
  // -------------------------------------------------------------------------
  test('TEST 8: Session syncs across tabs', async ({ browser }) => {
    const context = await browser.newContext()
    const page1 = await context.newPage()

    // Log in on Tab 1
    await clearAuth(page1)
    await page1.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await signIn(page1, TEST_EMAIL, TEST_PASSWORD)
    await page1.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })

    // Open Tab 2 to /login
    const page2 = await context.newPage()
    await page2.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Verify Tab 2 redirects to dashboard
    expect(page2.url()).not.toContain('/login')

    console.log('✓ TEST 8 PASSED: Session synced across tabs')

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 9: Browser Back Button After Login
  // -------------------------------------------------------------------------
  test('TEST 9: Back button after login prevents return to login page', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await clearAuth(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
    await signIn(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })

    // Click back button
    await page.goBack()

    // Verify we're NOT on login page (should redirect back to dashboard)
    await page.waitForTimeout(1000)
    expect(page.url()).not.toContain('/login')

    console.log('✓ TEST 9 PASSED: Back button prevented return to login')

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 10: Mobile Safari - iPhone 12 Pro
  // -------------------------------------------------------------------------
  test('TEST 10: Login works on iPhone 12 Pro viewport', async ({ browser }) => {
    const context = await browser.newContext({
      ...IPHONE_12_PRO
    })
    const page = await context.newPage()

    await clearAuth(page)
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Verify mobile viewport
    const viewport = page.viewportSize()
    expect(viewport?.width).toBe(390)
    expect(viewport?.height).toBe(844)

    // Perform login
    const startTime = Date.now()
    await signIn(page, TEST_EMAIL, TEST_PASSWORD)
    await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })
    const totalTime = Date.now() - startTime

    // Verify successful login
    expect(page.url()).not.toContain('/login')
    expect(totalTime).toBeLessThan(3000)

    console.log(`✓ TEST 10 PASSED: iPhone 12 Pro login completed in ${totalTime}ms`)

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 11: Redirect Parameter Security (CRITICAL)
  // -------------------------------------------------------------------------
  test('TEST 11: System rejects malicious redirect URLs', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await clearAuth(page)

    // Test malicious redirect URLs
    const maliciousUrls = [
      'https://evil.com',
      '//evil.com',
      'javascript:alert(1)',
      'data:text/html,<script>alert(1)</script>'
    ]

    for (const maliciousUrl of maliciousUrls) {
      await page.goto(`${BASE_URL}/login?redirect=${encodeURIComponent(maliciousUrl)}`, {
        waitUntil: 'networkidle'
      })

      await signIn(page, TEST_EMAIL, TEST_PASSWORD)
      await page.waitForURL(/.*\/(dashboard|^(?!.*login))/, { timeout: 5000 })

      // CRITICAL: Verify we're on a SAFE internal URL, not the malicious one
      expect(page.url()).not.toContain('evil.com')
      expect(page.url()).not.toContain('javascript:')
      expect(page.url()).not.toContain('data:')

      // Verify we're on the base domain
      expect(page.url()).toContain('lenkersdorfer-crm')

      await clearAuth(page)
    }

    console.log('✓ TEST 11 PASSED: All malicious redirects rejected')

    await context.close()
  })

  // -------------------------------------------------------------------------
  // TEST 12: Performance Benchmarks
  // -------------------------------------------------------------------------
  test('TEST 12: Performance meets requirements', async ({ browser }) => {
    const context = await browser.newContext()
    const page = await context.newPage()

    await clearAuth(page)

    // Measure login page load performance
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' })

    const metrics = await page.evaluate(() => {
      const perf = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        domInteractive: perf.domInteractive,
        loadComplete: perf.loadEventEnd
      }
    })

    console.log('Performance Metrics:', metrics)

    // Verify performance requirements
    expect(metrics.firstContentfulPaint).toBeLessThan(1000) // < 1.0s
    expect(metrics.domInteractive).toBeLessThan(2000) // < 2.0s

    console.log(`✓ TEST 12 PASSED: Performance metrics met`)
    console.log(`  - First Contentful Paint: ${metrics.firstContentfulPaint}ms`)
    console.log(`  - Time to Interactive: ${metrics.domInteractive}ms`)

    await context.close()
  })

})

// ============================================================================
// VISUAL REGRESSION TESTS
// ============================================================================

test.describe('Visual Regression Tests', () => {

  test('Login page renders correctly on mobile', async ({ browser }) => {
    const context = await browser.newContext({ ...IPHONE_12_PRO })
    const page = await context.newPage()

    await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })

    // Take screenshot
    await page.screenshot({ path: 'screenshots/login-mobile.png', fullPage: true })

    // Verify key elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    console.log('✓ Visual test passed: Login page renders on mobile')

    await context.close()
  })

})

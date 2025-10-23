# Authentication Testing Setup Guide

## Prerequisites

1. **Install Playwright:**
```bash
npm install --save-dev @playwright/test
npx playwright install
```

2. **Set Environment Variables:**
Create a `.env.test` file in the project root:
```bash
BASE_URL=https://lenkersdorfer-crm.vercel.app
TEST_EMAIL=your-test-user@email.com
TEST_PASSWORD=YourTestPassword123!
```

3. **Create Test User:**
- Log into Supabase console
- Navigate to Authentication > Users
- Create a test user with the credentials above
- Verify email if required

## Running Tests

### Run All Tests
```bash
npx playwright test tests/auth-comprehensive.test.ts
```

### Run Specific Test
```bash
npx playwright test tests/auth-comprehensive.test.ts -g "TEST 1"
```

### Run in Headed Mode (See Browser)
```bash
npx playwright test tests/auth-comprehensive.test.ts --headed
```

### Run in Debug Mode
```bash
npx playwright test tests/auth-comprehensive.test.ts --debug
```

### Generate HTML Report
```bash
npx playwright test tests/auth-comprehensive.test.ts --reporter=html
npx playwright show-report
```

## Test Scenarios

### Security Tests (CRITICAL)
- **TEST 11:** Redirect parameter security (prevents open redirect attacks)

### Core Functionality
- **TEST 1:** First-time visitor sees login page
- **TEST 2:** Valid login flow completes successfully
- **TEST 3:** Invalid credentials show error
- **TEST 4:** Authenticated user bypasses login
- **TEST 5:** Authenticated user on /login redirects to dashboard
- **TEST 6:** Expired session redirects to login

### Performance Tests
- **TEST 7:** Login works on slow 3G network
- **TEST 12:** Performance metrics (FCP < 1s, TTI < 2s)

### Cross-Device Tests
- **TEST 10:** iPhone 12 Pro viewport

### Edge Cases
- **TEST 8:** Session syncs across tabs
- **TEST 9:** Back button after login

## Expected Results

### All Tests Should PASS After Fixes

If tests FAIL, refer to the specific blocker in `QA-AUTHENTICATION-TEST-REPORT.md`:

- **TEST 1 fails** → Blocker #10 (middleware fallthrough)
- **TEST 2 fails** → Blockers #1, #2, #3, #4, #9
- **TEST 5 fails** → Blocker #4 (double redirect)
- **TEST 7 fails** → Blockers #2, #9, #11
- **TEST 11 fails** → Blocker #8 (CRITICAL SECURITY)

## Manual Testing Checklist

Use this checklist for manual verification after automated tests pass:

### Mobile Devices
- [ ] iPhone 12 Pro (Safari)
- [ ] iPhone XR (Safari)
- [ ] Samsung Galaxy S21 (Chrome)
- [ ] iPad (Safari)

### Network Conditions
- [ ] Fast 4G (10+ Mbps)
- [ ] Slow 3G (0.5 Mbps)
- [ ] Offline mode (should show error, not infinite loop)

### Edge Cases
- [ ] Multiple tabs open
- [ ] Browser back button
- [ ] Direct URL access to /login when authenticated
- [ ] Session expires mid-navigation

### Security Validation
- [ ] Malicious redirect URLs rejected
- [ ] Environment variables missing shows error (not silent failure)
- [ ] No console errors during normal flow

## Debugging Failed Tests

### Check Console Logs
```bash
npx playwright test --headed --debug
```

### Take Screenshots on Failure
Add to `playwright.config.ts`:
```typescript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
}
```

### Check Network Traffic
Enable network logging in test:
```typescript
page.on('request', request => console.log('>>', request.method(), request.url()))
page.on('response', response => console.log('<<', response.status(), response.url()))
```

## Performance Benchmarks

### Target Metrics (From QA Report)
- First Contentful Paint: < 1.0 seconds
- Time to Interactive: < 2.0 seconds
- Login Flow Total: < 3.0 seconds
- Page Navigation: < 500 milliseconds

### Measure Performance Manually
```typescript
const metrics = await page.evaluate(() => {
  const perf = performance.getEntriesByType('navigation')[0]
  return {
    fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
    tti: perf.domInteractive,
    load: perf.loadEventEnd
  }
})
console.log(metrics)
```

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Authentication Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test tests/auth-comprehensive.test.ts
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Troubleshooting

### "Test user already exists"
- Delete existing test user in Supabase
- Create new test user with different email

### "Cannot connect to BASE_URL"
- Verify Vercel deployment is live
- Check BASE_URL in .env.test
- Test URL manually in browser

### "Tests timeout"
- Increase timeout in playwright.config.ts
- Check network connection
- Verify Supabase is not rate-limiting

### "Redirect loops detected"
- This indicates Blocker #1, #2, or #4 is still present
- Review QA report and apply fixes
- Re-run tests after fixes

## Next Steps After Testing

1. **If all tests PASS:**
   - Deploy to production
   - Monitor error logs for 24 hours
   - Set up automated test runs in CI/CD

2. **If tests FAIL:**
   - Identify which blocker is causing failure
   - Apply specific fix from QA report
   - Re-run tests
   - Repeat until all pass

3. **Ongoing Maintenance:**
   - Run full test suite before each deployment
   - Add new test cases for bug fixes
   - Monitor performance metrics in production
   - Update tests when auth flow changes

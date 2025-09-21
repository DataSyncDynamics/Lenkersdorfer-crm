/**
 * QA-GUARDIAN Critical User Flows E2E Tests
 * Testing complete user journeys that could impact sales
 */

import { test, expect, Page } from '@playwright/test';

test.describe('QA-GUARDIAN: Critical User Flows', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Complete Sales Journey', () => {
    test('End-to-End Sales Process: Client Search to Transaction', async ({ page }) => {
      // 1. Client Discovery
      await page.goto('/clients');
      await page.fill('[data-testid="client-search"]', 'John Smith');
      await page.press('[data-testid="client-search"]', 'Enter');

      // Wait for search results
      await page.waitForSelector('[data-testid="search-results"]', { timeout: 3000 });

      // Select client
      await page.click('[data-testid="client-item"]');

      // 2. Client Profile Review
      await expect(page.locator('[data-testid="client-details"]')).toBeVisible();

      // Verify purchase history is displayed
      const purchaseHistory = page.locator('[data-testid="purchase-history"]');
      await expect(purchaseHistory).toBeVisible();

      // 3. Navigate to Inventory/Allocation
      await page.goto('/allocation');

      // 4. Select Watch for Client
      await page.click('[data-testid="watch-selector"]');
      await page.click('[data-testid="watch-option"][data-watch="rolex-submariner"]');

      // 5. Process Allocation
      await page.fill('[data-testid="allocation-client"]', 'John Smith');
      await page.click('[data-testid="allocate-watch"]');

      // 6. Verify Allocation Success
      const successMessage = page.locator('[data-testid="allocation-success"]');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText('Successfully allocated');

      // 7. Verify Client History Updated
      await page.goto('/clients');
      await page.fill('[data-testid="client-search"]', 'John Smith');
      await page.click('[data-testid="client-item"]');

      const updatedHistory = page.locator('[data-testid="recent-allocation"]');
      await expect(updatedHistory).toContainText('Rolex Submariner');
    });

    test('Waitlist to Purchase Flow', async ({ page }) => {
      // 1. Add Client to Waitlist
      await page.goto('/waitlist');
      await page.click('[data-testid="add-to-waitlist"]');

      await page.fill('[data-testid="waitlist-client-name"]', 'Sarah Johnson');
      await page.fill('[data-testid="waitlist-watch"]', 'Rolex Daytona');
      await page.fill('[data-testid="waitlist-budget"]', '50000');

      await page.click('[data-testid="submit-waitlist"]');

      // Verify waitlist entry
      const waitlistEntry = page.locator('[data-testid="waitlist-item"]').first();
      await expect(waitlistEntry).toContainText('Sarah Johnson');

      // 2. Simulate Watch Availability
      await page.goto('/allocation');
      await page.click('[data-testid="mark-available"]');
      await page.fill('[data-testid="available-watch"]', 'Rolex Daytona');
      await page.click('[data-testid="confirm-availability"]');

      // 3. Process Waitlist Notification
      await page.goto('/waitlist');

      const notifyButton = page.locator('[data-testid="notify-client"]').first();
      await notifyButton.click();

      // 4. Convert to Sale
      await page.click('[data-testid="convert-to-sale"]');

      // 5. Verify Conversion
      const conversionSuccess = page.locator('[data-testid="conversion-success"]');
      await expect(conversionSuccess).toBeVisible();

      // Verify client removed from waitlist
      await page.goto('/waitlist');
      const remainingItems = page.locator('[data-testid="waitlist-item"]');
      await expect(remainingItems).not.toContainText('Sarah Johnson');
    });
  });

  test.describe('Error Recovery Scenarios', () => {
    test('Network Interruption Recovery', async ({ page }) => {
      await page.goto('/clients');

      // Start a search
      await page.fill('[data-testid="client-search"]', 'Alexander');

      // Simulate network interruption
      await page.context().setOffline(true);

      // Attempt to continue workflow
      await page.press('[data-testid="client-search"]', 'Enter');

      // Verify offline indicator appears
      const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
      await expect(offlineIndicator).toBeVisible({ timeout: 5000 });

      // Restore network
      await page.context().setOffline(false);

      // Verify automatic reconnection
      await page.waitForSelector('[data-testid="online-indicator"]', { timeout: 10000 });

      // Verify search works after reconnection
      await page.press('[data-testid="client-search"]', 'Enter');
      await page.waitForSelector('[data-testid="search-results"]');

      const searchResults = page.locator('[data-testid="search-results"]');
      await expect(searchResults).toBeVisible();
    });

    test('Form Data Recovery After Error', async ({ page }) => {
      await page.goto('/allocation');

      // Fill allocation form
      await page.fill('[data-testid="allocation-client"]', 'Premium Client');
      await page.fill('[data-testid="allocation-watch"]', 'Patek Philippe Nautilus');
      await page.fill('[data-testid="allocation-amount"]', '150000');

      // Simulate form error
      await page.evaluate(() => {
        // Trigger a validation error
        const form = document.querySelector('[data-testid="allocation-form"]');
        if (form) {
          form.dispatchEvent(new Event('error'));
        }
      });

      // Verify error message appears
      const errorMessage = page.locator('[data-testid="form-error"]');
      await expect(errorMessage).toBeVisible();

      // Verify form data is preserved
      const clientField = page.locator('[data-testid="allocation-client"]');
      await expect(clientField).toHaveValue('Premium Client');

      const watchField = page.locator('[data-testid="allocation-watch"]');
      await expect(watchField).toHaveValue('Patek Philippe Nautilus');

      const amountField = page.locator('[data-testid="allocation-amount"]');
      await expect(amountField).toHaveValue('150000');
    });

    test('Session Timeout Recovery', async ({ page }) => {
      await page.goto('/clients');

      // Simulate session timeout
      await page.evaluate(() => {
        localStorage.removeItem('session-token');
        sessionStorage.clear();
      });

      // Attempt protected action
      await page.goto('/allocation');

      // Verify redirect to login or session restoration
      const loginPrompt = page.locator('[data-testid="login-required"], [data-testid="session-expired"]');
      await expect(loginPrompt).toBeVisible({ timeout: 5000 });

      // Simulate session restoration
      await page.evaluate(() => {
        localStorage.setItem('session-token', 'restored-session');
      });

      await page.reload();

      // Verify access is restored
      const allocationForm = page.locator('[data-testid="allocation-form"]');
      await expect(allocationForm).toBeVisible();
    });
  });

  test.describe('Multi-Device Synchronization', () => {
    test('Real-time Updates Across Devices', async ({ page, context }) => {
      // Simulate two devices
      const page1 = page;
      const page2 = await context.newPage();

      // Device 1: Add client to waitlist
      await page1.goto('/waitlist');
      await page1.click('[data-testid="add-to-waitlist"]');
      await page1.fill('[data-testid="waitlist-client-name"]', 'Sync Test Client');
      await page1.fill('[data-testid="waitlist-watch"]', 'Rolex GMT Master');
      await page1.click('[data-testid="submit-waitlist"]');

      // Device 2: Check for real-time update
      await page2.goto('/waitlist');

      // Wait for sync
      await page2.waitForTimeout(2000);

      const syncedEntry = page2.locator('[data-testid="waitlist-item"]');
      await expect(syncedEntry).toContainText('Sync Test Client');

      // Device 2: Process waitlist item
      await page2.click('[data-testid="process-waitlist"]');

      // Device 1: Verify update appears
      await page1.reload();
      const processedStatus = page1.locator('[data-testid="waitlist-status"]');
      await expect(processedStatus).toContainText('Processed');

      await page2.close();
    });

    test('Concurrent User Conflict Resolution', async ({ page, context }) => {
      const page1 = page;
      const page2 = await context.newPage();

      // Both users access same allocation
      await page1.goto('/allocation');
      await page2.goto('/allocation');

      const watchItem = 'rolex-submariner-001';

      // User 1: Start allocation
      await page1.click(`[data-testid="allocate-${watchItem}"]`);

      // User 2: Attempt same allocation (should be prevented)
      await page2.click(`[data-testid="allocate-${watchItem}"]`);

      // Verify conflict detection
      const conflictMessage = page2.locator('[data-testid="allocation-conflict"]');
      await expect(conflictMessage).toBeVisible();
      await expect(conflictMessage).toContainText('currently being allocated');

      // User 1: Complete allocation
      await page1.fill('[data-testid="allocation-client"]', 'First User Client');
      await page1.click('[data-testid="confirm-allocation"]');

      // User 2: Verify item is no longer available
      await page2.reload();
      const unavailableItem = page2.locator(`[data-testid="allocate-${watchItem}"]`);
      await expect(unavailableItem).not.toBeVisible();

      await page2.close();
    });
  });

  test.describe('Data Integrity Flows', () => {
    test('Client Data Consistency Check', async ({ page }) => {
      await page.goto('/clients');

      // Create new client
      await page.click('[data-testid="add-client"]');
      await page.fill('[data-testid="client-name"]', 'Data Integrity Test');
      await page.fill('[data-testid="client-email"]', 'integrity@test.com');
      await page.fill('[data-testid="client-phone"]', '+1-555-TEST');
      await page.click('[data-testid="save-client"]');

      // Verify client appears in list
      await page.fill('[data-testid="client-search"]', 'Data Integrity Test');
      const clientInList = page.locator('[data-testid="client-item"]');
      await expect(clientInList).toContainText('Data Integrity Test');

      // Navigate to allocation and verify client is selectable
      await page.goto('/allocation');
      await page.click('[data-testid="client-selector"]');

      const clientOption = page.locator('[data-testid="client-option"]');
      await expect(clientOption).toContainText('Data Integrity Test');

      // Add to waitlist and verify consistency
      await page.goto('/waitlist');
      await page.click('[data-testid="add-to-waitlist"]');
      await page.fill('[data-testid="waitlist-client-name"]', 'Data Integrity Test');

      // Verify client exists validation
      const clientValidation = page.locator('[data-testid="client-validation"]');
      await expect(clientValidation).toContainText('Client found');
    });

    test('Transaction State Management', async ({ page }) => {
      await page.goto('/allocation');

      // Start transaction
      await page.fill('[data-testid="allocation-client"]', 'Transaction Test Client');
      await page.fill('[data-testid="allocation-watch"]', 'Omega Speedmaster');
      await page.fill('[data-testid="allocation-amount"]', '8000');

      // Save as draft
      await page.click('[data-testid="save-draft"]');

      // Verify draft is saved
      const draftStatus = page.locator('[data-testid="draft-status"]');
      await expect(draftStatus).toContainText('Draft saved');

      // Navigate away and return
      await page.goto('/clients');
      await page.goto('/allocation');

      // Verify draft is restored
      const clientField = page.locator('[data-testid="allocation-client"]');
      await expect(clientField).toHaveValue('Transaction Test Client');

      // Complete transaction
      await page.click('[data-testid="finalize-transaction"]');

      // Verify draft is cleared
      await page.reload();
      await expect(clientField).toHaveValue('');
    });
  });

  test.describe('Performance Under Load', () => {
    test('Rapid Navigation Performance', async ({ page }) => {
      const navigationTimes: number[] = [];
      const pages = ['/', '/clients', '/waitlist', '/allocation'];

      for (let i = 0; i < 3; i++) {
        for (const pagePath of pages) {
          const start = Date.now();
          await page.goto(pagePath);
          await page.waitForLoadState('networkidle');
          const time = Date.now() - start;
          navigationTimes.push(time);
        }
      }

      const averageTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      console.log('Average navigation time:', averageTime, 'ms');

      // Navigation should remain fast during repeated use
      expect(averageTime).toBeLessThan(1000);
    });

    test('Search Performance with Rapid Queries', async ({ page }) => {
      await page.goto('/clients');

      const searchQueries = ['John', 'Smith', 'VIP', 'Alexander', 'Premium'];
      const searchTimes: number[] = [];

      for (const query of searchQueries) {
        await page.fill('[data-testid="client-search"]', '');

        const start = Date.now();
        await page.fill('[data-testid="client-search"]', query);
        await page.waitForFunction(() => {
          const input = document.querySelector('[data-testid="client-search"]') as HTMLInputElement;
          return input && input.value === query;
        });

        const time = Date.now() - start;
        searchTimes.push(time);

        await page.waitForTimeout(100);
      }

      const averageSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      console.log('Average search time:', averageSearchTime, 'ms');

      // Search should remain responsive
      expect(averageSearchTime).toBeLessThan(200);
    });
  });

  test.describe('Accessibility & Usability', () => {
    test('Keyboard Navigation Flow', async ({ page }) => {
      await page.goto('/clients');

      // Test tab navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Should reach search input
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toHaveAttribute('data-testid', 'client-search');

      // Test search with keyboard
      await page.keyboard.type('John Smith');
      await page.keyboard.press('Enter');

      // Verify results appear
      await page.waitForSelector('[data-testid="search-results"]');
      const results = page.locator('[data-testid="search-results"]');
      await expect(results).toBeVisible();

      // Test keyboard selection
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      // Should navigate to client details
      const details = page.locator('[data-testid="client-details"]');
      await expect(details).toBeVisible();
    });

    test('Screen Reader Compatibility', async ({ page }) => {
      await page.goto('/clients');

      // Check for proper ARIA labels
      const searchInput = page.locator('[data-testid="client-search"]');
      await expect(searchInput).toHaveAttribute('aria-label');

      // Check for proper headings structure
      const headings = page.locator('h1, h2, h3');
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);

      // Check for proper form labels
      const labels = page.locator('label');
      const labelCount = await labels.count();
      expect(labelCount).toBeGreaterThan(0);

      // Verify button descriptions
      const buttons = page.locator('button');
      const buttonCount = await buttons.count();

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const hasAriaLabel = await button.getAttribute('aria-label');
        const hasText = await button.textContent();

        // Button should have either aria-label or text content
        expect(hasAriaLabel || hasText).toBeTruthy();
      }
    });
  });
});
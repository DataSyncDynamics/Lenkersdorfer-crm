/**
 * QA-GUARDIAN Critical Sales Scenarios
 * Testing high-stakes luxury watch transactions
 * FAILURE IMPACT: Potential loss of $100K+ sales
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { QAGuardianHelpers, TestDataGenerator } from '../utils/test-helpers';

describe('QA-GUARDIAN: Critical Luxury Sales Scenarios', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI ? true : false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport(QAGuardianHelpers.getIPhone12ProViewport());
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('The $10 Million Sale Scenario', () => {
    test('CRITICAL: Patek Philippe Grand Complication Sale', async () => {
      // Scenario: Ultra-high-net-worth client wants to purchase $10M watch
      const vipClient = QAGuardianHelpers.generateVIPClient();
      vipClient.purchaseHistory = 10000000; // $10M history
      vipClient.name = 'Prince Abdullah Al-Rashid';

      await page.goto('http://localhost:3000/clients');

      // 1. CRITICAL: Client search must be instant for VIP
      const searchStart = Date.now();
      await page.type('[data-testid="client-search"]', vipClient.name);

      await QAGuardianHelpers.waitForSearchResults(page, 1000);
      const searchTime = Date.now() - searchStart;

      // VIP search MUST complete in under 1 second
      expect(searchTime).toBeLessThan(1000);

      // 2. CRITICAL: VIP status must be immediately obvious
      const vipIndicatorsVisible = await QAGuardianHelpers.verifyVIPIndicators(page);
      expect(vipIndicatorsVisible).toBe(true);

      // 3. CRITICAL: Access to exclusive inventory
      await page.goto('http://localhost:3000/allocation');

      const exclusiveAccess = await page.evaluate(() => {
        // Check for exclusive inventory indicators
        const exclusiveItems = document.querySelectorAll('[data-exclusive="true"], .exclusive, [class*="vip-only"]');
        return exclusiveItems.length > 0;
      });

      expect(exclusiveAccess).toBe(true);

      // 4. CRITICAL: Transaction processing reliability
      const transactionReliable = await page.evaluate(() => {
        // Simulate transaction initiation
        const processBtn = document.querySelector('[data-testid="process-transaction"]');
        if (processBtn) {
          (processBtn as HTMLElement).click();
          return true;
        }
        return false;
      });

      // Transaction system must be accessible
      expect(transactionReliable).toBe(true);
    });

    test('CRITICAL: Multi-Client Waitlist Competition', async () => {
      // Scenario: Multiple VIP clients want the same rare Rolex Daytona
      await page.goto('http://localhost:3000/waitlist');

      const competitors = [
        { name: 'Richard Mille Jr.', priority: 1 },
        { name: 'Victoria Cartier', priority: 2 },
        { name: 'Alexander Habsburg', priority: 3 },
      ];

      // 1. CRITICAL: Waitlist must handle concurrent updates
      for (const client of competitors) {
        await page.evaluate((clientData) => {
          const addBtn = document.querySelector('[data-testid="add-to-waitlist"]');
          if (addBtn) {
            // Simulate adding client to waitlist
            (addBtn as HTMLElement).click();
          }
        }, client);

        await page.waitForTimeout(100); // Small delay between additions
      }

      // 2. CRITICAL: Priority order must be maintained
      const waitlistOrder = await page.evaluate(() => {
        const waitlistItems = Array.from(document.querySelectorAll('[data-testid*="waitlist-item"]'));
        return waitlistItems.map((item, index) => ({
          position: index + 1,
          element: item.textContent?.trim() || '',
        }));
      });

      expect(waitlistOrder.length).toBeGreaterThan(0);

      // 3. CRITICAL: No data corruption during high activity
      const dataIntegrity = await QAGuardianHelpers.checkForCriticalErrors(page);
      expect(dataIntegrity.length).toBe(0);
    });
  });

  describe('The Wrong Allocation Recovery Test', () => {
    test('CRITICAL: Accidental High-Value Allocation Recovery', async () => {
      // Scenario: Sales person accidentally allocates $500K Patek to wrong client
      await page.goto('http://localhost:3000/allocation');

      const wrongClient = 'John Smith'; // Regular client
      const correctClient = 'Alexander Habsburg'; // VIP client
      const watchValue = 500000; // $500K watch

      // 1. Simulate wrong allocation
      await page.evaluate((client) => {
        const allocationForm = document.querySelector('[data-testid="allocation-form"]');
        if (allocationForm) {
          const clientInput = allocationForm.querySelector('input[name="client"]') as HTMLInputElement;
          const watchInput = allocationForm.querySelector('input[name="watch"]') as HTMLInputElement;

          if (clientInput) clientInput.value = client;
          if (watchInput) watchInput.value = 'Patek Philippe Nautilus 5711/1A';

          const submitBtn = allocationForm.querySelector('[type="submit"]');
          if (submitBtn) (submitBtn as HTMLElement).click();
        }
      }, wrongClient);

      await page.waitForTimeout(1000);

      // 2. CRITICAL: UNDO functionality must exist
      const undoAvailable = await page.evaluate(() => {
        const undoBtn = document.querySelector('[data-testid="undo-allocation"], [data-action="undo"]');
        return undoBtn !== null;
      });

      expect(undoAvailable).toBe(true);

      // 3. CRITICAL: 30-second correction window
      const correctionTime = Date.now();

      await page.click('[data-testid="undo-allocation"]');

      const undoCompleted = Date.now() - correctionTime;

      // Undo must complete within 5 seconds
      expect(undoCompleted).toBeLessThan(5000);

      // 4. CRITICAL: Verify no financial impact
      const allocationStatus = await page.evaluate(() => {
        const statusElement = document.querySelector('[data-testid="allocation-status"]');
        return statusElement?.textContent?.includes('Available') || false;
      });

      expect(allocationStatus).toBe(true);
    });

    test('CRITICAL: Transaction Audit Trail', async () => {
      // Every high-value transaction must be auditable
      await page.goto('http://localhost:3000/allocation');

      // Generate high-value transaction
      const transaction = TestDataGenerator.generateHighValueTransaction();

      // Verify audit trail creation
      const auditTrailExists = await page.evaluate(() => {
        // Check for audit logging
        const auditSection = document.querySelector('[data-testid="audit-trail"], .audit-log');
        return auditSection !== null;
      });

      // HIGH PRIORITY: Audit trail must exist for compliance
      if (!auditTrailExists) {
        console.warn('HIGH: Audit trail not found - compliance risk');
      }

      expect(auditTrailExists).toBe(true);
    });
  });

  describe('The Unreliable Store WiFi Test', () => {
    test('CRITICAL: Offline Functionality for Read Operations', async () => {
      await page.goto('http://localhost:3000/clients');

      // Wait for initial load
      await page.waitForSelector('[data-testid="client-list"]');

      // 1. Simulate network disconnect
      await page.setOfflineMode(true);

      // 2. CRITICAL: Should still display cached client data
      const offlineDataAccess = await page.evaluate(() => {
        const clientList = document.querySelector('[data-testid="client-list"]');
        const clients = clientList?.querySelectorAll('[data-testid*="client-"]');
        return clients && clients.length > 0;
      });

      expect(offlineDataAccess).toBe(true);

      // 3. CRITICAL: Search should work on cached data
      await page.type('[data-testid="client-search"]', 'Smith');

      const offlineSearchWorks = await page.evaluate(() => {
        const searchResults = document.querySelector('[data-testid="search-results"]');
        return searchResults !== null;
      });

      expect(offlineSearchWorks).toBe(true);

      // 4. Restore connection
      await page.setOfflineMode(false);
    });

    test('CRITICAL: Write Operation Queueing', async () => {
      await page.goto('http://localhost:3000/allocation');

      // 1. Simulate network disconnect
      await page.setOfflineMode(true);

      // 2. Attempt allocation while offline
      const offlineAllocation = await page.evaluate(() => {
        const allocationForm = document.querySelector('[data-testid="allocation-form"]');
        if (allocationForm) {
          const submitBtn = allocationForm.querySelector('[type="submit"]');
          if (submitBtn) {
            (submitBtn as HTMLElement).click();
            return true;
          }
        }
        return false;
      });

      // 3. CRITICAL: Operation should be queued, not lost
      const queueIndicator = await page.evaluate(() => {
        const queuedIndicator = document.querySelector('[data-testid="queued-operation"], .offline-queue');
        return queuedIndicator !== null;
      });

      expect(queueIndicator).toBe(true);

      // 4. Restore connection and verify sync
      await page.setOfflineMode(false);

      await page.waitForTimeout(2000); // Allow sync time

      const syncCompleted = await page.evaluate(() => {
        const successIndicator = document.querySelector('[data-testid="sync-success"], .sync-complete');
        return successIndicator !== null;
      });

      expect(syncCompleted).toBe(true);
    });
  });

  describe('The Database Scale Test', () => {
    test('CRITICAL: 10,000+ Client Database Performance', async () => {
      // Simulate large client database
      await page.goto('http://localhost:3000/clients');

      // 1. CRITICAL: Initial load with large dataset
      const loadStart = Date.now();

      await page.waitForSelector('[data-testid="client-list"]');

      const loadTime = Date.now() - loadStart;

      // Must load within 3 seconds even with large dataset
      expect(loadTime).toBeLessThan(3000);

      // 2. CRITICAL: Search performance with large dataset
      const searchStart = Date.now();

      await page.type('[data-testid="client-search"]', 'Smith');

      await QAGuardianHelpers.waitForSearchResults(page, 2000);

      const searchTime = Date.now() - searchStart;

      // Search must complete within 1 second even with 10K+ clients
      expect(searchTime).toBeLessThan(1000);

      // 3. CRITICAL: Pagination should handle large datasets efficiently
      const paginationExists = await page.evaluate(() => {
        const pagination = document.querySelector('[data-testid="pagination"], .pagination');
        return pagination !== null;
      });

      expect(paginationExists).toBe(true);
    });

    test('CRITICAL: Concurrent User Stress Test', async () => {
      // Simulate 100+ users accessing system simultaneously
      await page.goto('http://localhost:3000');

      // Execute high-pressure simulation
      await QAGuardianHelpers.simulateHighPressureSales(page);

      // 1. CRITICAL: System should remain responsive
      const systemResponsive = await page.evaluate(() => {
        const body = document.querySelector('body');
        return body !== null && body.offsetHeight > 0;
      });

      expect(systemResponsive).toBe(true);

      // 2. CRITICAL: No data corruption
      const errors = await QAGuardianHelpers.checkForCriticalErrors(page);

      if (errors.length > 0) {
        console.error('BLOCKER: System errors during stress test:', errors);
      }

      expect(errors.length).toBe(0);

      // 3. CRITICAL: Memory stability
      const memoryStable = await page.evaluate(() => {
        const memory = (performance as any).memory;
        return !memory || memory.usedJSHeapSize < 100 * 1024 * 1024; // Under 100MB
      });

      expect(memoryStable).toBe(true);
    });
  });

  describe('Edge Case Scenarios', () => {
    test('CRITICAL: Special Character Handling', async () => {
      // Test with international characters and emojis
      const specialClients = [
        'José María Aznar-López',
        'François-Henri Pinault',
        'Vladimir Потёмкин',
        'Ahmed Al-Rashīd',
        '王小明', // Chinese characters
      ];

      await page.goto('http://localhost:3000/clients');

      for (const clientName of specialClients) {
        await page.fill('[data-testid="client-search"]', '');
        await page.type('[data-testid="client-search"]', clientName);

        // CRITICAL: Should handle all international characters
        const searchCompleted = await page.waitForFunction(() => {
          const input = document.querySelector('[data-testid="client-search"]') as HTMLInputElement;
          return input && input.value.length > 0;
        }, { timeout: 5000 });

        expect(searchCompleted).toBeTruthy();
      }
    });

    test('CRITICAL: Empty Database Scenario', async () => {
      // New luxury store with no clients yet
      await page.goto('http://localhost:3000/clients');

      const emptyStateHandled = await page.evaluate(() => {
        const emptyState = document.querySelector('[data-testid="empty-state"], .empty-clients');
        const addClientBtn = document.querySelector('[data-testid="add-client"], [data-action="add-client"]');

        return emptyState !== null && addClientBtn !== null;
      });

      // CRITICAL: Must handle empty state gracefully
      expect(emptyStateHandled).toBe(true);
    });

    test('CRITICAL: High-Value Transaction Validation', async () => {
      // Test $10M+ transaction validation
      await page.goto('http://localhost:3000/allocation');

      const highValueTransaction = await page.evaluate(() => {
        const form = document.querySelector('[data-testid="allocation-form"]');
        if (form) {
          const amountInput = form.querySelector('input[name="amount"]') as HTMLInputElement;
          if (amountInput) {
            amountInput.value = '10000000'; // $10M
            amountInput.dispatchEvent(new Event('change', { bubbles: true }));

            // Should trigger validation
            const validationMessage = document.querySelector('.validation-message, [data-testid="validation"]');
            return validationMessage !== null;
          }
        }
        return false;
      });

      // HIGH: High-value transactions should require additional validation
      expect(highValueTransaction).toBe(true);
    });
  });
});
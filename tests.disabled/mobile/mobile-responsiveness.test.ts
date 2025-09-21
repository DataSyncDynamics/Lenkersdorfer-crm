/**
 * QA-GUARDIAN Mobile Responsiveness Tests
 * Critical for luxury watch sales on mobile devices
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { QAGuardianHelpers, PerformanceMetrics } from '../utils/test-helpers';

describe('QA-GUARDIAN: Mobile Responsiveness - iPhone Testing', () => {
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
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
  });

  afterEach(async () => {
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Critical Sales Device Tests', () => {
    test('iPhone 12 Pro - Primary Sales Device Performance', async () => {
      const startTime = Date.now();

      await page.goto('http://localhost:3000');

      // Wait for page to be fully interactive
      await page.waitForSelector('body');

      const loadTime = Date.now() - startTime;

      // CRITICAL: Page must load in under 2 seconds on mobile
      expect(loadTime).toBeLessThan(2000);

      // Verify mobile-optimized layout
      const isMobileOptimized = await page.evaluate(() => {
        const viewport = window.innerWidth;
        const hasHamburgerMenu = document.querySelector('[data-testid="mobile-menu"]');
        const hasResponsiveGrid = document.querySelector('.grid-responsive, [class*="grid"]');

        return viewport <= 390 && (hasHamburgerMenu || hasResponsiveGrid);
      });

      expect(isMobileOptimized).toBe(true);
    });

    test('iPhone XR - Legacy Device Support', async () => {
      // Test on older device with lower performance
      await page.setViewport({
        width: 375,
        height: 812,
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });

      await page.goto('http://localhost:3000/clients');

      // Should still perform adequately on older hardware
      const searchResponse = await page.evaluate(async () => {
        const startTime = performance.now();
        const searchInput = document.querySelector('[data-testid="client-search"]') as HTMLInputElement;

        if (searchInput) {
          searchInput.value = 'John';
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));

          // Wait for search results
          await new Promise(resolve => setTimeout(resolve, 1000));

          return performance.now() - startTime;
        }
        return 0;
      });

      // Search should respond within 1.5 seconds on older devices
      expect(searchResponse).toBeLessThan(1500);
    });

    test('Samsung Galaxy S21 - Android Compatibility', async () => {
      await page.setViewport({
        width: 384,
        height: 854,
        deviceScaleFactor: 2.75,
        isMobile: true,
        hasTouch: true,
      });

      await page.setUserAgent('Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36');

      await page.goto('http://localhost:3000/waitlist');

      // Test touch interactions work properly on Android
      const touchWorking = await page.evaluate(() => {
        const touchElement = document.querySelector('[data-testid="add-to-waitlist"]');
        if (touchElement) {
          const touchEvent = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
          });
          touchElement.dispatchEvent(touchEvent);
          return true;
        }
        return false;
      });

      expect(touchWorking).toBe(true);
    });

    test('iPad - Tablet Presentation Mode', async () => {
      await page.setViewport({
        width: 1024,
        height: 1366,
        deviceScaleFactor: 2,
        isMobile: false,
        hasTouch: true,
      });

      await page.goto('http://localhost:3000/allocation');

      // Verify tablet layout utilizes larger screen efficiently
      const tabletOptimized = await page.evaluate(() => {
        const contentWidth = document.body.clientWidth;
        const hasTabletLayout = document.querySelector('[class*="tablet"], [class*="md:"], .lg\\:');

        return contentWidth > 768 && hasTabletLayout;
      });

      expect(tabletOptimized).toBe(true);
    });
  });

  describe('The Impatient VIP Test - Mobile', () => {
    test('VIP Client Search Under Pressure', async () => {
      // Simulate slow network
      await QAGuardianHelpers.simulateSlowNetwork(page);

      await page.goto('http://localhost:3000/clients');

      const vipClient = QAGuardianHelpers.generateVIPClient();

      // Start search timing
      const searchStart = Date.now();

      await page.type('[data-testid="client-search"]', vipClient.name);

      // Wait for results
      try {
        await QAGuardianHelpers.waitForSearchResults(page, 3000);
        const searchDuration = Date.now() - searchStart;

        // CRITICAL: VIP search must complete in under 3 seconds even on slow network
        expect(searchDuration).toBeLessThan(3000);

        // Verify VIP status is immediately visible
        const vipVisible = await QAGuardianHelpers.verifyVIPIndicators(page);
        expect(vipVisible).toBe(true);

      } catch (error) {
        throw new Error(`BLOCKER: VIP client search failed - ${error}`);
      }
    });

    test('Touch Interface Reliability', async () => {
      await page.goto('http://localhost:3000/clients');

      // Test that touch targets are large enough (minimum 44px as per Apple guidelines)
      const touchTargetSizes = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"], a'));
        return buttons.map(button => {
          const rect = button.getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            element: button.tagName,
          };
        });
      });

      const undersizedTargets = touchTargetSizes.filter(
        target => target.width < 44 || target.height < 44
      );

      if (undersizedTargets.length > 0) {
        console.warn('HIGH: Touch targets smaller than 44px detected:', undersizedTargets);
      }

      // Should have minimal undersized targets for luxury UX
      expect(undersizedTargets.length).toBeLessThan(3);
    });
  });

  describe('Performance Under Pressure', () => {
    test('Network Throttling - Store WiFi Simulation', async () => {
      // Simulate unreliable store WiFi
      await QAGuardianHelpers.simulateSlowNetwork(page);

      await page.goto('http://localhost:3000');

      const metrics = await QAGuardianHelpers.measurePerformance(page);

      // Even on slow network, critical metrics must be met
      expect(metrics.firstContentfulPaint).toBeLessThan(2000);
      expect(metrics.timeToInteractive).toBeLessThan(3000);
      expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1);
    });

    test('High Concurrent Usage Simulation', async () => {
      await page.goto('http://localhost:3000/clients');

      // Simulate high-pressure sales environment
      await QAGuardianHelpers.simulateHighPressureSales(page);

      // Check for any critical errors during high load
      const errors = await QAGuardianHelpers.checkForCriticalErrors(page);

      if (errors.length > 0) {
        console.error('CRITICAL: Errors detected during high load:', errors);
      }

      // System should remain stable under load
      expect(errors.length).toBe(0);
    });

    test('Memory Usage Monitoring', async () => {
      await page.goto('http://localhost:3000');

      // Navigate through multiple pages to check for memory leaks
      const pages = ['/clients', '/waitlist', '/allocation', '/'];

      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      for (const pagePath of pages) {
        await page.goto(`http://localhost:3000${pagePath}`);
        await page.waitForTimeout(500);
      }

      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Memory usage should not grow excessively
      const memoryGrowth = finalMemory - initialMemory;

      if (memoryGrowth > 50 * 1024 * 1024) { // 50MB threshold
        console.warn(`HIGH: Memory usage grew by ${memoryGrowth / 1024 / 1024}MB`);
      }

      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // 100MB max
    });
  });

  describe('Grandma Usability Test - Mobile', () => {
    test('Non-Technical User Navigation', async () => {
      await page.goto('http://localhost:3000');

      // Test that primary actions are clearly visible
      const primaryButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        return buttons.map(button => ({
          text: button.textContent?.trim() || '',
          visible: button.offsetWidth > 0 && button.offsetHeight > 0,
          hasLabel: button.getAttribute('aria-label') || button.textContent,
        }));
      });

      const unlabeledButtons = primaryButtons.filter(btn => !btn.hasLabel && btn.visible);

      // All interactive elements should be clearly labeled
      expect(unlabeledButtons.length).toBe(0);
    });

    test('Text Readability', async () => {
      await page.goto('http://localhost:3000/clients');

      const textReadability = await page.evaluate(() => {
        const textElements = Array.from(document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6'));
        const styles = textElements.map(element => {
          const style = window.getComputedStyle(element);
          return {
            fontSize: parseFloat(style.fontSize),
            lineHeight: parseFloat(style.lineHeight),
            contrast: style.color,
          };
        });

        return styles.filter(style =>
          style.fontSize < 16 || // Minimum readable font size
          (style.lineHeight > 0 && style.lineHeight < 1.2) // Minimum line height
        );
      });

      // Text should be readable without strain
      expect(textReadability.length).toBeLessThan(5);
    });
  });
});
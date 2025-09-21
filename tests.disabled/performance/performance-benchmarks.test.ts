/**
 * QA-GUARDIAN Performance Benchmarks
 * Non-negotiable performance standards for luxury sales
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import { QAGuardianHelpers, PerformanceMetrics } from '../utils/test-helpers';

describe('QA-GUARDIAN: Performance Benchmarks', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: process.env.CI ? true : false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--enable-performance-manager-tab-discarding',
      ],
    });
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.setViewport(QAGuardianHelpers.getIPhone12ProViewport());

    // Enable performance monitoring
    await page.coverage.startCSSCoverage();
    await page.coverage.startJSCoverage();
  });

  afterEach(async () => {
    await page.coverage.stopCSSCoverage();
    await page.coverage.stopJSCoverage();
    await page.close();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Core Web Vitals - Non-Negotiable Benchmarks', () => {
    test('First Contentful Paint < 1.0 seconds', async () => {
      const startTime = Date.now();

      await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });

      const metrics = await QAGuardianHelpers.measurePerformance(page);

      console.log('FCP:', metrics.firstContentfulPaint, 'ms');

      // CRITICAL: First content must appear in under 1 second
      expect(metrics.firstContentfulPaint).toBeLessThan(1000);
    });

    test('Time to Interactive < 2.0 seconds', async () => {
      await page.goto('http://localhost:3000');

      const metrics = await QAGuardianHelpers.measurePerformance(page);

      console.log('TTI:', metrics.timeToInteractive, 'ms');

      // CRITICAL: Page must be interactive within 2 seconds
      expect(metrics.timeToInteractive).toBeLessThan(2000);
    });

    test('Largest Contentful Paint < 2.5 seconds', async () => {
      await page.goto('http://localhost:3000');

      const metrics = await QAGuardianHelpers.measurePerformance(page);

      console.log('LCP:', metrics.largestContentfulPaint, 'ms');

      // CRITICAL: Largest content element must load within 2.5 seconds
      expect(metrics.largestContentfulPaint).toBeLessThan(2500);
    });

    test('Cumulative Layout Shift < 0.1', async () => {
      await page.goto('http://localhost:3000');

      // Wait for all animations to complete
      await page.waitForTimeout(3000);

      const metrics = await QAGuardianHelpers.measurePerformance(page);

      console.log('CLS:', metrics.cumulativeLayoutShift);

      // CRITICAL: Minimal layout shifts for professional appearance
      expect(metrics.cumulativeLayoutShift).toBeLessThan(0.1);
    });
  });

  describe('Search Performance - Under 100ms', () => {
    test('Client Search Response Time', async () => {
      await page.goto('http://localhost:3000/clients');

      // Wait for initial load
      await page.waitForSelector('[data-testid="client-search"]');

      // Measure search performance
      const searchTimes: number[] = [];

      const searchQueries = ['John', 'Smith', 'VIP', 'Alexander', 'Rolex'];

      for (const query of searchQueries) {
        await page.fill('[data-testid="client-search"]', '');

        const searchStart = performance.now();

        await page.type('[data-testid="client-search"]', query);

        // Wait for search to trigger (typically on input event)
        await page.waitForFunction(() => {
          const input = document.querySelector('[data-testid="client-search"]') as HTMLInputElement;
          return input && input.value === query;
        });

        const searchTime = performance.now() - searchStart;
        searchTimes.push(searchTime);

        await page.waitForTimeout(100); // Small delay between searches
      }

      const averageSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;

      console.log('Average search time:', averageSearchTime, 'ms');
      console.log('Search times:', searchTimes);

      // CRITICAL: Search must be near-instantaneous
      expect(averageSearchTime).toBeLessThan(100);

      // No individual search should exceed 200ms
      const slowSearches = searchTimes.filter(time => time > 200);
      expect(slowSearches.length).toBe(0);
    });

    test('Search Results Rendering Performance', async () => {
      await page.goto('http://localhost:3000/clients');

      const renderStart = Date.now();

      await page.type('[data-testid="client-search"]', 'Smith');

      // Wait for results to appear
      await QAGuardianHelpers.waitForSearchResults(page, 1000);

      const renderTime = Date.now() - renderStart;

      console.log('Search results render time:', renderTime, 'ms');

      // CRITICAL: Results must appear within 500ms
      expect(renderTime).toBeLessThan(500);
    });
  });

  describe('Page Navigation - Under 500ms', () => {
    test('Client Page Navigation', async () => {
      await page.goto('http://localhost:3000');

      const navigationTimes: number[] = [];

      const pages = [
        { name: 'Clients', path: '/clients' },
        { name: 'Waitlist', path: '/waitlist' },
        { name: 'Allocation', path: '/allocation' },
        { name: 'Home', path: '/' },
      ];

      for (const pageInfo of pages) {
        const navStart = Date.now();

        await page.click(`[href="${pageInfo.path}"]`);

        await page.waitForSelector('body');

        const navTime = Date.now() - navStart;
        navigationTimes.push(navTime);

        console.log(`${pageInfo.name} navigation:`, navTime, 'ms');

        await page.waitForTimeout(100);
      }

      const averageNavTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;

      console.log('Average navigation time:', averageNavTime, 'ms');

      // CRITICAL: Page navigation must be under 500ms
      expect(averageNavTime).toBeLessThan(500);

      // No individual navigation should exceed 1 second
      const slowNavigations = navigationTimes.filter(time => time > 1000);
      expect(slowNavigations.length).toBe(0);
    });
  });

  describe('Network Performance Under Load', () => {
    test('Slow 3G Network Simulation', async () => {
      // Simulate slow 3G: 0.5 Mbps
      await QAGuardianHelpers.simulateSlowNetwork(page);

      const loadStart = Date.now();

      await page.goto('http://localhost:3000');

      const loadTime = Date.now() - loadStart;

      console.log('Slow 3G load time:', loadTime, 'ms');

      // CRITICAL: Must load within 5 seconds on slow network
      expect(loadTime).toBeLessThan(5000);
    });

    test('Resource Optimization Check', async () => {
      await page.goto('http://localhost:3000');

      // Check for optimized resources
      const resourceSizes = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
        return resources.map(resource => ({
          name: resource.name,
          size: resource.transferSize,
          type: resource.initiatorType,
        }));
      });

      // Check for oversized resources
      const largeResources = resourceSizes.filter(resource =>
        resource.size > 500 * 1024 && // Over 500KB
        (resource.type === 'script' || resource.type === 'img')
      );

      if (largeResources.length > 0) {
        console.warn('MEDIUM: Large resources detected:', largeResources);
      }

      // Should minimize large resources for mobile performance
      expect(largeResources.length).toBeLessThan(3);
    });

    test('Bundle Size Analysis', async () => {
      const jsCoverage = await page.coverage.stopJSCoverage();
      await page.coverage.startJSCoverage();

      await page.goto('http://localhost:3000');

      const totalJSSize = jsCoverage.reduce((total, entry) => total + entry.text.length, 0);

      console.log('Total JS bundle size:', (totalJSSize / 1024).toFixed(2), 'KB');

      // MEDIUM: Bundle should be optimized for mobile
      const maxBundleSize = 1024 * 1024; // 1MB
      if (totalJSSize > maxBundleSize) {
        console.warn(`MEDIUM: JS bundle size ${(totalJSSize / 1024 / 1024).toFixed(2)}MB exceeds 1MB recommendation`);
      }

      expect(totalJSSize).toBeLessThan(maxBundleSize * 2); // 2MB hard limit
    });
  });

  describe('Memory Performance', () => {
    test('Memory Usage Monitoring', async () => {
      await page.goto('http://localhost:3000');

      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      // Navigate through all pages multiple times
      const pages = ['/clients', '/waitlist', '/allocation', '/'];

      for (let i = 0; i < 3; i++) {
        for (const pagePath of pages) {
          await page.goto(`http://localhost:3000${pagePath}`);
          await page.waitForTimeout(200);
        }
      }

      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });

      const memoryGrowth = finalMemory - initialMemory;

      console.log('Memory growth:', (memoryGrowth / 1024 / 1024).toFixed(2), 'MB');

      // CRITICAL: Memory should not grow excessively
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024); // 50MB threshold
    });

    test('Garbage Collection Efficiency', async () => {
      await page.goto('http://localhost:3000');

      // Force garbage collection if available
      const gcResult = await page.evaluate(() => {
        if ((window as any).gc) {
          const beforeGC = (performance as any).memory?.usedJSHeapSize || 0;
          (window as any).gc();
          const afterGC = (performance as any).memory?.usedJSHeapSize || 0;
          return { before: beforeGC, after: afterGC };
        }
        return null;
      });

      if (gcResult) {
        const memoryFreed = gcResult.before - gcResult.after;
        console.log('Memory freed by GC:', (memoryFreed / 1024 / 1024).toFixed(2), 'MB');

        // Should free some memory during GC
        expect(memoryFreed).toBeGreaterThan(0);
      }
    });
  });

  describe('Database Performance Simulation', () => {
    test('Large Dataset Query Performance', async () => {
      await page.goto('http://localhost:3000/clients');

      // Simulate large client search
      const searchStart = Date.now();

      await page.type('[data-testid="client-search"]', 'a'); // Should match many clients

      try {
        await QAGuardianHelpers.waitForSearchResults(page, 2000);
        const searchTime = Date.now() - searchStart;

        console.log('Large dataset search time:', searchTime, 'ms');

        // CRITICAL: Even with large datasets, search must be fast
        expect(searchTime).toBeLessThan(1000);

      } catch (error) {
        throw new Error(`BLOCKER: Search failed with large dataset - ${error}`);
      }
    });

    test('Pagination Performance', async () => {
      await page.goto('http://localhost:3000/clients');

      const paginationExists = await page.evaluate(() => {
        return document.querySelector('[data-testid="pagination"], .pagination') !== null;
      });

      if (paginationExists) {
        const pageLoadStart = Date.now();

        await page.click('[data-testid="next-page"], .pagination-next');

        await page.waitForSelector('[data-testid="client-list"]');

        const pageLoadTime = Date.now() - pageLoadStart;

        console.log('Pagination load time:', pageLoadTime, 'ms');

        // CRITICAL: Pagination should be instant
        expect(pageLoadTime).toBeLessThan(500);
      }
    });
  });

  describe('Performance Regression Detection', () => {
    test('Performance Budget Enforcement', async () => {
      await page.goto('http://localhost:3000');

      const performanceEntry = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
          load: navigation.loadEventEnd - navigation.loadEventStart,
          domComplete: navigation.domComplete - navigation.navigationStart,
        };
      });

      console.log('Performance metrics:', performanceEntry);

      // Enforce performance budgets
      expect(performanceEntry.domContentLoaded).toBeLessThan(1500);
      expect(performanceEntry.load).toBeLessThan(3000);
      expect(performanceEntry.domComplete).toBeLessThan(4000);
    });

    test('Performance Baseline Comparison', async () => {
      const metrics = await QAGuardianHelpers.measurePerformance(page);

      const performanceBaseline = {
        fcp: 800,  // Target FCP
        tti: 1500, // Target TTI
        lcp: 2000, // Target LCP
        cls: 0.05, // Target CLS
      };

      const performanceReport = {
        fcp: { actual: metrics.firstContentfulPaint, target: performanceBaseline.fcp, passed: metrics.firstContentfulPaint <= performanceBaseline.fcp },
        tti: { actual: metrics.timeToInteractive, target: performanceBaseline.tti, passed: metrics.timeToInteractive <= performanceBaseline.tti },
        lcp: { actual: metrics.largestContentfulPaint, target: performanceBaseline.lcp, passed: metrics.largestContentfulPaint <= performanceBaseline.lcp },
        cls: { actual: metrics.cumulativeLayoutShift, target: performanceBaseline.cls, passed: metrics.cumulativeLayoutShift <= performanceBaseline.cls },
      };

      console.log('Performance Report:', performanceReport);

      // Generate warnings for metrics that exceed targets
      Object.entries(performanceReport).forEach(([metric, data]) => {
        if (!data.passed) {
          console.warn(`MEDIUM: ${metric.toUpperCase()} ${data.actual} exceeds target ${data.target}`);
        }
      });

      // At least 75% of metrics should meet targets
      const passedMetrics = Object.values(performanceReport).filter(data => data.passed).length;
      const totalMetrics = Object.values(performanceReport).length;
      const passRate = passedMetrics / totalMetrics;

      expect(passRate).toBeGreaterThanOrEqual(0.75);
    });
  });
});
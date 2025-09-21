import { Page } from '@playwright/test';
import puppeteer, { Browser, Page as PuppeteerPage } from 'puppeteer';

// QA-GUARDIAN Test Helpers for Luxury Watch CRM

export interface PerformanceMetrics {
  firstContentfulPaint: number;
  timeToInteractive: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
}

export interface TestClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  vipStatus: boolean;
  purchaseHistory: number;
  preferredBrands: string[];
}

export class QAGuardianHelpers {
  // Generate VIP test clients for high-value scenarios
  static generateVIPClient(): TestClient {
    return {
      id: 'vip-001',
      name: 'Alexander Von Habsburg',
      email: 'alexander@royalfamily.eu',
      phone: '+41-79-123-4567',
      vipStatus: true,
      purchaseHistory: 2500000, // $2.5M purchase history
      preferredBrands: ['Patek Philippe', 'Vacheron Constantin', 'A. Lange & Söhne']
    };
  }

  // Generate regular client for standard testing
  static generateRegularClient(): TestClient {
    return {
      id: 'reg-001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+1-555-123-4567',
      vipStatus: false,
      purchaseHistory: 25000,
      preferredBrands: ['Rolex', 'Omega']
    };
  }

  // Network throttling simulation
  static async simulateSlowNetwork(page: Page | PuppeteerPage) {
    if ('route' in page) {
      // Playwright
      await (page as Page).route('**/*', async (route) => {
        // Simulate 3G network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        await route.continue();
      });
    } else {
      // Puppeteer
      const client = await (page as PuppeteerPage).target().createCDPSession();
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: 500 * 1024 / 8, // 500 kbps
        uploadThroughput: 500 * 1024 / 8,   // 500 kbps
        latency: 2000, // 2 second latency
      });
    }
  }

  // iPhone 12 Pro viewport setup
  static getIPhone12ProViewport() {
    return {
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    };
  }

  // Performance measurement
  static async measurePerformance(page: Page | PuppeteerPage): Promise<PerformanceMetrics> {
    const metrics = await page.evaluate(() => {
      return new Promise<PerformanceMetrics>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const paintEntries = performance.getEntriesByType('paint');
          const navigationEntries = performance.getEntriesByType('navigation');

          const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
          const lcp = entries.find(entry => entry.entryType === 'largest-contentful-paint')?.startTime || 0;
          const cls = entries.filter(entry => entry.entryType === 'layout-shift')
            .reduce((sum, entry: any) => sum + entry.value, 0);

          const tti = navigationEntries[0] ? (navigationEntries[0] as any).domInteractive : 0;

          resolve({
            firstContentfulPaint: fcp,
            timeToInteractive: tti,
            largestContentfulPaint: lcp,
            cumulativeLayoutShift: cls,
          });
        }).observe({ entryTypes: ['paint', 'largest-contentful-paint', 'layout-shift'] });
      });
    });

    return metrics;
  }

  // Wait for search results with timeout
  static async waitForSearchResults(page: Page | PuppeteerPage, timeout = 3000) {
    try {
      if ('waitForSelector' in page) {
        await (page as Page).waitForSelector('[data-testid="search-results"]', { timeout });
      } else {
        await (page as PuppeteerPage).waitForSelector('[data-testid="search-results"]', { timeout });
      }
    } catch (error) {
      throw new Error(`Search results did not load within ${timeout}ms - CRITICAL FAILURE`);
    }
  }

  // Simulate high-pressure sales scenario
  static async simulateHighPressureSales(page: Page | PuppeteerPage) {
    // Simulate multiple concurrent users
    const concurrent = Array.from({ length: 10 }, (_, i) =>
      this.simulateConcurrentUser(page, i)
    );

    return Promise.all(concurrent);
  }

  private static async simulateConcurrentUser(page: Page | PuppeteerPage, userId: number) {
    // Each user performs rapid actions simulating busy store environment
    const actions = [
      () => this.searchClient(page, 'Smith'),
      () => this.viewClientDetails(page, `client-${userId}`),
      () => this.checkInventory(page, 'Rolex Submariner'),
    ];

    for (const action of actions) {
      await action();
      await page.waitForTimeout(Math.random() * 1000); // Random delay
    }
  }

  private static async searchClient(page: Page | PuppeteerPage, query: string) {
    const searchInput = '[data-testid="client-search"]';
    if ('fill' in page) {
      await (page as Page).fill(searchInput, query);
      await (page as Page).press(searchInput, 'Enter');
    } else {
      await (page as PuppeteerPage).type(searchInput, query);
      await (page as PuppeteerPage).keyboard.press('Enter');
    }
  }

  private static async viewClientDetails(page: Page | PuppeteerPage, clientId: string) {
    const clientLink = `[data-testid="client-${clientId}"]`;
    if ('click' in page) {
      await (page as Page).click(clientLink);
    } else {
      await (page as PuppeteerPage).click(clientLink);
    }
  }

  private static async checkInventory(page: Page | PuppeteerPage, watch: string) {
    if ('goto' in page) {
      await (page as Page).goto('/inventory');
    } else {
      await (page as PuppeteerPage).goto('http://localhost:3000/inventory');
    }
  }

  // Verify VIP status indicators
  static async verifyVIPIndicators(page: Page | PuppeteerPage): Promise<boolean> {
    const vipBadges = [
      '[data-testid="vip-badge"]',
      '.vip-indicator',
      '[class*="vip"]',
    ];

    for (const selector of vipBadges) {
      try {
        if ('isVisible' in page) {
          const isVisible = await (page as Page).isVisible(selector);
          if (isVisible) return true;
        } else {
          const element = await (page as PuppeteerPage).$(selector);
          if (element) return true;
        }
      } catch (error) {
        continue;
      }
    }

    return false;
  }

  // Check for critical errors that could lose sales
  static async checkForCriticalErrors(page: Page | PuppeteerPage): Promise<string[]> {
    const errors: string[] = [];

    // Check console errors
    const consoleLogs = await page.evaluate(() => {
      const logs: string[] = [];
      const originalError = console.error;
      console.error = (...args) => {
        logs.push(args.join(' '));
        originalError.apply(console, args);
      };
      return logs;
    });

    errors.push(...consoleLogs);

    // Check for error messages in UI
    const errorSelectors = [
      '[data-testid="error-message"]',
      '.error',
      '[class*="error"]',
      '.alert-error',
    ];

    for (const selector of errorSelectors) {
      try {
        if ('textContent' in page) {
          const errorText = await (page as Page).textContent(selector);
          if (errorText) errors.push(errorText);
        } else {
          const element = await (page as PuppeteerPage).$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent);
            if (text) errors.push(text);
          }
        }
      } catch (error) {
        // Selector not found, continue
      }
    }

    return errors;
  }
}

// Test data generators
export class TestDataGenerator {
  static generateLargeClientDatabase(size: number): TestClient[] {
    const clients: TestClient[] = [];
    const firstNames = ['Alexander', 'Catherine', 'Wilhelm', 'Isabella', 'Maximilian', 'Sophia', 'Friedrich', 'Victoria'];
    const lastNames = ['Habsburg', 'Rothschild', 'Vanderbilt', 'Rockefeller', 'Carnegie', 'Astor', 'Morgan', 'Smith'];
    const brands = ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Vacheron Constantin', 'A. Lange & Söhne'];

    for (let i = 0; i < size; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const isVIP = Math.random() < 0.1; // 10% VIP clients

      clients.push({
        id: `client-${i.toString().padStart(5, '0')}`,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
        phone: `+1-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        vipStatus: isVIP,
        purchaseHistory: isVIP ? Math.floor(Math.random() * 5000000) + 100000 : Math.floor(Math.random() * 100000),
        preferredBrands: brands.slice(0, Math.floor(Math.random() * 3) + 1),
      });
    }

    return clients;
  }

  static generateHighValueTransaction() {
    return {
      id: `tx-${Date.now()}`,
      amount: Math.floor(Math.random() * 10000000) + 50000, // $50K - $10M
      watch: 'Patek Philippe Nautilus 5711',
      client: QAGuardianHelpers.generateVIPClient(),
      timestamp: new Date(),
    };
  }
}
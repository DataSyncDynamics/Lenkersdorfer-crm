import '@testing-library/jest-dom';

// Global test setup for QA-GUARDIAN testing
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinPerformanceBudget(threshold: number): R;
      toBeAccessible(): R;
    }
  }
}

// Performance testing matcher
expect.extend({
  toBeWithinPerformanceBudget(received: number, threshold: number) {
    const pass = received <= threshold;
    if (pass) {
      return {
        message: () => `Expected ${received}ms to be above performance threshold ${threshold}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `Performance failure: ${received}ms exceeds threshold ${threshold}ms`,
        pass: false,
      };
    }
  },
});

// Mock performance API for testing
Object.defineProperty(window, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    measure: jest.fn(),
    mark: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    getEntriesByName: jest.fn(() => []),
  },
  writable: true,
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Test environment configuration
process.env.NODE_ENV = 'test';

// Global test timeout for luxury CRM operations
jest.setTimeout(30000);
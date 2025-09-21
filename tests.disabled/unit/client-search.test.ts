/**
 * QA-GUARDIAN Unit Tests - Client Search Functionality
 * Critical component testing for client search performance
 */

import { describe, expect, test, beforeEach, jest } from '@jest/globals';
import { LuxuryTestDataGenerator, LuxuryClient } from '../utils/test-data-generator';

// Mock the client search functionality
interface SearchResult {
  clients: LuxuryClient[];
  total: number;
  searchTime: number;
}

class ClientSearchService {
  private clients: LuxuryClient[] = [];

  constructor(clients: LuxuryClient[]) {
    this.clients = clients;
  }

  search(query: string, filters?: {
    vipOnly?: boolean;
    minPurchaseHistory?: number;
    preferredBrands?: string[];
  }): SearchResult {
    const startTime = performance.now();

    let filteredClients = this.clients.filter(client => {
      const nameMatch = client.fullName.toLowerCase().includes(query.toLowerCase()) ||
                       client.firstName.toLowerCase().includes(query.toLowerCase()) ||
                       client.lastName.toLowerCase().includes(query.toLowerCase());

      const emailMatch = client.email.toLowerCase().includes(query.toLowerCase());

      return nameMatch || emailMatch;
    });

    // Apply additional filters
    if (filters?.vipOnly) {
      filteredClients = filteredClients.filter(client => client.vipStatus);
    }

    if (filters?.minPurchaseHistory) {
      filteredClients = filteredClients.filter(client =>
        client.purchaseHistory >= filters.minPurchaseHistory!
      );
    }

    if (filters?.preferredBrands?.length) {
      filteredClients = filteredClients.filter(client =>
        client.preferredBrands.some(brand =>
          filters.preferredBrands!.includes(brand)
        )
      );
    }

    const searchTime = performance.now() - startTime;

    return {
      clients: filteredClients,
      total: filteredClients.length,
      searchTime
    };
  }

  getVIPClients(): LuxuryClient[] {
    return this.clients.filter(client => client.vipStatus);
  }

  getClientById(id: string): LuxuryClient | undefined {
    return this.clients.find(client => client.id === id);
  }
}

describe('QA-GUARDIAN: Client Search Performance', () => {
  let searchService: ClientSearchService;
  let testClients: LuxuryClient[];

  beforeEach(() => {
    // Generate test data
    const vipClients = LuxuryTestDataGenerator.generateVIPClients(50);
    const regularClients = LuxuryTestDataGenerator.generateRegularClients(200);
    testClients = [...vipClients, ...regularClients];

    searchService = new ClientSearchService(testClients);
  });

  describe('Search Performance Requirements', () => {
    test('CRITICAL: VIP client search completes under 100ms', () => {
      const result = searchService.search('Alexander Habsburg', { vipOnly: true });

      expect(result.searchTime).toBeLessThan(100);
      expect(result.clients.length).toBeGreaterThan(0);
      expect(result.clients.every(client => client.vipStatus)).toBe(true);
    });

    test('CRITICAL: Regular search completes under 50ms', () => {
      const result = searchService.search('John Smith');

      expect(result.searchTime).toBeLessThan(50);
    });

    test('CRITICAL: Partial name search works correctly', () => {
      const result = searchService.search('John');

      expect(result.clients.length).toBeGreaterThan(0);
      expect(result.clients.every(client =>
        client.firstName.toLowerCase().includes('john') ||
        client.lastName.toLowerCase().includes('john') ||
        client.fullName.toLowerCase().includes('john')
      )).toBe(true);
    });

    test('CRITICAL: Email search functionality', () => {
      const vipClient = testClients.find(client => client.vipStatus);
      const emailPart = vipClient!.email.split('@')[0];

      const result = searchService.search(emailPart);

      expect(result.clients.length).toBeGreaterThan(0);
      expect(result.clients.some(client => client.email.includes(emailPart))).toBe(true);
    });
  });

  describe('VIP Client Identification', () => {
    test('CRITICAL: VIP status is immediately identifiable', () => {
      const vipClients = searchService.getVIPClients();

      expect(vipClients.length).toBeGreaterThan(0);
      expect(vipClients.every(client => client.vipStatus)).toBe(true);
      expect(vipClients.every(client => client.vipTier)).toBe(true);
    });

    test('CRITICAL: VIP clients have higher purchase history', () => {
      const vipClients = searchService.getVIPClients();

      const averageVIPPurchase = vipClients.reduce((sum, client) =>
        sum + client.purchaseHistory, 0) / vipClients.length;

      // VIP clients should have significantly higher purchase history
      expect(averageVIPPurchase).toBeGreaterThan(100000);
    });

    test('HIGH: VIP tier classification is correct', () => {
      const vipClients = searchService.getVIPClients();

      const diamondClients = vipClients.filter(client => client.vipTier === 'diamond');
      const platinumClients = vipClients.filter(client => client.vipTier === 'platinum');

      if (diamondClients.length > 0) {
        const avgDiamondPurchase = diamondClients.reduce((sum, client) =>
          sum + client.purchaseHistory, 0) / diamondClients.length;

        expect(avgDiamondPurchase).toBeGreaterThan(1500000);
      }

      if (platinumClients.length > 0) {
        const avgPlatinumPurchase = platinumClients.reduce((sum, client) =>
          sum + client.purchaseHistory, 0) / platinumClients.length;

        expect(avgPlatinumPurchase).toBeGreaterThan(800000);
      }
    });
  });

  describe('Advanced Search Filters', () => {
    test('CRITICAL: High-value client filtering', () => {
      const result = searchService.search('', {
        minPurchaseHistory: 500000
      });

      expect(result.clients.every(client =>
        client.purchaseHistory >= 500000
      )).toBe(true);
    });

    test('HIGH: Brand preference filtering', () => {
      const result = searchService.search('', {
        preferredBrands: ['Patek Philippe', 'Rolex']
      });

      expect(result.clients.every(client =>
        client.preferredBrands.some(brand =>
          ['Patek Philippe', 'Rolex'].includes(brand)
        )
      )).toBe(true);
    });

    test('MEDIUM: Combined filter performance', () => {
      const startTime = performance.now();

      const result = searchService.search('A', {
        vipOnly: true,
        minPurchaseHistory: 200000,
        preferredBrands: ['Patek Philippe']
      });

      const searchTime = performance.now() - startTime;

      expect(searchTime).toBeLessThan(150); // Complex search under 150ms
      expect(result.clients.every(client =>
        client.vipStatus &&
        client.purchaseHistory >= 200000 &&
        client.preferredBrands.includes('Patek Philippe')
      )).toBe(true);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('CRITICAL: Empty search query handling', () => {
      const result = searchService.search('');

      expect(result.clients.length).toBe(testClients.length);
      expect(result.searchTime).toBeLessThan(100);
    });

    test('CRITICAL: No results found handling', () => {
      const result = searchService.search('NonexistentClientName12345');

      expect(result.clients.length).toBe(0);
      expect(result.total).toBe(0);
      expect(result.searchTime).toBeLessThan(50);
    });

    test('HIGH: Special character search handling', () => {
      // Add a client with special characters
      const specialClient: LuxuryClient = {
        id: 'special-001',
        firstName: 'José María',
        lastName: 'Aznar-López',
        fullName: 'José María Aznar-López',
        email: 'jose.maria@test.com',
        phone: '+34-912-345-678',
        vipStatus: true,
        vipTier: 'gold',
        purchaseHistory: 500000,
        totalSpent: 500000,
        preferredBrands: ['Patek Philippe'],
        preferredCategories: ['dress'],
        budgetRange: { min: 50000, max: 300000 },
        acquisitionDate: new Date(),
        notes: ['Special characters test'],
        communicationPreference: 'phone',
        timeZone: 'Europe/Madrid',
        country: 'Spain',
        language: 'Spanish'
      };

      const serviceWithSpecial = new ClientSearchService([...testClients, specialClient]);

      const result = serviceWithSpecial.search('José María');
      expect(result.clients.length).toBeGreaterThan(0);
      expect(result.clients[0].fullName).toBe('José María Aznar-López');
    });

    test('MEDIUM: Case insensitive search', () => {
      const upperCaseResult = searchService.search('JOHN');
      const lowerCaseResult = searchService.search('john');
      const mixedCaseResult = searchService.search('John');

      expect(upperCaseResult.clients.length).toBe(lowerCaseResult.clients.length);
      expect(lowerCaseResult.clients.length).toBe(mixedCaseResult.clients.length);
    });
  });

  describe('Large Dataset Performance', () => {
    test('CRITICAL: Performance with 10,000+ clients', () => {
      // Generate large dataset
      const largeDataset = LuxuryTestDataGenerator.generatePerformanceTestDataset();
      const largeSearchService = new ClientSearchService(largeDataset.clients);

      const result = largeSearchService.search('Smith');

      // Even with large dataset, search must be fast
      expect(result.searchTime).toBeLessThan(200);
      expect(result.clients.length).toBeGreaterThan(0);
    });

    test('HIGH: Memory efficiency with large datasets', () => {
      const largeDataset = LuxuryTestDataGenerator.generatePerformanceTestDataset();
      const largeSearchService = new ClientSearchService(largeDataset.clients);

      // Memory usage should be reasonable
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform multiple searches
      for (let i = 0; i < 100; i++) {
        largeSearchService.search(`test${i}`);
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryGrowth = finalMemory - initialMemory;

      // Memory growth should be minimal (under 50MB)
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Client Retrieval Operations', () => {
    test('CRITICAL: Client by ID retrieval performance', () => {
      const vipClient = testClients.find(client => client.vipStatus);
      const startTime = performance.now();

      const result = searchService.getClientById(vipClient!.id);
      const retrievalTime = performance.now() - startTime;

      expect(retrievalTime).toBeLessThan(10); // Should be near instantaneous
      expect(result).toBeDefined();
      expect(result!.id).toBe(vipClient!.id);
    });

    test('CRITICAL: Nonexistent client ID handling', () => {
      const result = searchService.getClientById('nonexistent-id');

      expect(result).toBeUndefined();
    });
  });

  describe('Search Result Accuracy', () => {
    test('CRITICAL: Search results relevance', () => {
      const result = searchService.search('Alexander');

      // All results should contain 'Alexander' in name or email
      expect(result.clients.every(client =>
        client.fullName.toLowerCase().includes('alexander') ||
        client.firstName.toLowerCase().includes('alexander') ||
        client.lastName.toLowerCase().includes('alexander') ||
        client.email.toLowerCase().includes('alexander')
      )).toBe(true);
    });

    test('HIGH: Search result ordering consistency', () => {
      const result1 = searchService.search('Smith');
      const result2 = searchService.search('Smith');

      // Results should be consistent across searches
      expect(result1.clients.length).toBe(result2.clients.length);
      expect(result1.clients.map(c => c.id)).toEqual(result2.clients.map(c => c.id));
    });
  });
});
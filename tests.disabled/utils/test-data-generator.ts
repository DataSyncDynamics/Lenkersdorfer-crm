/**
 * QA-GUARDIAN Test Data Generator
 * Generates realistic test data for luxury watch CRM scenarios
 */

export interface LuxuryWatch {
  id: string;
  brand: string;
  model: string;
  reference: string;
  price: number;
  availability: 'available' | 'allocated' | 'waitlist' | 'exclusive';
  rarity: 'common' | 'rare' | 'ultra-rare' | 'one-of-a-kind';
  category: 'dress' | 'sport' | 'complication' | 'vintage';
  materials: string[];
  complications: string[];
  yearManufactured?: number;
}

export interface LuxuryClient {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  vipStatus: boolean;
  vipTier?: 'silver' | 'gold' | 'platinum' | 'diamond';
  purchaseHistory: number;
  totalSpent: number;
  preferredBrands: string[];
  preferredCategories: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  acquisitionDate: Date;
  lastPurchase?: Date;
  notes: string[];
  communicationPreference: 'email' | 'phone' | 'in-person' | 'whatsapp';
  timeZone: string;
  country: string;
  language: string;
}

export interface Transaction {
  id: string;
  clientId: string;
  watchId: string;
  amount: number;
  date: Date;
  status: 'pending' | 'completed' | 'cancelled' | 'refunded';
  paymentMethod: 'wire' | 'credit' | 'crypto' | 'check' | 'cash';
  salesPerson: string;
  commission: number;
  notes: string[];
  warranty: boolean;
  insurance: boolean;
  deliveryMethod: 'pickup' | 'courier' | 'white-glove' | 'vault';
}

export interface WaitlistEntry {
  id: string;
  clientId: string;
  watchBrand: string;
  watchModel: string;
  maxBudget: number;
  priority: number;
  dateAdded: Date;
  estimatedWaitTime?: number; // in days
  notificationPreference: 'immediate' | 'daily' | 'weekly';
  status: 'active' | 'notified' | 'converted' | 'expired';
  notes: string[];
}

export class LuxuryTestDataGenerator {
  private static readonly LUXURY_BRANDS = [
    'Patek Philippe', 'Audemars Piguet', 'Vacheron Constantin', 'A. Lange & Söhne',
    'Jaeger-LeCoultre', 'Breguet', 'Blancpain', 'Richard Mille', 'F.P. Journe',
    'Rolex', 'Omega', 'Cartier', 'IWC', 'Panerai', 'Hublot', 'TAG Heuer'
  ];

  private static readonly VIP_FIRST_NAMES = [
    'Alexander', 'Victoria', 'Maximilian', 'Isabella', 'Wilhelm', 'Catherine',
    'Friedrich', 'Sophia', 'Charles', 'Anastasia', 'Edward', 'Gabrielle',
    'Sebastian', 'Vivienne', 'Theodore', 'Evangeline', 'Reginald', 'Seraphina',
    'Augustus', 'Cordelia', 'Bartholomew', 'Persephone', 'Constantine', 'Arabella'
  ];

  private static readonly VIP_LAST_NAMES = [
    'Habsburg', 'Rothschild', 'Vanderbilt', 'Rockefeller', 'Carnegie', 'Astor',
    'Morgan', 'Windsor', 'Bourbon', 'Romanov', 'Medici', 'Fugger', 'Grimaldi',
    'Liechtenstein', 'Luxembourg', 'Savoy', 'Braganza', 'Wittelsbach'
  ];

  private static readonly REGULAR_FIRST_NAMES = [
    'John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'Robert', 'Jennifer',
    'James', 'Emily', 'William', 'Jessica', 'Thomas', 'Ashley', 'Christopher', 'Amanda'
  ];

  private static readonly REGULAR_LAST_NAMES = [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'
  ];

  private static readonly WATCH_MODELS = {
    'Patek Philippe': [
      { model: 'Nautilus', reference: '5711/1A', price: 150000, rarity: 'ultra-rare' },
      { model: 'Aquanaut', reference: '5167A', price: 65000, rarity: 'rare' },
      { model: 'Calatrava', reference: '5227', price: 45000, rarity: 'common' },
      { model: 'Grand Complications', reference: '5270P', price: 450000, rarity: 'one-of-a-kind' },
    ],
    'Rolex': [
      { model: 'Submariner', reference: '116610LN', price: 18000, rarity: 'common' },
      { model: 'Daytona', reference: '116500LN', price: 35000, rarity: 'rare' },
      { model: 'GMT-Master II', reference: '126710BLNR', price: 25000, rarity: 'rare' },
      { model: 'Day-Date', reference: '228238', price: 45000, rarity: 'common' },
    ],
    'Audemars Piguet': [
      { model: 'Royal Oak', reference: '15202ST', price: 85000, rarity: 'ultra-rare' },
      { model: 'Royal Oak Offshore', reference: '26470ST', price: 55000, rarity: 'rare' },
      { model: 'Millenary', reference: '77247BC', price: 35000, rarity: 'common' },
    ],
    'Richard Mille': [
      { model: 'RM 11-03', reference: 'RM11-03', price: 250000, rarity: 'ultra-rare' },
      { model: 'RM 035', reference: 'RM035', price: 180000, rarity: 'rare' },
      { model: 'RM 030', reference: 'RM030', price: 450000, rarity: 'one-of-a-kind' },
    ]
  };

  private static readonly COUNTRIES = [
    'United States', 'Switzerland', 'United Kingdom', 'Germany', 'France',
    'Monaco', 'Singapore', 'Hong Kong', 'Japan', 'Australia', 'Canada',
    'Austria', 'Belgium', 'Netherlands', 'Italy', 'Spain'
  ];

  /**
   * Generate VIP clients for high-value testing scenarios
   */
  static generateVIPClients(count: number = 50): LuxuryClient[] {
    const clients: LuxuryClient[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = this.getRandomItem(this.VIP_FIRST_NAMES);
      const lastName = this.getRandomItem(this.VIP_LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;

      const vipTiers: ('silver' | 'gold' | 'platinum' | 'diamond')[] =
        ['silver', 'gold', 'platinum', 'diamond'];
      const vipTier = this.getRandomItem(vipTiers);

      // VIP clients have significantly higher purchase history
      const basePurchase = vipTier === 'diamond' ? 2000000 :
                          vipTier === 'platinum' ? 1000000 :
                          vipTier === 'gold' ? 500000 : 250000;

      const purchaseHistory = basePurchase + Math.floor(Math.random() * basePurchase);

      clients.push({
        id: `vip-${i.toString().padStart(3, '0')}`,
        firstName,
        lastName,
        fullName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.generateVIPDomain()}`,
        phone: this.generatePhone(),
        vipStatus: true,
        vipTier,
        purchaseHistory: Math.floor(purchaseHistory / 1000) * 1000, // Round to thousands
        totalSpent: purchaseHistory,
        preferredBrands: this.generateVIPPreferredBrands(),
        preferredCategories: this.generatePreferredCategories(),
        budgetRange: {
          min: 50000,
          max: Math.max(500000, purchaseHistory * 0.5)
        },
        acquisitionDate: this.generatePastDate(365 * 5), // Up to 5 years ago
        lastPurchase: this.generatePastDate(90), // Within last 90 days
        notes: this.generateVIPNotes(),
        communicationPreference: Math.random() > 0.5 ? 'in-person' : 'phone',
        timeZone: this.generateTimeZone(),
        country: this.getRandomItem(this.COUNTRIES),
        language: Math.random() > 0.7 ? 'French' : 'English'
      });
    }

    return clients;
  }

  /**
   * Generate regular clients for standard testing scenarios
   */
  static generateRegularClients(count: number = 200): LuxuryClient[] {
    const clients: LuxuryClient[] = [];

    for (let i = 0; i < count; i++) {
      const firstName = this.getRandomItem(this.REGULAR_FIRST_NAMES);
      const lastName = this.getRandomItem(this.REGULAR_LAST_NAMES);
      const fullName = `${firstName} ${lastName}`;

      const purchaseHistory = Math.floor(Math.random() * 150000) + 5000; // $5K - $155K

      clients.push({
        id: `reg-${i.toString().padStart(3, '0')}`,
        firstName,
        lastName,
        fullName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${this.generateRegularDomain()}`,
        phone: this.generatePhone(),
        vipStatus: false,
        purchaseHistory,
        totalSpent: purchaseHistory,
        preferredBrands: this.generateRegularPreferredBrands(),
        preferredCategories: this.generatePreferredCategories(),
        budgetRange: {
          min: 5000,
          max: Math.min(100000, purchaseHistory * 1.5)
        },
        acquisitionDate: this.generatePastDate(365 * 2), // Up to 2 years ago
        lastPurchase: Math.random() > 0.3 ? this.generatePastDate(180) : undefined,
        notes: this.generateRegularNotes(),
        communicationPreference: this.getRandomItem(['email', 'phone', 'whatsapp']),
        timeZone: this.generateTimeZone(),
        country: this.getRandomItem(this.COUNTRIES),
        language: 'English'
      });
    }

    return clients;
  }

  /**
   * Generate luxury watch inventory for testing
   */
  static generateWatchInventory(count: number = 100): LuxuryWatch[] {
    const watches: LuxuryWatch[] = [];

    for (let i = 0; i < count; i++) {
      const brand = this.getRandomItem(this.LUXURY_BRANDS);
      const models = this.WATCH_MODELS[brand as keyof typeof this.WATCH_MODELS] ||
                    [{ model: 'Classic', reference: 'REF001', price: 25000, rarity: 'common' }];

      const modelData = this.getRandomItem(models);

      const availability = this.getRandomItem([
        'available', 'available', 'available', // Higher chance of available
        'allocated', 'waitlist', 'exclusive'
      ]);

      watches.push({
        id: `watch-${i.toString().padStart(3, '0')}`,
        brand,
        model: modelData.model,
        reference: modelData.reference,
        price: modelData.price,
        availability: availability as any,
        rarity: modelData.rarity as any,
        category: this.getRandomItem(['dress', 'sport', 'complication', 'vintage']),
        materials: this.generateMaterials(),
        complications: this.generateComplications(),
        yearManufactured: this.generateYear()
      });
    }

    return watches;
  }

  /**
   * Generate realistic transaction history
   */
  static generateTransactions(clientCount: number = 100, transactionCount: number = 300): Transaction[] {
    const transactions: Transaction[] = [];

    for (let i = 0; i < transactionCount; i++) {
      const clientId = `${Math.random() > 0.2 ? 'reg' : 'vip'}-${Math.floor(Math.random() * clientCount).toString().padStart(3, '0')}`;
      const isVIP = clientId.startsWith('vip');

      const baseAmount = isVIP ? 100000 : 25000;
      const amount = baseAmount + Math.floor(Math.random() * (isVIP ? 500000 : 75000));

      transactions.push({
        id: `tx-${i.toString().padStart(4, '0')}`,
        clientId,
        watchId: `watch-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`,
        amount,
        date: this.generatePastDate(365),
        status: this.getRandomItem(['completed', 'completed', 'completed', 'pending', 'cancelled']),
        paymentMethod: isVIP ?
          this.getRandomItem(['wire', 'wire', 'crypto', 'check']) :
          this.getRandomItem(['wire', 'credit', 'check']),
        salesPerson: this.generateSalesPerson(),
        commission: amount * (isVIP ? 0.03 : 0.05), // VIP gets lower commission rate
        notes: this.generateTransactionNotes(),
        warranty: true,
        insurance: amount > 50000,
        deliveryMethod: isVIP ?
          this.getRandomItem(['white-glove', 'courier', 'pickup']) :
          this.getRandomItem(['pickup', 'courier'])
      });
    }

    return transactions;
  }

  /**
   * Generate waitlist entries for testing waitlist functionality
   */
  static generateWaitlistEntries(count: number = 75): WaitlistEntry[] {
    const entries: WaitlistEntry[] = [];

    for (let i = 0; i < count; i++) {
      const clientId = `${Math.random() > 0.3 ? 'reg' : 'vip'}-${Math.floor(Math.random() * 100).toString().padStart(3, '0')}`;
      const isVIP = clientId.startsWith('vip');

      const brand = this.getRandomItem(['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Richard Mille']);
      const models = {
        'Rolex': ['Submariner', 'Daytona', 'GMT-Master II'],
        'Patek Philippe': ['Nautilus', 'Aquanaut', 'Grand Complications'],
        'Audemars Piguet': ['Royal Oak', 'Royal Oak Offshore'],
        'Richard Mille': ['RM 11-03', 'RM 035']
      };

      const model = this.getRandomItem(models[brand as keyof typeof models]);

      entries.push({
        id: `wait-${i.toString().padStart(3, '0')}`,
        clientId,
        watchBrand: brand,
        watchModel: model,
        maxBudget: isVIP ?
          Math.floor(Math.random() * 500000) + 100000 :
          Math.floor(Math.random() * 100000) + 20000,
        priority: isVIP ? Math.floor(Math.random() * 10) + 1 : Math.floor(Math.random() * 50) + 11,
        dateAdded: this.generatePastDate(180),
        estimatedWaitTime: Math.floor(Math.random() * 365) + 30,
        notificationPreference: this.getRandomItem(['immediate', 'daily', 'weekly']),
        status: this.getRandomItem(['active', 'active', 'active', 'notified', 'converted']),
        notes: this.generateWaitlistNotes()
      });
    }

    return entries.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate edge case test data
   */
  static generateEdgeCases(): {
    clients: LuxuryClient[];
    watches: LuxuryWatch[];
    transactions: Transaction[];
  } {
    return {
      clients: [
        // Empty name client
        {
          id: 'edge-001',
          firstName: '',
          lastName: '',
          fullName: '',
          email: 'empty@test.com',
          phone: '',
          vipStatus: false,
          purchaseHistory: 0,
          totalSpent: 0,
          preferredBrands: [],
          preferredCategories: [],
          budgetRange: { min: 0, max: 0 },
          acquisitionDate: new Date(),
          notes: [],
          communicationPreference: 'email',
          timeZone: 'UTC',
          country: 'Unknown',
          language: 'English'
        },
        // Special characters client
        {
          id: 'edge-002',
          firstName: 'José María',
          lastName: 'Aznar-López',
          fullName: 'José María Aznar-López',
          email: 'josé.maría@test.com',
          phone: '+34-912-345-678',
          vipStatus: true,
          vipTier: 'gold',
          purchaseHistory: 750000,
          totalSpent: 750000,
          preferredBrands: ['Patek Philippe'],
          preferredCategories: ['dress'],
          budgetRange: { min: 50000, max: 500000 },
          acquisitionDate: new Date(),
          notes: ['Special characters test'],
          communicationPreference: 'phone',
          timeZone: 'Europe/Madrid',
          country: 'Spain',
          language: 'Spanish'
        },
        // Emoji in name client
        {
          id: 'edge-003',
          firstName: 'Wang',
          lastName: '小明 👑',
          fullName: 'Wang 小明 👑',
          email: 'wang.xiaoming@test.com',
          phone: '+86-138-0013-8000',
          vipStatus: true,
          vipTier: 'diamond',
          purchaseHistory: 5000000,
          totalSpent: 5000000,
          preferredBrands: ['Richard Mille', 'Patek Philippe'],
          preferredCategories: ['complication'],
          budgetRange: { min: 100000, max: 2000000 },
          acquisitionDate: new Date(),
          notes: ['Unicode and emoji test'],
          communicationPreference: 'whatsapp',
          timeZone: 'Asia/Shanghai',
          country: 'China',
          language: 'Chinese'
        }
      ],
      watches: [
        // Zero price watch
        {
          id: 'edge-watch-001',
          brand: 'Test Brand',
          model: 'Zero Price',
          reference: 'ZERO-001',
          price: 0,
          availability: 'available',
          rarity: 'common',
          category: 'dress',
          materials: [],
          complications: []
        },
        // Ultra expensive watch
        {
          id: 'edge-watch-002',
          brand: 'Patek Philippe',
          model: 'Henry Graves Supercomplication',
          reference: 'UNIQUE-001',
          price: 25000000,
          availability: 'exclusive',
          rarity: 'one-of-a-kind',
          category: 'complication',
          materials: ['18k Yellow Gold', 'Sapphire Crystal'],
          complications: ['Perpetual Calendar', 'Minute Repeater', 'Moon Phases']
        }
      ],
      transactions: [
        // Zero amount transaction
        {
          id: 'edge-tx-001',
          clientId: 'edge-001',
          watchId: 'edge-watch-001',
          amount: 0,
          date: new Date(),
          status: 'pending',
          paymentMethod: 'cash',
          salesPerson: 'Test Sales',
          commission: 0,
          notes: ['Zero amount test'],
          warranty: false,
          insurance: false,
          deliveryMethod: 'pickup'
        },
        // Ultra high value transaction
        {
          id: 'edge-tx-002',
          clientId: 'edge-003',
          watchId: 'edge-watch-002',
          amount: 25000000,
          date: new Date(),
          status: 'completed',
          paymentMethod: 'wire',
          salesPerson: 'VIP Sales Manager',
          commission: 750000,
          notes: ['Ultra high value transaction', 'Special approval required'],
          warranty: true,
          insurance: true,
          deliveryMethod: 'white-glove'
        }
      ]
    };
  }

  // Helper methods
  private static getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  private static generatePhone(): string {
    const countryCode = this.getRandomItem(['+1', '+41', '+44', '+49', '+33', '+377', '+65']);
    const number = Math.floor(Math.random() * 900000000) + 100000000;
    return `${countryCode}-${number.toString().slice(0, 3)}-${number.toString().slice(3, 6)}-${number.toString().slice(6)}`;
  }

  private static generateVIPDomain(): string {
    return this.getRandomItem([
      'royalfamily.eu', 'wealth.ch', 'luxury.mc', 'private.sg',
      'exclusive.com', 'platinum.net', 'diamond.org'
    ]);
  }

  private static generateRegularDomain(): string {
    return this.getRandomItem([
      'gmail.com', 'email.com', 'yahoo.com', 'outlook.com', 'icloud.com'
    ]);
  }

  private static generateVIPPreferredBrands(): string[] {
    const brands = ['Patek Philippe', 'Audemars Piguet', 'Vacheron Constantin', 'A. Lange & Söhne', 'Richard Mille'];
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 brands
    return this.shuffleArray(brands).slice(0, count);
  }

  private static generateRegularPreferredBrands(): string[] {
    const brands = ['Rolex', 'Omega', 'TAG Heuer', 'Cartier', 'IWC', 'Panerai'];
    const count = Math.floor(Math.random() * 2) + 1; // 1-2 brands
    return this.shuffleArray(brands).slice(0, count);
  }

  private static generatePreferredCategories(): string[] {
    const categories = ['dress', 'sport', 'complication', 'vintage'];
    const count = Math.floor(Math.random() * 2) + 1; // 1-2 categories
    return this.shuffleArray(categories).slice(0, count);
  }

  private static generateVIPNotes(): string[] {
    return this.getRandomItem([
      ['Prefers private showings', 'High-value collector', 'Immediate payment capability'],
      ['Exclusive pieces only', 'Annual buyer', 'Platinum service level'],
      ['Investment focused', 'Rare complications preferred', 'White glove delivery only'],
      ['Legacy collector', 'Multiple residence delivery', 'Discretion required']
    ]);
  }

  private static generateRegularNotes(): string[] {
    return this.getRandomItem([
      ['First-time luxury buyer', 'Price sensitive'],
      ['Anniversary gift shopping', 'Needs payment plan'],
      ['Young professional', 'Modern styles preferred'],
      ['Gift purchaser', 'Delivery to office preferred']
    ]);
  }

  private static generateTransactionNotes(): string[] {
    return this.getRandomItem([
      ['Smooth transaction', 'Customer very satisfied'],
      ['Special delivery requested', 'Insurance arranged'],
      ['Payment received in full', 'Warranty activated'],
      ['VIP white glove service', 'Additional complications explained']
    ]);
  }

  private static generateWaitlistNotes(): string[] {
    return this.getRandomItem([
      ['Specific model request', 'Flexible on delivery'],
      ['Birthday gift', 'Delivery date important'],
      ['Investment purchase', 'Market timing relevant'],
      ['Collection completion', 'Specific year preferred']
    ]);
  }

  private static generateMaterials(): string[] {
    const materials = ['Stainless Steel', '18k Gold', 'Platinum', 'Titanium', 'Ceramic', 'Carbon Fiber'];
    const count = Math.floor(Math.random() * 2) + 1;
    return this.shuffleArray(materials).slice(0, count);
  }

  private static generateComplications(): string[] {
    const complications = ['Date', 'Chronograph', 'GMT', 'Moon Phase', 'Power Reserve', 'Minute Repeater'];
    const count = Math.floor(Math.random() * 3);
    return this.shuffleArray(complications).slice(0, count);
  }

  private static generateYear(): number {
    return 2020 + Math.floor(Math.random() * 5); // 2020-2024
  }

  private static generatePastDate(maxDaysAgo: number): Date {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  private static generateSalesPerson(): string {
    return this.getRandomItem([
      'Marcus Sterling', 'Sophia Chen', 'James Wellington', 'Isabella Rodriguez',
      'Alexander Price', 'Victoria Laurent', 'Maximilian Beck', 'Gabrielle Martin'
    ]);
  }

  private static generateTimeZone(): string {
    return this.getRandomItem([
      'America/New_York', 'Europe/Zurich', 'Europe/London', 'Asia/Singapore',
      'Asia/Hong_Kong', 'America/Los_Angeles', 'Europe/Paris', 'Asia/Tokyo'
    ]);
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Generate complete test dataset for comprehensive testing
   */
  static generateCompleteTestDataset(): {
    vipClients: LuxuryClient[];
    regularClients: LuxuryClient[];
    watches: LuxuryWatch[];
    transactions: Transaction[];
    waitlist: WaitlistEntry[];
    edgeCases: {
      clients: LuxuryClient[];
      watches: LuxuryWatch[];
      transactions: Transaction[];
    };
  } {
    return {
      vipClients: this.generateVIPClients(50),
      regularClients: this.generateRegularClients(200),
      watches: this.generateWatchInventory(100),
      transactions: this.generateTransactions(250, 300),
      waitlist: this.generateWaitlistEntries(75),
      edgeCases: this.generateEdgeCases()
    };
  }

  /**
   * Generate performance testing dataset (large scale)
   */
  static generatePerformanceTestDataset(): {
    clients: LuxuryClient[];
    watches: LuxuryWatch[];
    transactions: Transaction[];
  } {
    return {
      clients: [
        ...this.generateVIPClients(500),
        ...this.generateRegularClients(9500)
      ],
      watches: this.generateWatchInventory(2000),
      transactions: this.generateTransactions(10000, 50000)
    };
  }
}
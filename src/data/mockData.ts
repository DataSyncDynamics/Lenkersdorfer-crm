import { Client, WatchModel, WaitlistEntry, TierDefinition, WatchRarityDefinition, ClientTier, WatchTier } from '@/types'

// Client tier definitions based on actual spend thresholds and purchase behavior
export const clientTierDefinitions: TierDefinition[] = [
  { tier: 1, name: 'Ultra-High Net Worth', description: '$250K+ lifetime, $50K+ avg orders', minPercentile: 0, maxPercentile: 0, color: 'bg-purple-100 text-purple-800' },
  { tier: 2, name: 'High Net Worth', description: '$100K+ lifetime, $25K+ avg orders', minPercentile: 0, maxPercentile: 0, color: 'bg-yellow-100 text-yellow-800' },
  { tier: 3, name: 'Established Collectors', description: '$50K+ lifetime, $15K+ avg orders', minPercentile: 0, maxPercentile: 0, color: 'bg-gray-100 text-gray-800' },
  { tier: 4, name: 'Growing Enthusiasts', description: '$20K+ lifetime, $8K+ avg orders', minPercentile: 0, maxPercentile: 0, color: 'bg-orange-100 text-orange-800' },
  { tier: 5, name: 'Entry Level', description: 'Under $20K lifetime spend', minPercentile: 0, maxPercentile: 0, color: 'bg-blue-100 text-blue-800' }
]

// Watch rarity definitions based on Genesis Diamonds data
export const watchRarityDefinitions: WatchRarityDefinition[] = [
  {
    tier: 1,
    name: 'Nearly Impossible',
    description: 'Legendary pieces with extreme rarity',
    examples: ['Daytona Platinum', 'GMT Sprite', 'Submariner Hulk'],
    color: 'bg-red-100 text-red-800'
  },
  {
    tier: 2,
    name: 'Extremely Hard',
    description: 'Highly sought after, minimal availability',
    examples: ['Submariner 126610LN', 'Sky-Dweller Steel', 'GMT Batman'],
    color: 'bg-orange-100 text-orange-800'
  },
  {
    tier: 3,
    name: 'Very Difficult',
    description: 'Popular models with long waitlists',
    examples: ['Datejust 36mm', 'Explorer 124270', 'OP 41mm'],
    color: 'bg-yellow-100 text-yellow-800'
  },
  {
    tier: 4,
    name: 'Moderate',
    description: 'Available with patience',
    examples: ['Yacht-Master 40', 'Sea-Dweller', 'Milgauss'],
    color: 'bg-green-100 text-green-800'
  },
  {
    tier: 5,
    name: 'Available',
    description: 'Generally obtainable',
    examples: ['Air-King', 'Cellini', 'Lady-Datejust'],
    color: 'bg-blue-100 text-blue-800'
  }
]

// Function to calculate client tier based on actual spend thresholds and purchase behavior
export const calculateClientTier = (lifetimeSpend: number, purchases: any[] = []): ClientTier => {
  // Calculate average order value if purchases exist
  const avgOrderValue = purchases.length > 0
    ? purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length
    : lifetimeSpend

  // Tier 1: Ultra-High Net Worth ($250K+ lifetime, $50K+ avg orders)
  // These clients buy Platinum Daytonas, Nautilus, etc.
  if (lifetimeSpend >= 250000 && avgOrderValue >= 50000) return 1

  // Tier 2: High Net Worth ($100K+ lifetime, $25K+ avg orders)
  // Steel Daytonas, GMT Masters, high-end pieces
  if (lifetimeSpend >= 100000 && avgOrderValue >= 25000) return 2

  // Tier 3: Established Collectors ($50K+ lifetime, $15K+ avg orders)
  // Submariner, popular steel sports models
  if (lifetimeSpend >= 50000 && avgOrderValue >= 15000) return 3

  // Tier 4: Growing Enthusiasts ($20K+ lifetime, $8K+ avg orders)
  // Entry luxury, Tudor, mid-tier pieces
  if (lifetimeSpend >= 20000 && avgOrderValue >= 8000) return 4

  // Tier 5: New/Entry Level (Under $20K lifetime)
  // Entry-level luxury, build relationship first
  return 5
}

export const mockClients: Client[] = [
  // Ultra-High Net Worth Tier 1 Client
  {
    id: 'client_richard_blackstone',
    name: 'RICHARD BLACKSTONE',
    email: 'richard.blackstone@example.com',
    phone: '(555) 999-0001',
    lifetimeSpend: 487500,
    vipTier: 'Platinum',
    clientTier: 1, // Ultra-High Net Worth - $487K lifetime, $97.5K avg orders
    spendPercentile: 98,
    lastPurchase: '2024-08-15',
    lastContactDate: '2024-08-15',
    preferredBrands: ['PATEK PHILIPPE', 'ROLEX', 'AUDEMARS PIGUET'],
    notes: 'Ultra-high net worth collector. Qualified for any Tier 1 allocation including Platinum Daytona.',
    joinDate: '2022-01-05',
    purchases: [
      {
        id: 'purchase_rb_001',
        watchModel: 'NAUTILUS 5711/1A',
        brand: 'PATEK PHILIPPE',
        price: 185000,
        date: '2024-08-15',
        serialNumber: 'RB001'
      },
      {
        id: 'purchase_rb_002',
        watchModel: 'DAYTONA M116500LN STEEL',
        brand: 'ROLEX',
        price: 85000,
        date: '2024-02-10',
        serialNumber: 'RB002'
      },
      {
        id: 'purchase_rb_003',
        watchModel: 'ROYAL OAK 15500ST',
        brand: 'AUDEMARS PIGUET',
        price: 67500,
        date: '2023-11-20',
        serialNumber: 'RB003'
      },
      {
        id: 'purchase_rb_004',
        watchModel: 'GMT-MASTER II M126710BLNR',
        brand: 'ROLEX',
        price: 65000,
        date: '2023-07-30',
        serialNumber: 'RB004'
      },
      {
        id: 'purchase_rb_005',
        watchModel: 'SUBMARINER M126610LN',
        brand: 'ROLEX',
        price: 85000,
        date: '2023-03-12',
        serialNumber: 'RB005'
      }
    ]
  },
  // High Net Worth Tier 2 Client
  {
    id: 'client_jennifer_chen',
    name: 'JENNIFER CHEN',
    email: 'jennifer.chen@example.com',
    phone: '(555) 888-0002',
    lifetimeSpend: 142000,
    vipTier: 'Gold',
    clientTier: 2, // High Net Worth - $142K lifetime, $35.5K avg orders
    spendPercentile: 92,
    lastPurchase: '2024-07-22',
    lastContactDate: '2024-07-22',
    preferredBrands: ['ROLEX', 'CARTIER'],
    notes: 'High net worth professional. Qualified for steel Daytona and GMT allocations.',
    joinDate: '2022-08-15',
    purchases: [
      {
        id: 'purchase_jc_001',
        watchModel: 'DAYTONA M116500LN STEEL',
        brand: 'ROLEX',
        price: 45000,
        date: '2024-07-22',
        serialNumber: 'JC001'
      },
      {
        id: 'purchase_jc_002',
        watchModel: 'GMT-MASTER II M126710BLNR',
        brand: 'ROLEX',
        price: 38000,
        date: '2024-01-15',
        serialNumber: 'JC002'
      },
      {
        id: 'purchase_jc_003',
        watchModel: 'SANTOS DE CARTIER LARGE',
        brand: 'CARTIER',
        price: 32000,
        date: '2023-09-10',
        serialNumber: 'JC003'
      },
      {
        id: 'purchase_jc_004',
        watchModel: 'SUBMARINER M126610LN',
        brand: 'ROLEX',
        price: 27000,
        date: '2023-03-20',
        serialNumber: 'JC004'
      }
    ]
  },
  {
    id: 'client_michael_sykes',
    name: 'MICHAEL SYKES',
    email: 'michael.sykes@example.com',
    phone: '(555) 123-4567',
    lifetimeSpend: 11236,
    vipTier: 'Bronze',
    clientTier: 5, // Entry Level - $11K lifetime, $5.5K avg orders
    spendPercentile: 95,
    lastPurchase: '2024-03-15',
    lastContactDate: '2024-03-15',
    preferredBrands: ['ROLEX', 'OMEGA'],
    notes: 'Entry level luxury client. Building relationship with mid-range purchases.',
    joinDate: '2023-01-15',
    purchases: [
      {
        id: 'purchase_ms_001',
        watchModel: 'SUBMARINER M126610LN',
        brand: 'ROLEX',
        price: 8500,
        date: '2024-03-15',
        serialNumber: 'MS001'
      },
      {
        id: 'purchase_ms_002',
        watchModel: 'SEAMASTER DIVER',
        brand: 'OMEGA',
        price: 2736,
        date: '2024-01-20',
        serialNumber: 'MS002'
      }
    ]
  },
  {
    id: 'client_tanan_yesunmunkh',
    name: 'TANAN YESUNMUNKH',
    email: 'tanan.yesunmunkh@example.com',
    phone: '(555) 234-5678',
    lifetimeSpend: 10500,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 - Entry Level ($10.5K lifetime, $5.25K avg)
    spendPercentile: 92,
    lastPurchase: '2024-02-28',
    lastContactDate: '2024-02-28',
    preferredBrands: ['CARTIER', 'OMEGA'],
    notes: 'Entry level luxury client building watch collection. Focus on $5K-8K range.',
    joinDate: '2023-03-10',
    purchases: [
      {
        id: 'purchase_ty_001',
        watchModel: 'SANTOS DE CARTIER',
        brand: 'CARTIER',
        price: 7200,
        date: '2024-02-28',
        serialNumber: 'TY001'
      },
      {
        id: 'purchase_ty_002',
        watchModel: 'SPEEDMASTER',
        brand: 'OMEGA',
        price: 3300,
        date: '2023-11-15',
        serialNumber: 'TY002'
      }
    ]
  },
  {
    id: 'client_gregory_padra',
    name: 'GREGORY PADRA',
    email: 'gregory.padra@example.com',
    phone: '(555) 345-6789',
    lifetimeSpend: 11024,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 - Entry Level ($11K lifetime, $5.5K avg)
    spendPercentile: 94,
    lastPurchase: '2024-04-10',
    lastContactDate: '2024-04-10',
    preferredBrands: ['ROLEX', 'PATEK PHILIPPE'],
    notes: 'Entry level collector with appreciation for movements. Build with $8K-12K pieces first.',
    joinDate: '2022-12-05',
    purchases: [
      {
        id: 'purchase_gp_001',
        watchModel: 'DAYTONA M116500LN',
        brand: 'ROLEX',
        price: 8524,
        date: '2024-04-10',
        serialNumber: 'GP001'
      },
      {
        id: 'purchase_gp_002',
        watchModel: 'CALATRAVA',
        brand: 'PATEK PHILIPPE',
        price: 2500,
        date: '2023-08-22',
        serialNumber: 'GP002'
      }
    ]
  },
  {
    id: 'client_werner_krauss',
    name: 'Werner KRAUSS',
    email: 'werner.krauss@example.com',
    phone: '(555) 456-7890',
    lifetimeSpend: 11024,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 - Entry Level ($11K lifetime, $5.5K avg)
    spendPercentile: 93,
    lastPurchase: '2024-01-25',
    lastContactDate: '2024-01-25',
    preferredBrands: ['OMEGA', 'BREITLING'],
    notes: 'Entry level precision enthusiast. Focus on quality $8K-12K pieces.',
    joinDate: '2023-02-18',
    purchases: [
      {
        id: 'purchase_wk_001',
        watchModel: 'SEAMASTER PLANET OCEAN',
        brand: 'OMEGA',
        price: 6500,
        date: '2024-01-25',
        serialNumber: 'WK001'
      },
      {
        id: 'purchase_wk_002',
        watchModel: 'NAVITIMER',
        brand: 'BREITLING',
        price: 4524,
        date: '2023-09-12',
        serialNumber: 'WK002'
      }
    ]
  },
  {
    id: 'client_jason_jorgensen',
    name: 'JASON JORGENSEN',
    email: 'jason.jorgensen@example.com',
    phone: '(555) 567-8901',
    lifetimeSpend: 10918,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 - Entry Level ($11K lifetime, $5.5K avg)
    spendPercentile: 88,
    lastPurchase: '2024-05-08',
    lastContactDate: '2024-05-08',
    preferredBrands: ['ROLEX', 'TAG HEUER'],
    notes: 'Entry level sports enthusiast. Build with Tudor Black Bay range first.',
    joinDate: '2023-04-22',
    purchases: [
      {
        id: 'purchase_jj_001',
        watchModel: 'GMT-MASTER II M126710BLNR',
        brand: 'ROLEX',
        price: 8200,
        date: '2024-05-08',
        serialNumber: 'JJ001'
      },
      {
        id: 'purchase_jj_002',
        watchModel: 'CARRERA CHRONOGRAPH',
        brand: 'TAG HEUER',
        price: 2718,
        date: '2023-12-03',
        serialNumber: 'JJ002'
      }
    ]
  },
  {
    id: 'client_brian_beaulieu',
    name: 'Brian Beaulieu',
    email: 'brian.beaulieu@example.com',
    phone: '(555) 678-9012',
    lifetimeSpend: 10653,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 - Entry Level ($10.7K lifetime, $5.3K avg)
    spendPercentile: 85,
    lastPurchase: '2024-03-22',
    lastContactDate: '2024-03-22',
    preferredBrands: ['OMEGA', 'IWC'],
    notes: 'Entry level professional building investment portfolio. $8K-12K sweet spot.',
    joinDate: '2023-01-08',
    purchases: [
      {
        id: 'purchase_bb_001',
        watchModel: 'SPEEDMASTER MOONWATCH',
        brand: 'OMEGA',
        price: 6800,
        date: '2024-03-22',
        serialNumber: 'BB001'
      },
      {
        id: 'purchase_bb_002',
        watchModel: 'PILOT CHRONOGRAPH',
        brand: 'IWC',
        price: 3853,
        date: '2023-10-15',
        serialNumber: 'BB002'
      }
    ]
  },
  {
    id: 'client_robert_chen',
    name: 'Robert Chen',
    email: 'robert.chen@example.com',
    phone: '(555) 789-0123',
    lifetimeSpend: 9245,
    vipTier: 'Bronze',
    clientTier: 3, // Tier 3 based on spend
    spendPercentile: 75,
    lastPurchase: '2024-06-14',
    lastContactDate: '2024-06-14',
    preferredBrands: ['ROLEX', 'ZENITH'],
    notes: 'Collector focusing on vintage and modern classics. Excellent payment history.',
    joinDate: '2022-11-20',
    purchases: [
      {
        id: 'purchase_rc_001',
        watchModel: 'DATEJUST M126334',
        brand: 'ROLEX',
        price: 5500,
        date: '2024-06-14',
        serialNumber: 'RC001'
      },
      {
        id: 'purchase_rc_002',
        watchModel: 'EL PRIMERO',
        brand: 'ZENITH',
        price: 3745,
        date: '2023-07-08',
        serialNumber: 'RC002'
      }
    ]
  },
  {
    id: 'client_david_martinez',
    name: 'David Martinez',
    email: 'david.martinez@example.com',
    phone: '(555) 890-1234',
    lifetimeSpend: 8120,
    vipTier: 'Bronze',
    clientTier: 4, // Tier 4 based on spend
    spendPercentile: 65,
    lastPurchase: '2024-07-18',
    lastContactDate: '2024-07-18',
    preferredBrands: ['TUDOR', 'SEIKO'],
    notes: 'Entry-level collector building watch knowledge. Good growth potential.',
    joinDate: '2024-02-14',
    purchases: [
      {
        id: 'purchase_dm_001',
        watchModel: 'BLACK BAY GMT',
        brand: 'TUDOR',
        price: 4500,
        date: '2024-07-18',
        serialNumber: 'DM001'
      },
      {
        id: 'purchase_dm_002',
        watchModel: 'PROSPEX DIVER',
        brand: 'SEIKO',
        price: 3620,
        date: '2024-04-05',
        serialNumber: 'DM002'
      }
    ]
  },
  {
    id: 'client_sarah_thompson',
    name: 'Sarah Thompson',
    email: 'sarah.thompson@example.com',
    phone: '(555) 901-2345',
    lifetimeSpend: 6850,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 based on lower spend
    spendPercentile: 45,
    lastPurchase: '2024-08-30',
    lastContactDate: '2024-08-30',
    preferredBrands: ['CARTIER', 'CHANEL'],
    notes: 'Fashion industry professional with preference for elegant luxury pieces.',
    joinDate: '2023-06-12',
    purchases: [
      {
        id: 'purchase_st_001',
        watchModel: 'TANK SOLO',
        brand: 'CARTIER',
        price: 4200,
        date: '2024-08-30',
        serialNumber: 'ST001'
      },
      {
        id: 'purchase_st_002',
        watchModel: 'J12 CERAMIC',
        brand: 'CHANEL',
        price: 2650,
        date: '2023-11-28',
        serialNumber: 'ST002'
      }
    ]
  },
  {
    id: 'client_mark_williams',
    name: 'Mark Williams',
    email: 'mark.williams@example.com',
    phone: '(555) 012-3456',
    lifetimeSpend: 5420,
    vipTier: 'Bronze',
    clientTier: 5, // Tier 5 based on lower spend
    spendPercentile: 35,
    lastPurchase: '2024-06-20',
    lastContactDate: '2024-06-20',
    preferredBrands: ['TUDOR', 'OMEGA'],
    notes: 'First-time luxury buyer from Lenkersdorfer. Tech entrepreneur with growing interest.',
    joinDate: '2024-01-10',
    purchases: [
      {
        id: 'purchase_mw_001',
        watchModel: 'BLACK BAY 58',
        brand: 'TUDOR',
        price: 3200,
        date: '2024-06-20',
        serialNumber: 'MW001'
      },
      {
        id: 'purchase_mw_002',
        watchModel: 'SEAMASTER AQUA TERRA',
        brand: 'OMEGA',
        price: 2220,
        date: '2024-03-12',
        serialNumber: 'MW002'
      }
    ]
  }
]

export const mockWatchModels: WatchModel[] = [
  // Tier 1: Nearly Impossible
  {
    id: 'w1',
    brand: 'Rolex',
    model: 'Daytona',
    collection: '126500LN Panda',
    price: 35000,
    availability: 'Waitlist',
    watchTier: 1,
    rarityDescription: 'Nearly Impossible - Daytona Panda, ultimate grail piece',
    description: 'White dial Daytona with black bezel, the most coveted steel sports Rolex'
  },
  {
    id: 'w2',
    brand: 'Rolex',
    model: 'GMT-Master II',
    collection: '126720VTNR Sprite',
    price: 21000,
    availability: 'Waitlist',
    watchTier: 1,
    rarityDescription: 'Nearly Impossible - Left-handed GMT Sprite',
    description: 'Left-handed GMT with green and black bezel, extremely rare'
  },
  {
    id: 'w3',
    brand: 'Rolex',
    model: 'Submariner',
    collection: '116610LV Hulk',
    price: 28000,
    availability: 'Waitlist',
    watchTier: 1,
    rarityDescription: 'Nearly Impossible - Discontinued Hulk, legendary status',
    description: 'Discontinued green Submariner, achieving legendary status'
  },

  // Tier 2: Extremely Hard
  {
    id: 'w4',
    brand: 'Rolex',
    model: 'Submariner',
    collection: '126610LN',
    price: 18500,
    availability: 'Waitlist',
    watchTier: 2,
    rarityDescription: 'Extremely Hard - Steel Submariner, high demand',
    description: 'Black dial steel Submariner, ceramic bezel'
  },
  {
    id: 'w5',
    brand: 'Rolex',
    model: 'Sky-Dweller',
    collection: '326934 Steel',
    price: 22500,
    availability: 'Waitlist',
    watchTier: 2,
    rarityDescription: 'Extremely Hard - Complicated steel sports watch',
    description: 'Steel Sky-Dweller with blue dial, annual calendar'
  },
  {
    id: 'w6',
    brand: 'Rolex',
    model: 'GMT-Master II',
    collection: '126710BLNR Batman',
    price: 19500,
    availability: 'Waitlist',
    watchTier: 2,
    rarityDescription: 'Extremely Hard - Batman GMT with Jubilee bracelet',
    description: 'Black and blue bezel GMT on Jubilee bracelet'
  },

  // Tier 3: Very Difficult
  {
    id: 'w7',
    brand: 'Rolex',
    model: 'Datejust',
    collection: '126234 36mm',
    price: 12500,
    availability: 'Waitlist',
    watchTier: 3,
    rarityDescription: 'Very Difficult - Classic dress watch',
    description: 'Steel and white gold Datejust with blue dial'
  },
  {
    id: 'w8',
    brand: 'Rolex',
    model: 'Explorer',
    collection: '124270',
    price: 9500,
    availability: 'Waitlist',
    watchTier: 3,
    rarityDescription: 'Very Difficult - Tool watch excellence',
    description: '36mm Explorer, classic black dial tool watch'
  },
  {
    id: 'w9',
    brand: 'Rolex',
    model: 'Oyster Perpetual',
    collection: '124300 41mm',
    price: 8500,
    availability: 'Waitlist',
    watchTier: 3,
    rarityDescription: 'Very Difficult - Entry-level steel sports',
    description: '41mm OP with bright blue dial'
  },

  // Tier 4: Moderate
  {
    id: 'w10',
    brand: 'Rolex',
    model: 'Yacht-Master',
    collection: '126622 40mm',
    price: 14500,
    availability: 'Available',
    watchTier: 4,
    rarityDescription: 'Moderate - Luxury sports watch',
    description: 'Steel and platinum Yacht-Master with rhodium dial'
  },
  {
    id: 'w11',
    brand: 'Rolex',
    model: 'Sea-Dweller',
    collection: '126600',
    price: 13500,
    availability: 'Available',
    watchTier: 4,
    rarityDescription: 'Moderate - Professional diving watch',
    description: 'Sea-Dweller with red lettering, 1220m water resistance'
  },
  {
    id: 'w12',
    brand: 'Rolex',
    model: 'Milgauss',
    collection: '116400GV',
    price: 10500,
    availability: 'Available',
    watchTier: 4,
    rarityDescription: 'Moderate - Anti-magnetic scientific watch',
    description: 'Green sapphire crystal Milgauss, orange lightning bolt'
  },

  // Tier 5: Available
  {
    id: 'w13',
    brand: 'Rolex',
    model: 'Air-King',
    collection: '126900',
    price: 12000,
    availability: 'Available',
    watchTier: 5,
    rarityDescription: 'Available - Entry-level Rolex',
    description: 'Air-King with black dial and colorful markers'
  },
  {
    id: 'w14',
    brand: 'Rolex',
    model: 'Cellini',
    collection: '50519 Moonphase',
    price: 32500,
    availability: 'Available',
    watchTier: 5,
    rarityDescription: 'Available - Dress watch collection',
    description: 'White gold Cellini with moonphase complication'
  },
  {
    id: 'w15',
    brand: 'Rolex',
    model: 'Lady-Datejust',
    collection: '279174 28mm',
    price: 8500,
    availability: 'Available',
    watchTier: 5,
    rarityDescription: 'Available - Ladies luxury watch',
    description: 'Steel and white gold Lady-Datejust with silver dial'
  },

  // Non-Rolex prestigious pieces for comparison
  {
    id: 'w16',
    brand: 'Patek Philippe',
    model: 'Nautilus',
    collection: '5711/1A',
    price: 85000,
    availability: 'Waitlist',
    watchTier: 1,
    rarityDescription: 'Nearly Impossible - Holy grail steel sports watch',
    description: 'Discontinued steel Nautilus, ultimate luxury sports watch'
  },
  {
    id: 'w17',
    brand: 'Audemars Piguet',
    model: 'Royal Oak',
    collection: '15500ST',
    price: 55000,
    availability: 'Waitlist',
    watchTier: 2,
    rarityDescription: 'Extremely Hard - Iconic octagonal sports watch',
    description: 'Steel Royal Oak with blue tapisserie dial'
  }
]

export const mockWaitlist: WaitlistEntry[] = [
  // PERFECT MATCHES - Realistic client-to-watch alignments
  {
    id: 'wl1',
    clientId: 'client_richard_blackstone', // RICHARD BLACKSTONE (Tier 1, $487K lifetime) wants Platinum Daytona ($35K)
    watchModelId: 'w1',
    dateAdded: '2024-05-15',
    priority: 1,
    notes: 'PERFECT MATCH - Ultra-high net worth collector ($487K lifetime) for $35K Daytona. Avg order $97K.'
  },
  {
    id: 'wl2',
    clientId: 'client_jennifer_chen', // JENNIFER CHEN (Tier 2, $142K lifetime) wants Steel Submariner ($18.5K)
    watchModelId: 'w4',
    dateAdded: '2024-06-01',
    priority: 1,
    notes: 'PERFECT MATCH - High net worth client ($142K lifetime) for $18.5K Submariner. Avg order $35.5K.'
  },
  {
    id: 'wl3',
    clientId: 'client_robert_chen', // Robert Chen (Tier 3, $9K lifetime) wants Datejust ($12.5K)
    watchModelId: 'w7',
    dateAdded: '2024-08-05',
    priority: 1,
    notes: 'STRETCH PURCHASE - Client capacity $4.6K avg, watch $12.5K. Build relationship first.'
  },

  // REALISTIC ENTRY-LEVEL MATCHES
  {
    id: 'wl4',
    clientId: 'client_tanan_yesunmunkh', // TANAN YESUNMUNKH ($10.5K lifetime) wants Air-King ($12K)
    watchModelId: 'w13',
    dateAdded: '2024-08-20',
    priority: 2,
    notes: 'STRETCH PURCHASE - Client avg $5.25K, watch $12K. Discuss financing options.'
  },
  {
    id: 'wl5',
    clientId: 'client_brian_beaulieu', // Brian Beaulieu ($10.7K lifetime) wants Explorer ($9.5K)
    watchModelId: 'w8',
    dateAdded: '2024-09-01',
    priority: 1,
    notes: 'PERFECT MATCH - Client avg $5.3K, watch $9.5K. Within comfort zone.'
  },
  {
    id: 'wl6',
    clientId: 'client_david_martinez', // David Martinez ($8.1K lifetime) wants Lady-Datejust ($8.5K)
    watchModelId: 'w15',
    dateAdded: '2024-09-05',
    priority: 1,
    notes: 'PERFECT MATCH - Client avg $4K, watch $8.5K. Reasonable stretch.'
  },

  // REALISTIC HIGH-VALUE MATCHES
  {
    id: 'wl7',
    clientId: 'client_richard_blackstone', // RICHARD BLACKSTONE also wants Nautilus ($85K)
    watchModelId: 'w16',
    dateAdded: '2024-07-10',
    priority: 1,
    notes: 'PERFECT MATCH - Ultra-high net worth client for $85K Nautilus. Well within capacity.'
  },
  {
    id: 'wl8',
    clientId: 'client_jennifer_chen', // JENNIFER CHEN wants GMT Batman ($19.5K)
    watchModelId: 'w6',
    dateAdded: '2024-08-15',
    priority: 1,
    notes: 'PERFECT MATCH - High net worth client for $19.5K GMT. Perfect fit for spending pattern.'
  },

  // APPROPRIATE UPGRADE OPPORTUNITIES
  {
    id: 'wl9',
    clientId: 'client_mark_williams', // Mark Williams ($5.4K lifetime) wants Milgauss ($10.5K)
    watchModelId: 'w12',
    dateAdded: '2024-09-10',
    priority: 2,
    notes: 'STRETCH PURCHASE - Entry client ($5.4K lifetime) for $10.5K Milgauss. Build relationship first.'
  },
  {
    id: 'wl10',
    clientId: 'client_sarah_thompson', // Sarah Thompson ($6.9K lifetime) wants Lady-Datejust ($8.5K)
    watchModelId: 'w15',
    dateAdded: '2024-08-25',
    priority: 2,
    notes: 'STRETCH PURCHASE - Fashion professional, watch aligns with style preference.'
  }
]
import { Client, WatchModel, WaitlistEntry } from '@/types'

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Alexander von Habsburg',
    email: 'alexander@habsburggroup.com',
    phone: '+49 89 1234567',
    lifetimeSpend: 533500,
    vipTier: 'Platinum',
    lastPurchase: '2024-08-15',
    preferredBrands: ['Patek Philippe', 'A. Lange & Söhne', 'Vacheron Constantin'],
    notes: 'Prefers complications, collects vintage pieces',
    joinDate: '2021-03-12',
    purchases: [
      {
        id: 'p1',
        watchModel: 'Nautilus 5711/1A',
        brand: 'Patek Philippe',
        price: 159500,
        date: '2024-08-15',
        serialNumber: 'PP5711001'
      },
      {
        id: 'p2',
        watchModel: 'Lange 1',
        brand: 'A. Lange & Söhne',
        price: 63800,
        date: '2024-05-20',
        serialNumber: 'ALS1001'
      }
    ]
  },
  {
    id: '2',
    name: 'Sophie Müller-Bernstein',
    email: 'sophie@bernsteinlaw.de',
    phone: '+49 30 9876543',
    lifetimeSpend: 352000,
    vipTier: 'Gold',
    lastPurchase: '2024-09-01',
    preferredBrands: ['Rolex', 'Cartier', 'Jaeger-LeCoultre'],
    notes: 'Investment focused, prefers steel sports models',
    joinDate: '2022-01-08',
    purchases: [
      {
        id: 'p3',
        watchModel: 'Submariner 126610LN',
        brand: 'Rolex',
        price: 104500,
        date: '2024-09-01',
        serialNumber: 'RLX126001'
      }
    ]
  },
  {
    id: '3',
    name: 'Dr. Marcus Zimmermann',
    email: 'marcus@zimmermannmedia.com',
    phone: '+49 40 5555666',
    lifetimeSpend: 198000,
    vipTier: 'Silver',
    lastPurchase: '2024-07-10',
    preferredBrands: ['Omega', 'Tudor', 'Grand Seiko'],
    notes: 'Tech executive, appreciates innovation',
    joinDate: '2023-05-15',
    purchases: [
      {
        id: 'p4',
        watchModel: 'Speedmaster Professional',
        brand: 'Omega',
        price: 30800,
        date: '2024-07-10',
        serialNumber: 'OMG311001'
      }
    ]
  },
  {
    id: '4',
    name: 'Isabella Rossi',
    email: 'isabella@rossigroup.it',
    phone: '+39 02 1234567',
    lifetimeSpend: 825000,
    vipTier: 'Platinum',
    lastPurchase: '2024-09-10',
    preferredBrands: ['Richard Mille', 'Audemars Piguet', 'F.P. Journe'],
    notes: 'Fashion industry executive, bold pieces',
    joinDate: '2020-11-22',
    purchases: [
      {
        id: 'p5',
        watchModel: 'RM 67-02',
        brand: 'Richard Mille',
        price: 467500,
        date: '2024-09-10',
        serialNumber: 'RM67001'
      }
    ]
  },
  {
    id: '5',
    name: 'James Wellington III',
    email: 'james@wellingtonassets.co.uk',
    phone: '+44 20 7123456',
    lifetimeSpend: 1012000,
    vipTier: 'Platinum',
    lastPurchase: '2024-08-30',
    preferredBrands: ['Patek Philippe', 'Rolex', 'Breguet'],
    notes: 'Investment banker, classic tastes',
    joinDate: '2019-02-14',
    purchases: [
      {
        id: 'p6',
        watchModel: 'Daytona 116500LN',
        brand: 'Rolex',
        price: 181500,
        date: '2024-08-30',
        serialNumber: 'RLX116001'
      }
    ]
  }
]

export const mockWatchModels: WatchModel[] = [
  {
    id: 'w1',
    brand: 'Rolex',
    model: 'Submariner',
    collection: '126610LN',
    price: 104500,
    availability: 'Waitlist',
    description: 'Iconic diving watch with ceramic bezel'
  },
  {
    id: 'w2',
    brand: 'Patek Philippe',
    model: 'Nautilus',
    collection: '5711/1A',
    price: 159500,
    availability: 'Waitlist',
    description: 'Legendary sports watch, discontinued model'
  },
  {
    id: 'w3',
    brand: 'Audemars Piguet',
    model: 'Royal Oak',
    collection: '15500ST',
    price: 137500,
    availability: 'Available',
    description: 'Iconic octagonal sports watch'
  },
  {
    id: 'w4',
    brand: 'Richard Mille',
    model: 'RM 035',
    collection: 'Rafael Nadal',
    price: 533500,
    availability: 'Waitlist',
    description: 'Ultra-light tourbillon for athletes'
  }
]

export const mockWaitlist: WaitlistEntry[] = [
  {
    id: 'wl1',
    clientId: '2',
    watchModelId: 'w1',
    dateAdded: '2024-06-15',
    priority: 1,
    notes: 'Prefers black dial'
  },
  {
    id: 'wl2',
    clientId: '1',
    watchModelId: 'w2',
    dateAdded: '2024-05-20',
    priority: 1,
    notes: 'Blue dial preferred'
  },
  {
    id: 'wl3',
    clientId: '4',
    watchModelId: 'w4',
    dateAdded: '2024-07-01',
    priority: 2,
    notes: 'Any color acceptable'
  },
  {
    id: 'wl4',
    clientId: '5',
    watchModelId: 'w1',
    dateAdded: '2024-08-10',
    priority: 3,
    notes: 'Investment purchase'
  }
]
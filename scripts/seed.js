const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Sample data
const sampleClients = [
  {
    name: 'James Morrison',
    email: 'james.morrison@example.com',
    phone: '+1-555-0101',
    lifetime_spend: 750000,
    preferred_brands: ['Patek Philippe', 'Rolex', 'Audemars Piguet'],
    notes: 'Long-time collector, prefers complicated timepieces'
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@example.com',
    phone: '+1-555-0102',
    lifetime_spend: 320000,
    preferred_brands: ['Rolex', 'Omega'],
    notes: 'Investment focused, likes sports models'
  },
  {
    name: 'Marcus Weber',
    email: 'marcus.weber@example.com',
    phone: '+1-555-0103',
    lifetime_spend: 150000,
    preferred_brands: ['A. Lange & Söhne', 'Jaeger-LeCoultre'],
    notes: 'German manufacturing enthusiast'
  },
  {
    name: 'Isabella Rodriguez',
    email: 'isabella.rodriguez@example.com',
    phone: '+1-555-0104',
    lifetime_spend: 45000,
    preferred_brands: ['Cartier', 'Bulgari'],
    notes: 'New client, interested in jewelry watches'
  },
  {
    name: 'Robert Thompson',
    email: 'robert.thompson@example.com',
    phone: '+1-555-0105',
    lifetime_spend: 890000,
    preferred_brands: ['Patek Philippe', 'Vacheron Constantin', 'A. Lange & Söhne'],
    notes: 'Serious collector, Grand Complications specialist'
  }
];

const sampleInventory = [
  {
    brand: 'Patek Philippe',
    model: 'Nautilus 5711/1A',
    reference_number: '5711/1A-010',
    price: 150000,
    retail_price: 34890,
    category: 'steel',
    availability_date: '2024-03-15',
    description: 'Steel case, blue dial, automatic movement',
    is_available: true
  },
  {
    brand: 'Rolex',
    model: 'Daytona Cosmograph',
    reference_number: '116500LN',
    price: 45000,
    retail_price: 14550,
    category: 'steel',
    availability_date: '2024-02-20',
    description: 'White dial, Cerachrom bezel, Oystersteel',
    is_available: true
  },
  {
    brand: 'Audemars Piguet',
    model: 'Royal Oak 15202ST',
    reference_number: '15202ST.OO.1240ST.01',
    price: 85000,
    retail_price: 27400,
    category: 'steel',
    availability_date: '2024-04-10',
    description: 'Extra-thin, blue dial, steel bracelet',
    is_available: false
  },
  {
    brand: 'Patek Philippe',
    model: 'Calatrava 5227G',
    reference_number: '5227G-001',
    price: 65000,
    retail_price: 38240,
    category: 'gold',
    availability_date: '2024-01-25',
    description: 'White gold case, silver dial, officer caseback',
    is_available: true
  },
  {
    brand: 'A. Lange & Söhne',
    model: 'Datograph Up/Down',
    reference_number: '405.035',
    price: 125000,
    retail_price: 83500,
    category: 'complicated',
    availability_date: '2024-05-01',
    description: 'Platinum case, black dial, chronograph with power reserve',
    is_available: true
  },
  {
    brand: 'Rolex',
    model: 'GMT-Master II',
    reference_number: '126710BLNR',
    price: 22000,
    retail_price: 10550,
    category: 'steel',
    availability_date: '2024-02-14',
    description: 'Batman bezel, Oystersteel, Jubilee bracelet',
    is_available: true
  },
  {
    brand: 'Vacheron Constantin',
    model: 'Traditionelle Perpetual Calendar',
    reference_number: '43175/000P-B190',
    price: 295000,
    retail_price: 195000,
    category: 'complicated',
    availability_date: '2024-06-15',
    description: 'Platinum case, perpetual calendar, moon phases',
    is_available: true
  },
  {
    brand: 'Omega',
    model: 'Speedmaster Professional',
    reference_number: '310.30.42.50.01.001',
    price: 8500,
    retail_price: 6350,
    category: 'steel',
    availability_date: '2024-01-10',
    description: 'Moonwatch, manual wind, hesalite crystal',
    is_available: true
  }
];

const sampleUserProfiles = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    full_name: 'Alexandra Lenkersdorfer',
    role: 'admin',
    team: 'Management',
    commission_rate: 0.00
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    full_name: 'Michael Harrison',
    role: 'manager',
    team: 'Sales Team Alpha',
    commission_rate: 5.00
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    full_name: 'Emma Richardson',
    role: 'salesperson',
    team: 'Sales Team Alpha',
    commission_rate: 12.00
  },
  {
    id: '44444444-4444-4444-4444-444444444444',
    full_name: 'David Kim',
    role: 'salesperson',
    team: 'Sales Team Beta',
    commission_rate: 10.00
  }
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data (in reverse order due to foreign keys)
    console.log('Clearing existing data...');
    await supabase.from('allocations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('purchases').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('waitlist').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('clients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Insert user profiles
    console.log('Inserting user profiles...');
    const { error: userError } = await supabase
      .from('user_profiles')
      .insert(sampleUserProfiles);

    if (userError) {
      console.error('Error inserting user profiles:', userError);
    } else {
      console.log(`✅ Inserted ${sampleUserProfiles.length} user profiles`);
    }

    // Insert clients with assigned salespeople
    console.log('Inserting clients...');
    const clientsWithAssignment = sampleClients.map((client, index) => ({
      ...client,
      assigned_to: index < 2 ? '33333333-3333-3333-3333-333333333333' : '44444444-4444-4444-4444-444444444444'
    }));

    const { data: insertedClients, error: clientError } = await supabase
      .from('clients')
      .insert(clientsWithAssignment)
      .select();

    if (clientError) {
      console.error('Error inserting clients:', clientError);
      return;
    }
    console.log(`✅ Inserted ${insertedClients.length} clients`);

    // Insert inventory
    console.log('Inserting inventory...');
    const { data: insertedInventory, error: inventoryError } = await supabase
      .from('inventory')
      .insert(sampleInventory)
      .select();

    if (inventoryError) {
      console.error('Error inserting inventory:', inventoryError);
      return;
    }
    console.log(`✅ Inserted ${insertedInventory.length} inventory items`);

    // Create sample waitlist entries
    console.log('Creating waitlist entries...');
    const waitlistEntries = [
      {
        client_id: insertedClients[0].id, // James Morrison (Platinum)
        brand: 'Patek Philippe',
        model: 'Nautilus 5711/1A',
        wait_start_date: '2023-08-15',
        notes: 'Preferred client - Nautilus collector'
      },
      {
        client_id: insertedClients[1].id, // Sarah Chen (Gold)
        brand: 'Rolex',
        model: 'Daytona Cosmograph',
        wait_start_date: '2023-11-20',
        notes: 'Investment piece for collection'
      },
      {
        client_id: insertedClients[2].id, // Marcus Weber (Silver)
        brand: 'A. Lange & Söhne',
        model: 'Datograph Up/Down',
        wait_start_date: '2023-09-10',
        notes: 'Appreciates German craftsmanship'
      },
      {
        client_id: insertedClients[3].id, // Isabella Rodriguez (Bronze)
        brand: 'Rolex',
        model: 'GMT-Master II',
        wait_start_date: '2023-12-01',
        notes: 'First serious timepiece purchase'
      },
      {
        client_id: insertedClients[4].id, // Robert Thompson (Platinum)
        brand: 'Vacheron Constantin',
        model: 'Traditionelle Perpetual Calendar',
        wait_start_date: '2023-07-01',
        notes: 'Grand complication specialist'
      },
      {
        client_id: insertedClients[0].id, // James Morrison (additional entry)
        brand: 'Audemars Piguet',
        model: 'Royal Oak 15202ST',
        wait_start_date: '2023-10-05',
        notes: 'Backup option for steel sports watch'
      }
    ];

    const { data: insertedWaitlist, error: waitlistError } = await supabase
      .from('waitlist')
      .insert(waitlistEntries)
      .select();

    if (waitlistError) {
      console.error('Error inserting waitlist entries:', waitlistError);
      return;
    }
    console.log(`✅ Inserted ${insertedWaitlist.length} waitlist entries`);

    // Create sample allocation (already allocated watch)
    console.log('Creating sample allocation...');
    const nautilus = insertedInventory.find(item => item.model === 'Nautilus 5711/1A');
    if (nautilus) {
      const { error: allocationError } = await supabase.rpc('allocate_watch', {
        client_id_param: insertedClients[0].id, // James Morrison
        watch_id_param: nautilus.id,
        allocated_by_param: '33333333-3333-3333-3333-333333333333' // Emma Richardson
      });

      if (allocationError) {
        console.error('Error creating allocation:', allocationError);
      } else {
        console.log('✅ Created sample allocation');
      }
    }

    // Create sample purchase history
    console.log('Creating purchase history...');
    const purchaseHistory = [
      {
        client_id: insertedClients[0].id, // James Morrison
        brand: 'Patek Philippe',
        model: 'Calatrava 5227R',
        price: 58000,
        commission_rate: 15.00,
        commission_amount: 8700,
        purchase_date: '2023-03-15',
        salesperson_id: '33333333-3333-3333-3333-333333333333'
      },
      {
        client_id: insertedClients[1].id, // Sarah Chen
        brand: 'Rolex',
        model: 'Submariner Date',
        price: 18000,
        commission_rate: 10.00,
        commission_amount: 1800,
        purchase_date: '2023-05-20',
        salesperson_id: '33333333-3333-3333-3333-333333333333'
      },
      {
        client_id: insertedClients[4].id, // Robert Thompson
        brand: 'A. Lange & Söhne',
        model: 'Lange 1 Time Zone',
        price: 75000,
        commission_rate: 20.00,
        commission_amount: 15000,
        purchase_date: '2023-01-10',
        salesperson_id: '44444444-4444-4444-4444-444444444444'
      }
    ];

    const { error: purchaseError } = await supabase
      .from('purchases')
      .insert(purchaseHistory);

    if (purchaseError) {
      console.error('Error inserting purchase history:', purchaseError);
    } else {
      console.log(`✅ Inserted ${purchaseHistory.length} purchase records`);
    }

    console.log('\\n🎉 Database seeding completed successfully!');
    console.log('\\nSample data includes:');
    console.log(`- ${sampleClients.length} clients with varying VIP tiers`);
    console.log(`- ${sampleInventory.length} luxury watches across different categories`);
    console.log(`- ${waitlistEntries.length} waitlist entries with calculated priority scores`);
    console.log('- 1 sample allocation (Nautilus to James Morrison)');
    console.log(`- ${purchaseHistory.length} historical purchases to establish lifetime spend`);
    console.log('\\nVIP Tier Distribution:');
    console.log('- Platinum: James Morrison (€750K), Robert Thompson (€890K)');
    console.log('- Gold: Sarah Chen (€320K)');
    console.log('- Silver: Marcus Weber (€150K)');
    console.log('- Bronze: Isabella Rodriguez (€45K)');

  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeding
seedDatabase();
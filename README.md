# Lenkersdorfer Luxury Watch CRM

A sophisticated CRM system designed specifically for luxury watch dealerships, featuring intelligent allocation algorithms, VIP tier management, and comprehensive waitlist prioritization.

## Features

### Core Functionality
- **Smart Client Management**: Automatic VIP tier calculation based on lifetime spend
- **Intelligent Waitlist**: Priority scoring algorithm considering multiple factors
- **Allocation Engine**: Automated watch allocation with business logic
- **Inventory Management**: Real-time availability tracking
- **Commission Calculation**: Category-based commission rates (Steel: 10%, Gold: 15%, Complicated: 20%)

### VIP Tier System
- **Platinum**: €500K+ lifetime spend (40 priority points)
- **Gold**: €200K+ lifetime spend (30 priority points)
- **Silver**: €100K+ lifetime spend (20 priority points)
- **Bronze**: <€100K lifetime spend (10 priority points)

### Priority Scoring Algorithm
The system calculates priority scores based on:
- VIP tier weight: 40 points (Platinum) to 10 points (Bronze)
- Lifetime spend: Up to 30 additional points
- Wait time: Up to 15 points for extended waits
- Brand preference match: 15 bonus points

## Database Schema

### Core Tables
- `clients`: Customer information with VIP tiers and lifetime spend
- `inventory`: Watch catalog with availability tracking
- `waitlist`: Priority-ranked waiting lists with smart scoring
- `allocations`: Watch assignments with commission tracking
- `purchases`: Historical transactions for lifetime spend calculation
- `user_profiles`: Staff roles and permissions

### Business Logic Functions
- `calculate_vip_tier()`: Automatic tier assignment
- `calculate_priority_score()`: Dynamic waitlist ranking
- `get_waitlist_candidates()`: Smart allocation recommendations
- `allocate_watch()`: Atomic allocation processing

## API Endpoints

### Clients
- `GET /api/clients` - List clients with filtering and pagination
- `POST /api/clients` - Create new client
- `GET /api/clients/[id]` - Get client details
- `PATCH /api/clients/[id]` - Update client information

### Waitlist
- `GET /api/waitlist` - Get prioritized waitlist
- `POST /api/waitlist` - Add client to waitlist
- `GET /api/waitlist/candidates` - Get allocation candidates for specific watch

### Allocations
- `GET /api/allocations` - List allocations
- `POST /api/allocations` - Create new allocation
- `PATCH /api/allocations/[id]` - Update allocation status

### Inventory
- `GET /api/inventory` - Browse available watches
- `POST /api/inventory` - Add new inventory
- `PATCH /api/inventory/[id]` - Update watch details

## Security

### Row Level Security (RLS)
- Salespeople can only access their assigned clients
- Managers have team-wide visibility
- Admins have full system access
- No cross-salesperson data leakage

### Data Integrity
- Automatic VIP tier calculation triggers
- Commission rate validation
- Allocation status workflow enforcement
- Purchase history preservation

## Performance Standards

- All queries complete in <100ms
- Optimized database indexes
- Pagination on all list endpoints
- Real-time updates via Supabase subscriptions

## Setup Instructions

1. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Add your Supabase credentials
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   npm run db:migrate  # Apply schema migrations
   npm run db:seed     # Populate with sample data
   ```

4. **Start Development**
   ```bash
   npm run dev
   ```

## Sample Data

The seed script creates:
- 5 clients across all VIP tiers
- 8 luxury watches (Patek Philippe, Rolex, AP, etc.)
- 6 waitlist entries with calculated priorities
- 1 sample allocation
- 3 historical purchases

### Sample Clients
- **James Morrison** (Platinum, €750K) - Patek Philippe collector
- **Sarah Chen** (Gold, €320K) - Investment focused
- **Marcus Weber** (Silver, €150K) - German watch enthusiast
- **Isabella Rodriguez** (Bronze, €45K) - New collector
- **Robert Thompson** (Platinum, €890K) - Grand complications specialist

## Technology Stack

- **Backend**: Next.js API routes with TypeScript
- **Database**: Supabase (PostgreSQL + Real-time + Auth)
- **Security**: Row Level Security policies
- **Performance**: Optimized queries with monitoring

## Business Rules

### Allocation Priority
1. Query waiting clients for specific model
2. Calculate real-time priority scores
3. Return top candidates with reasoning
4. Execute atomic allocation
5. Update all related records

### Commission Structure
- Steel watches: 10% commission
- Gold watches: 15% commission
- Complicated watches: 20% commission

### Data Protection
- No deletion of purchase history
- No manual lifetime spend modifications
- Comprehensive audit trails
- Automatic backup triggers

## Contributing

This system is designed for luxury watch dealerships requiring sophisticated allocation logic and client management. All business rules are enforced at the database level to ensure data integrity and consistent behavior across all interfaces.
# Input Validation Guide
## Lenkersdorfer CRM - Developer Reference

---

## Quick Start

All API routes must validate input using Zod schemas before database operations.

### Basic Pattern

```typescript
import { ClientCreateSchema } from '@/lib/validation/schemas'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validated = ClientCreateSchema.parse(body)

    // Use validated.* fields (never use body.* directly)
    const { data, error } = await supabase
      .from('clients')
      .insert([{
        name: validated.name,
        email: validated.email,
        // ... only validated fields
      }])

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
    // Handle other errors
  }
}
```

---

## Available Schemas

### Client Operations
```typescript
import { ClientCreateSchema, ClientUpdateSchema } from '@/lib/validation/schemas'

// Create: Requires name, email; optional phone, notes
const validated = ClientCreateSchema.parse(body)

// Update: All fields optional, strict mode (rejects unknown fields)
const validated = ClientUpdateSchema.parse(body)
```

### Watch/Inventory Operations
```typescript
import { WatchCreateSchema, WatchUpdateSchema } from '@/lib/validation/schemas'

// Create: Requires brand, model, price
const validated = WatchCreateSchema.parse(body)

// Update: Partial schema, strict mode
const validated = WatchUpdateSchema.parse(body)
```

### Search & Pagination
```typescript
import { SearchQuerySchema, sanitizeSearchInput } from '@/lib/validation/schemas'

// Validates page (1-1000), limit (1-100), search (max 255)
const validated = SearchQuerySchema.parse({
  page: parseInt(searchParams.get('page') || '1'),
  limit: parseInt(searchParams.get('limit') || '50'),
  search: searchParams.get('search') || undefined
})

// Always sanitize search input before database queries
if (validated.search) {
  const sanitized = sanitizeSearchInput(validated.search)
  query = query.ilike('field', `%${sanitized}%`)
}
```

### Purchase Operations
```typescript
import { PurchaseCreateSchema } from '@/lib/validation/schemas'

// Validates client_id (UUID), price (0-10M), commission
const validated = PurchaseCreateSchema.parse(body)
```

### Waitlist Operations
```typescript
import { WaitlistCreateSchema, WaitlistUpdateSchema } from '@/lib/validation/schemas'

// Create: Requires client_id, watch_model_id
const validated = WaitlistCreateSchema.parse(body)

// Update: priority_score, notes, status (strict mode)
const validated = WaitlistUpdateSchema.parse(body)
```

### Reminder Operations
```typescript
import { ReminderCreateSchema, ReminderUpdateSchema } from '@/lib/validation/schemas'

// Create: Requires client_id, reminder_type, reminder_date
const validated = ReminderCreateSchema.parse(body)

// Update: All fields optional (strict mode)
const validated = ReminderUpdateSchema.parse(body)
```

---

## Validation Rules

### String Validation
- **Names:** 1-255 characters
- **Emails:** Valid email format, max 255 characters
- **Phone:** Format `(555) 123-4567` (optional)
- **Notes:** Max 5000 characters
- **Descriptions:** Max 2000 characters

### Numeric Validation
- **Prices:** 0 to 10,000,000 (no negatives)
- **Lifetime Spend:** 0 to 100,000,000
- **Commission Rate:** 0 to 100 (percentage)
- **Priority Score:** 0 to 100
- **Year:** 1900 to current year + 1
- **Watch Tier:** 1 to 5
- **Days Ahead:** 1 to 365

### Format Validation
- **UUID:** Must be valid UUID v4 format
- **DateTime:** Must be valid ISO 8601 datetime string
- **Email:** Must match email pattern
- **Phone:** Must match `^\(\d{3}\) \d{3}-\d{4}$`

### Enum Validation
- **Condition:** 'new' | 'excellent' | 'good' | 'fair'
- **Reminder Type:** 'follow_up' | 'birthday' | 'anniversary' | 'service' | 'custom'
- **Waitlist Status:** 'active' | 'allocated' | 'cancelled'

---

## Security Best Practices

### 1. Always Validate Before Database Operations
```typescript
// ❌ BAD: Direct insertion from request body
const { data } = await supabase
  .from('clients')
  .insert([body]) // DANGEROUS!

// ✅ GOOD: Validate first
const validated = ClientCreateSchema.parse(body)
const { data } = await supabase
  .from('clients')
  .insert([{
    name: validated.name,
    email: validated.email,
    // ... explicit field mapping
  }])
```

### 2. Use Strict Mode for Updates
```typescript
// ❌ BAD: Accepts arbitrary fields
const updateData = { ...body } // Could include 'assigned_to', 'id', etc.

// ✅ GOOD: Strict schema rejects unknown fields
const validated = ClientUpdateSchema.parse(body) // Throws on unknown fields
```

### 3. Sanitize Search Input
```typescript
// ❌ BAD: SQL injection vulnerability
const search = searchParams.get('search')
query = query.ilike('name', `%${search}%`) // DANGEROUS!

// ✅ GOOD: Sanitize first
const sanitized = sanitizeSearchInput(validated.search)
query = query.ilike('name', `%${sanitized}%`)
```

### 4. Whitelist Fields for Updates
```typescript
// ❌ BAD: Spread operator allows injection
const { data } = await supabase
  .from('clients')
  .update({ ...validated }) // Could update protected fields if schema changes

// ✅ GOOD: Explicit field mapping
const updateData: any = {}
if (validated.name !== undefined) updateData.name = validated.name
if (validated.email !== undefined) updateData.email = validated.email
// ... only whitelisted fields
```

### 5. Never Trust Protected Fields from Input
```typescript
// Protected fields that should NEVER come from user input:
// - id (set by database)
// - created_at (set by database)
// - assigned_to (set by auth context)
// - salesperson_id (set by auth context)

// ✅ GOOD: Set from auth context
const { data } = await supabase
  .from('clients')
  .insert([{
    ...validated,
    assigned_to: user.id // From auth, not input
  }])
```

---

## Error Handling

### Standard Error Response
```typescript
try {
  const validated = Schema.parse(body)
  // ... database operations
} catch (error) {
  // Validation errors
  if (error instanceof z.ZodError) {
    return NextResponse.json({
      error: 'Validation failed',
      details: error.errors
    }, { status: 400 })
  }

  // Auth errors (if applicable)
  if (authError) {
    return NextResponse.json({
      error: 'Unauthorized'
    }, { status: 401 })
  }

  // Database errors
  if (dbError) {
    console.error('Database error:', dbError) // Log for debugging
    return NextResponse.json({
      error: 'Failed to perform operation'
    }, { status: 500 })
  }

  // Unexpected errors
  console.error('Unexpected error:', error)
  return NextResponse.json({
    error: 'Internal server error'
  }, { status: 500 })
}
```

### Example Validation Error
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "too_big",
      "maximum": 255,
      "path": ["name"],
      "message": "Name too long"
    },
    {
      "code": "invalid_type",
      "expected": "number",
      "received": "string",
      "path": ["lifetime_spend"],
      "message": "Expected number, received string"
    }
  ]
}
```

---

## Common Patterns

### Pattern 1: Create Endpoint
```typescript
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate input
    const body = await request.json()
    const validated = CreateSchema.parse(body)

    // 3. Database operation with validated data
    const { data, error } = await supabase
      .from('table')
      .insert([{
        ...validated,
        assigned_to: user.id // Set from auth
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create' }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Pattern 2: Update Endpoint
```typescript
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const supabase = await createServerSupabaseClient()

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate with strict schema
    const body = await request.json()
    const validated = UpdateSchema.parse(body) // Rejects unknown fields

    // 3. Explicit field whitelisting
    const updateData: any = {}
    if (validated.field1 !== undefined) updateData.field1 = validated.field1
    if (validated.field2 !== undefined) updateData.field2 = validated.field2
    // ... only safe fields

    // 4. Database operation
    const { data, error } = await supabase
      .from('table')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation failed',
        details: error.errors
      }, { status: 400 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Pattern 3: Search/List Endpoint
```typescript
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()

    // 1. Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const validated = SearchQuerySchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '50'),
      search: searchParams.get('search') || undefined
    })

    // 3. Build query
    let query = supabase
      .from('table')
      .select('*', { count: 'exact' })

    // 4. Apply sanitized search filter
    if (validated.search) {
      const sanitized = sanitizeSearchInput(validated.search)
      query = query.ilike('field', `%${sanitized}%`)
    }

    // 5. Apply pagination
    const offset = (validated.page - 1) * validated.limit
    query = query.range(offset, offset + validated.limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    return NextResponse.json({
      items: data,
      total: count,
      page: validated.page,
      limit: validated.limit
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Invalid query parameters',
        details: error.errors
      }, { status: 400 })
    }
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Testing Validation

### Unit Test Example
```typescript
import { ClientCreateSchema } from '@/lib/validation/schemas'

describe('ClientCreateSchema', () => {
  it('should validate correct input', () => {
    const valid = {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '(555) 123-4567',
      lifetime_spend: 5000
    }
    expect(() => ClientCreateSchema.parse(valid)).not.toThrow()
  })

  it('should reject invalid email', () => {
    const invalid = {
      name: 'John Doe',
      email: 'not-an-email',
      lifetime_spend: 5000
    }
    expect(() => ClientCreateSchema.parse(invalid)).toThrow()
  })

  it('should reject negative lifetime_spend', () => {
    const invalid = {
      name: 'John Doe',
      email: 'john@example.com',
      lifetime_spend: -999
    }
    expect(() => ClientCreateSchema.parse(invalid)).toThrow()
  })
})
```

### API Test Example
```bash
# Test validation
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Client",
    "email": "test@example.com",
    "lifetime_spend": 5000
  }'

# Expected: 201 Created

# Test validation failure
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{
    "name": "",
    "email": "invalid-email",
    "lifetime_spend": -999
  }'

# Expected: 400 Bad Request with validation details
```

---

## Adding New Schemas

When adding a new endpoint, follow these steps:

1. **Define schema in `/src/lib/validation/schemas.ts`:**
```typescript
export const NewFeatureCreateSchema = z.object({
  field1: z.string().min(1).max(255),
  field2: z.number().min(0).max(1000),
  field3: z.enum(['option1', 'option2']).default('option1'),
})

export const NewFeatureUpdateSchema = NewFeatureCreateSchema.partial().strict()
```

2. **Import in your API route:**
```typescript
import { NewFeatureCreateSchema } from '@/lib/validation/schemas'
```

3. **Validate input:**
```typescript
const validated = NewFeatureCreateSchema.parse(body)
```

4. **Use validated fields:**
```typescript
const { data } = await supabase.from('table').insert([validated])
```

---

## Questions?

Refer to:
- Zod documentation: https://zod.dev
- Security report: `/PHASE_2_SECURITY_REPORT.md`
- Example implementations in `/src/app/api/clients/route.ts`

For security concerns, always consult the Backend Engine.

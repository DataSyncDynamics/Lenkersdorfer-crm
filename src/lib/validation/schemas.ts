import { z } from 'zod'

// Client Schemas
export const ClientCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  email: z.string().email('Invalid email format').max(255),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Phone must be in format (555) 123-4567').optional(),
  lifetime_spend: z.number().min(0, 'Lifetime spend cannot be negative').max(100000000, 'Lifetime spend too high').default(0),
  preferred_brands: z.array(z.string().max(100)).max(50, 'Too many brands').default([]),
  notes: z.string().max(5000, 'Notes too long').optional(),
  last_contact_date: z.string().datetime().optional(),
})

export const ClientUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/).optional(),
  notes: z.string().max(5000).optional(),
  preferred_brands: z.array(z.string()).max(50).optional(),
  last_contact_date: z.string().datetime().optional(),
}).strict() // Reject any fields not in this schema

// Search & Pagination Schemas
export const SearchQuerySchema = z.object({
  search: z.string().max(255).optional(),
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(50),
})

// Watch/Inventory Schemas
export const WatchCreateSchema = z.object({
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(255),
  collection: z.string().max(255).optional(),
  reference_number: z.string().max(50).optional(),
  price: z.number().min(0).max(10000000),
  retail_price: z.number().min(0).max(10000000).optional(),
  year: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  condition: z.enum(['new', 'excellent', 'good', 'fair']).default('new'),
  is_available: z.boolean().default(true),
  watch_tier: z.number().int().min(1).max(5).optional(),
  description: z.string().max(2000).optional(),
  specifications: z.record(z.any()).optional(),
})

export const WatchUpdateSchema = WatchCreateSchema.partial().strict()

// Purchase Schemas
export const PurchaseCreateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  watch_model_id: z.string().uuid('Invalid watch model ID').optional(),
  brand: z.string().min(1).max(100),
  model: z.string().min(1).max(255),
  price: z.number().min(0).max(10000000),
  commission_rate: z.number().min(0).max(100).default(15),
  commission_amount: z.number().min(0).max(10000000),
  purchase_date: z.string().datetime(),
  serial_number: z.string().max(100).optional(),
})

// Waitlist Schemas
export const WaitlistCreateSchema = z.object({
  client_id: z.string().uuid(),
  watch_model_id: z.string().uuid(),
  priority_score: z.number().min(0).max(100).default(50),
  notes: z.string().max(2000).optional(),
})

export const WaitlistUpdateSchema = z.object({
  priority_score: z.number().min(0).max(100).optional(),
  notes: z.string().max(2000).optional(),
  status: z.enum(['active', 'allocated', 'cancelled']).optional(),
}).strict()

// Reminder Schemas
export const ReminderCreateSchema = z.object({
  client_id: z.string().uuid(),
  reminder_type: z.enum(['follow_up', 'birthday', 'anniversary', 'service', 'custom']),
  reminder_date: z.string().datetime(),
  title: z.string().min(1).max(255),
  notes: z.string().max(2000).optional(),
  is_completed: z.boolean().default(false),
})

export const ReminderUpdateSchema = z.object({
  reminder_date: z.string().datetime().optional(),
  title: z.string().min(1).max(255).optional(),
  notes: z.string().max(2000).optional(),
  is_completed: z.boolean().optional(),
}).strict()

// Helper function to sanitize search input
export function sanitizeSearchInput(input: string): string {
  // Remove special characters that could be used for SQL injection
  // Keep alphanumeric, spaces, hyphens, periods, and @ (for emails)
  return input.replace(/[^a-zA-Z0-9\s\-\.@]/g, '').trim()
}

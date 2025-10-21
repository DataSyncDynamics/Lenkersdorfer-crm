// Tier-based follow-up frequency calculator
import type { VipTier } from '@/types'

// Follow-up frequency by tier (in days)
export const TIER_FOLLOW_UP_DAYS: Record<VipTier, number> = {
  'Platinum': 14,  // Tier 1: Every 14 days
  'Gold': 21,      // Tier 2: Every 21 days
  'Silver': 30,    // Tier 3: Every 30 days
  'Bronze': 60,    // Tier 4: Every 60 days
}

// Default follow-up for clients without tier
export const DEFAULT_FOLLOW_UP_DAYS = 90

/**
 * Calculate next follow-up date based on client tier and last contact
 */
export function calculateNextFollowUpDate(
  tier: VipTier | null,
  lastContactDate: string | null
): Date {
  const now = new Date()
  const lastContact = lastContactDate ? new Date(lastContactDate) : now

  // Get follow-up days based on tier
  const followUpDays = tier ? TIER_FOLLOW_UP_DAYS[tier] : DEFAULT_FOLLOW_UP_DAYS

  // Calculate next follow-up date
  const nextFollowUp = new Date(lastContact)
  nextFollowUp.setDate(nextFollowUp.getDate() + followUpDays)

  return nextFollowUp
}

/**
 * Check if a client needs a follow-up reminder
 */
export function needsFollowUpReminder(
  tier: VipTier | null,
  lastContactDate: string | null
): boolean {
  if (!lastContactDate) return true // Never contacted = needs follow-up

  const nextFollowUp = calculateNextFollowUpDate(tier, lastContactDate)
  const now = new Date()

  return nextFollowUp <= now
}

/**
 * Get days until next follow-up is due
 */
export function getDaysUntilFollowUp(
  tier: VipTier | null,
  lastContactDate: string | null
): number {
  if (!lastContactDate) return 0

  const nextFollowUp = calculateNextFollowUpDate(tier, lastContactDate)
  const now = new Date()
  const diffMs = nextFollowUp.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * Get days overdue for follow-up (negative if not yet due)
 */
export function getDaysOverdue(
  tier: VipTier | null,
  lastContactDate: string | null
): number {
  const daysUntil = getDaysUntilFollowUp(tier, lastContactDate)
  return -daysUntil
}

/**
 * Format tier follow-up frequency for display
 */
export function getFollowUpFrequencyLabel(tier: VipTier | null): string {
  if (!tier) return 'Every 90 days'

  const days = TIER_FOLLOW_UP_DAYS[tier]

  if (days === 14) return 'Every 2 weeks'
  if (days === 21) return 'Every 3 weeks'
  if (days === 30) return 'Every month'
  if (days === 60) return 'Every 2 months'
  if (days === 90) return 'Every 3 months'

  return `Every ${days} days`
}

/**
 * Purchase Pattern Recognition Utilities
 * Analyzes client purchase behavior to predict engagement and buying temperature
 */

import { Client } from '@/types'

export interface PurchasePattern {
  averageDaysBetweenPurchases: number | null
  lastPurchaseDaysAgo: number | null
  totalPurchases: number
  buyingTemperature: 'HOT' | 'WARM' | 'COOLING' | 'COLD' | 'UNKNOWN'
  temperatureEmoji: string
  nextExpectedPurchase: Date | null
  isOverdue: boolean
}

/**
 * Calculate the average number of days between purchases
 */
export function calculateAverageDaysBetweenPurchases(purchases: Array<{ date: string }>): number | null {
  if (purchases.length < 2) return null

  // Sort purchases by date (oldest first)
  const sortedPurchases = [...purchases].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Calculate gaps between consecutive purchases
  const gaps: number[] = []
  for (let i = 1; i < sortedPurchases.length; i++) {
    const prevDate = new Date(sortedPurchases[i - 1].date)
    const currDate = new Date(sortedPurchases[i].date)
    const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
    gaps.push(daysDiff)
  }

  // Return average
  const sum = gaps.reduce((acc, gap) => acc + gap, 0)
  return Math.round(sum / gaps.length)
}

/**
 * Calculate days since last purchase
 */
export function calculateDaysSinceLastPurchase(lastPurchaseDate: string | null): number | null {
  if (!lastPurchaseDate) return null

  const now = new Date()
  const lastPurchase = new Date(lastPurchaseDate)
  return Math.floor((now.getTime() - lastPurchase.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Determine buying temperature based on purchase patterns
 *
 * HOT: 🔥🔥🔥 Recently purchased or expected to purchase soon (within next 30 days)
 * WARM: 🔥🔥 Approaching expected purchase window (30-60 days out)
 * COOLING: 🔥 Past expected purchase window (60-90 days overdue)
 * COLD: ❄️ Significantly overdue (90+ days past expected)
 * UNKNOWN: ❓ Not enough data to predict
 */
export function calculateBuyingTemperature(
  averageDays: number | null,
  daysSinceLastPurchase: number | null,
  totalPurchases: number
): {
  temperature: 'HOT' | 'WARM' | 'COOLING' | 'COLD' | 'UNKNOWN'
  emoji: string
} {
  // No purchase history
  if (totalPurchases === 0) {
    return { temperature: 'UNKNOWN', emoji: '❓' }
  }

  // Only one purchase - classify based on recency
  if (totalPurchases === 1) {
    if (!daysSinceLastPurchase) return { temperature: 'UNKNOWN', emoji: '❓' }

    if (daysSinceLastPurchase <= 90) return { temperature: 'WARM', emoji: '🔥🔥' }
    if (daysSinceLastPurchase <= 180) return { temperature: 'COOLING', emoji: '🔥' }
    return { temperature: 'COLD', emoji: '❄️' }
  }

  // Multiple purchases - use pattern prediction
  if (!averageDays || !daysSinceLastPurchase) {
    return { temperature: 'UNKNOWN', emoji: '❓' }
  }

  // Calculate how overdue they are compared to their normal pattern
  const expectedPurchaseWindow = averageDays * 1.2 // Allow 20% variance
  const overdueBy = daysSinceLastPurchase - expectedPurchaseWindow

  if (overdueBy < -30) {
    // Recent purchase or not yet due
    return { temperature: 'HOT', emoji: '🔥🔥🔥' }
  } else if (overdueBy < 30) {
    // Within expected window or slightly overdue
    return { temperature: 'WARM', emoji: '🔥🔥' }
  } else if (overdueBy < 90) {
    // Moderately overdue
    return { temperature: 'COOLING', emoji: '🔥' }
  } else {
    // Significantly overdue
    return { temperature: 'COLD', emoji: '❄️' }
  }
}

/**
 * Calculate when the next purchase is expected
 */
export function calculateNextExpectedPurchase(
  lastPurchaseDate: string | null,
  averageDays: number | null
): Date | null {
  if (!lastPurchaseDate || !averageDays) return null

  const lastPurchase = new Date(lastPurchaseDate)
  const expected = new Date(lastPurchase)
  expected.setDate(expected.getDate() + averageDays)

  return expected
}

/**
 * Get full purchase pattern analysis for a client
 */
export function analyzePurchasePattern(client: Client): PurchasePattern {
  const averageDays = calculateAverageDaysBetweenPurchases(client.purchases || [])
  const daysSinceLastPurchase = calculateDaysSinceLastPurchase(client.lastPurchase)
  const totalPurchases = client.purchases?.length || 0

  const { temperature, emoji } = calculateBuyingTemperature(
    averageDays,
    daysSinceLastPurchase,
    totalPurchases
  )

  const nextExpectedPurchase = calculateNextExpectedPurchase(client.lastPurchase, averageDays)

  // Determine if overdue
  const isOverdue = nextExpectedPurchase ? new Date() > nextExpectedPurchase : false

  return {
    averageDaysBetweenPurchases: averageDays,
    lastPurchaseDaysAgo: daysSinceLastPurchase,
    totalPurchases,
    buyingTemperature: temperature,
    temperatureEmoji: emoji,
    nextExpectedPurchase,
    isOverdue
  }
}

/**
 * Get recommended action based on buying temperature
 */
export function getRecommendedAction(pattern: PurchasePattern): {
  action: string
  urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  message: string
} {
  switch (pattern.buyingTemperature) {
    case 'HOT':
      return {
        action: 'Present new arrivals',
        urgency: 'HIGH',
        message: 'Client is in active buying mode. Show them premium pieces.'
      }
    case 'WARM':
      return {
        action: 'Check in with client',
        urgency: 'MEDIUM',
        message: 'Approaching expected purchase window. Time for a friendly touchpoint.'
      }
    case 'COOLING':
      return {
        action: 'Re-engage with special offer',
        urgency: 'HIGH',
        message: 'Client is overdue. Re-engage with exclusive opportunity.'
      }
    case 'COLD':
      return {
        action: 'Win-back campaign needed',
        urgency: 'CRITICAL',
        message: 'Client relationship at risk. Urgent personal outreach required.'
      }
    default:
      return {
        action: 'Build relationship',
        urgency: 'LOW',
        message: 'Focus on relationship building and understanding preferences.'
      }
  }
}

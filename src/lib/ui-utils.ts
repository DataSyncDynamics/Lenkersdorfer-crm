import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Returns consistent tier-based color classes for badges and UI elements
 */
export function getTierColorClasses(tier: number): string {
  switch (tier) {
    case 1: return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
    case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700'
    case 3: return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700'
    case 4: return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700'
    case 5: return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
    default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700/50 dark:text-slate-200 dark:border-slate-600'
  }
}

/**
 * Returns VIP tier color classes (different from regular tier colors)
 */
export function getVipTierColorClasses(tier: number): string {
  switch (tier) {
    case 1: return 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
    case 2: return 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
    case 3: return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
    case 4: return 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
    case 5: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
    default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white'
  }
}

/**
 * Returns consistent status-based color classes
 */
export function getStatusColorClasses(status: string): string {
  switch (status.toUpperCase()) {
    case 'GREEN': return 'bg-green-100 text-green-800 border-green-200'
    case 'YELLOW': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'RED': return 'bg-red-100 text-red-800 border-red-200'
    case 'PERFECT_MATCH': return 'bg-green-100 text-green-800 border-green-200'
    case 'GOOD_MATCH': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'NEEDS_FOLLOWUP': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'AT_RISK': return 'bg-red-100 text-red-800 border-red-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Returns urgency-based color classes
 */
export function getUrgencyColorClasses(urgency: string): string {
  switch (urgency.toUpperCase()) {
    case 'CRITICAL': return 'bg-red-500 text-white'
    case 'HIGH': return 'bg-orange-500 text-white'
    case 'MEDIUM': return 'bg-yellow-500 text-white'
    case 'LOW': return 'bg-blue-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

/**
 * Returns position-based styling for waitlists and rankings
 */
export function getPositionStyling(position: number): string {
  if (position <= 3) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  } else if (position <= 10) {
    return 'bg-blue-100 text-blue-800 border-blue-200'
  } else {
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

/**
 * Calculates days between two dates (utility for wait times, etc.)
 */
export function calculateDaysBetween(startDate: Date | string, endDate: Date | string = new Date()): number {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Generates consistent avatar initials from a name
 */
export function getAvatarInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Returns priority-based styling for alerts and notifications
 */
export function getPriorityColorClasses(priority: string): string {
  switch (priority.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'bg-red-50 border-red-200 text-red-800'
    case 'MEDIUM':
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    case 'LOW':
      return 'bg-blue-50 border-blue-200 text-blue-800'
    default:
      return 'bg-gray-50 border-gray-200 text-gray-800'
  }
}

/**
 * Formats large numbers with appropriate suffixes (K, M, B)
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + 'B'
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'K'
  }
  return num.toString()
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Formats client names to consistent Title Case (proper case)
 * Removes middle names/initials and handles various input formats
 * Examples: "Edward L. Labarge" -> "Edward Labarge", "JOHN DOE" -> "John Doe"
 */
export function formatClientName(name: string): string {
  if (!name) return ''

  const words = name.toLowerCase().split(' ')

  // Filter out middle initials (single letters with or without period) and middle names
  // Keep only first and last name
  const filteredWords = words.filter((word, index) => {
    // Remove periods for checking
    const cleanWord = word.replace('.', '')

    // Keep first word (first name)
    if (index === 0) return true

    // Keep last word (last name)
    if (index === words.length - 1) return true

    // Remove single letters/initials (middle initials like "L" or "L.")
    if (cleanWord.length === 1) return false

    // If there are only 2 words total, keep both
    if (words.length === 2) return true

    // For 3+ words, remove middle words
    return false
  })

  return filteredWords
    .map(word => word.replace('.', '')) // Remove any remaining periods
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// Navigation utilities
/**
 * Returns consistent icon classes for navigation items
 */
export function getNavigationIconClasses(isActive: boolean): string {
  return cn(
    "h-5 w-5 flex-shrink-0",
    isActive ? "text-yellow-600 dark:text-yellow-400" : "text-neutral-700 dark:text-neutral-200"
  )
}

/**
 * Returns consistent link classes for navigation items
 */
export function getNavigationLinkClasses(isActive: boolean): string {
  return cn(
    "hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg px-2 transition-colors",
    isActive && "bg-yellow-100 dark:bg-yellow-900/30"
  )
}

/**
 * Formats notification count with max cap
 */
export function formatNotificationCount(count: number): string {
  return Math.min(count, 99).toString()
}

/**
 * Returns notification badge classes with optional variant
 */
export function getNotificationBadgeClasses(variant?: 'green'): string {
  const baseClasses = "notification-badge"
  return variant === 'green' ? `${baseClasses} bg-green-500` : baseClasses
}

// Match status warnings for waitlist entries
export type MatchWarningType = 'NEW_PROSPECT' | 'PRICE_MISMATCH' | 'TIER_GAP' | 'NONE'

export interface MatchWarning {
  type: MatchWarningType
  message: string
  severity: 'critical' | 'warning' | 'info'
}

/**
 * Get warning message for waitlist entry based on client/watch mismatch
 */
export function getMatchWarning(
  clientLifetimeSpend: number,
  clientTier: number,
  watchPrice: number,
  watchTier: number
): MatchWarning {
  // NEW PROSPECT WARNING: $0 spend clients
  if (clientLifetimeSpend === 0) {
    if (watchPrice > 10000) {
      return {
        type: 'NEW_PROSPECT',
        message: 'New prospect - Build relationship first',
        severity: 'critical'
      }
    }
    return {
      type: 'NEW_PROSPECT',
      message: 'New prospect - Entry level watch',
      severity: 'info'
    }
  }

  // PRICE MISMATCH: Watch exceeds client's tier max
  const tierMaxPrices: Record<number, number> = {
    1: 300000, // Tier 1: Ultra-High Net Worth
    2: 100000, // Tier 2: High Net Worth
    3: 45000,  // Tier 3: Established Collectors
    4: 20000,  // Tier 4: Growing Enthusiasts
    5: 12000   // Tier 5: Entry Level
  }

  const maxAffordable = tierMaxPrices[clientTier] || 12000
  if (watchPrice > maxAffordable) {
    return {
      type: 'PRICE_MISMATCH',
      message: `Price $${(watchPrice/1000).toFixed(0)}K exceeds Tier ${clientTier} max ($${(maxAffordable/1000).toFixed(0)}K)`,
      severity: 'critical'
    }
  }

  // TIER GAP: Client tier is significantly below watch tier
  const tierGap = watchTier - clientTier
  if (tierGap >= 2) {
    return {
      type: 'TIER_GAP',
      message: `Watch tier ${watchTier} - client tier ${clientTier} gap`,
      severity: 'warning'
    }
  }

  return {
    type: 'NONE',
    message: '',
    severity: 'info'
  }
}
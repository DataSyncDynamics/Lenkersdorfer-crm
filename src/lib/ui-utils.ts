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
    case 1: return 'bg-purple-100 text-purple-800 border-purple-200'
    case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 3: return 'bg-gray-100 text-gray-800 border-gray-200'
    case 4: return 'bg-orange-100 text-orange-800 border-orange-200'
    case 5: return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-gray-100 text-gray-800 border-gray-200'
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
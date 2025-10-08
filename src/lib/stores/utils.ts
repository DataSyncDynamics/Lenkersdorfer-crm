// Utility functions for the store

// Utility function to format currency
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Utility function to format VIP tier colors
// Handles both numeric tiers (1-5) and named tiers (Platinum, Gold, etc.)
export const getVipTierColor = (tier: string | number): string => {
  const tierStr = String(tier)

  switch (tierStr) {
    // Numeric tiers
    case '1': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    case '2': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    case '3': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800'
    case '4': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-950 border-green-200 dark:border-green-800'
    case '5': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
    // Named tiers for backward compatibility
    case 'Platinum': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-950 border-purple-200 dark:border-purple-800'
    case 'Gold': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800'
    case 'Silver': return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
    case 'Bronze': return 'text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950 border-orange-200 dark:border-orange-800'
    default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
  }
}
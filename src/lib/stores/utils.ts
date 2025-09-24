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
export const getVipTierColor = (tier: string): string => {
  switch (tier) {
    case 'Platinum': return 'text-purple-600 bg-purple-100'
    case 'Gold': return 'text-yellow-600 bg-yellow-100'
    case 'Silver': return 'text-gray-600 bg-gray-100'
    case 'Bronze': return 'text-orange-600 bg-orange-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}
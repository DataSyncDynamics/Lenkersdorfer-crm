/**
 * Business Configuration
 * Phase 5: Security Remediation - Externalize Hard-Coded Values
 *
 * Centralized configuration for business rules, commission rates, and thresholds.
 * Can be overridden via environment variables for different deployment environments.
 */

/**
 * Commission rates by VIP tier (percentage)
 */
export const CommissionRates = {
  default: 15,     // Default commission rate: 15%
  platinum: 20,    // Platinum clients: 20%
  gold: 18,        // Gold clients: 18%
  silver: 16,      // Silver clients: 16%
  bronze: 15,      // Bronze clients: 15%

  // Watch tier-based commission rates
  watchTiers: {
    tier1: 20,     // Ultra-luxury watches: 20%
    tier2: 18,     // High-end luxury: 18%
    tier3: 16,     // Premium watches: 16%
    tier4: 15,     // Entry luxury: 15%
    tier5: 12,     // Standard watches: 12%
  }
} as const

/**
 * VIP tier thresholds based on lifetime spend (USD)
 */
export const VipTierThresholds = {
  platinum: 100000,  // $100,000+
  gold: 50000,       // $50,000+
  silver: 25000,     // $25,000+
  bronze: 0,         // Below $25,000
} as const

/**
 * Watch tier thresholds based on retail price (USD)
 */
export const WatchTierThresholds = {
  tier1: 100000,  // Ultra-luxury: $100,000+
  tier2: 50000,   // High-end luxury: $50,000+
  tier3: 25000,   // Premium: $25,000+
  tier4: 10000,   // Entry luxury: $10,000+
  tier5: 0,       // Standard: Below $10,000
} as const

/**
 * Priority score calculation weights
 * Used for waitlist and allocation decisions
 */
export const PriorityWeights = {
  lifetimeSpend: 0.4,      // 40% weight on lifetime spend
  daysWaiting: 0.3,        // 30% weight on days waiting
  recentActivity: 0.2,     // 20% weight on recent engagement
  vipBonus: 0.1,           // 10% weight on VIP tier bonus
} as const

/**
 * Business rules and operational limits
 */
export const BusinessRules = {
  // Client management
  maxWishlistItems: 50,
  maxPreferredBrands: 20,
  maxNotesLength: 5000,

  // Purchase validation
  purchasePriceTolerance: 100,  // $100 tolerance for price validation
  minPurchaseAmount: 100,       // Minimum purchase: $100
  maxPurchaseAmount: 10000000,  // Maximum purchase: $10M

  // Waitlist management
  defaultReminderDays: 30,
  maxWaitlistDuration: 365,     // Maximum days on waitlist: 1 year
  priorityScoreMin: 0,
  priorityScoreMax: 100,

  // Import operations
  maxImportsPerHour: 5,
  maxImportRecords: 10000,
  importBatchSize: 100,

  // Search and pagination
  defaultPageSize: 50,
  maxPageSize: 100,
  minSearchLength: 2,

  // Session and security
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  lockoutDurationMinutes: 15,
} as const

/**
 * Get commission rate for a specific VIP tier
 *
 * @param vipTier - The client's VIP tier
 * @returns Commission rate as a percentage
 */
export function getCommissionRateForTier(vipTier?: string): number {
  if (!vipTier) {
    return getDefaultCommissionRate()
  }

  const tierLower = vipTier.toLowerCase()

  switch (tierLower) {
    case 'platinum':
      return CommissionRates.platinum
    case 'gold':
      return CommissionRates.gold
    case 'silver':
      return CommissionRates.silver
    case 'bronze':
      return CommissionRates.bronze
    default:
      return CommissionRates.default
  }
}

/**
 * Get commission rate for a watch tier
 *
 * @param watchTier - The watch tier (1-5)
 * @returns Commission rate as a percentage
 */
export function getCommissionRateForWatchTier(watchTier?: number): number {
  if (!watchTier || watchTier < 1 || watchTier > 5) {
    return CommissionRates.default
  }

  const tierKey = `tier${watchTier}` as keyof typeof CommissionRates.watchTiers
  return CommissionRates.watchTiers[tierKey] || CommissionRates.default
}

/**
 * Get default commission rate (can be overridden by environment variable)
 *
 * @returns Default commission rate as a percentage
 */
export function getDefaultCommissionRate(): number {
  if (process.env.DEFAULT_COMMISSION_RATE) {
    const rate = parseFloat(process.env.DEFAULT_COMMISSION_RATE)
    if (!isNaN(rate) && rate > 0 && rate <= 100) {
      return rate
    }
  }
  return CommissionRates.default
}

/**
 * Calculate VIP tier based on lifetime spend
 *
 * @param lifetimeSpend - Total lifetime spend in USD
 * @returns VIP tier name
 */
export function calculateVipTier(lifetimeSpend: number): 'Platinum' | 'Gold' | 'Silver' | 'Bronze' {
  if (lifetimeSpend >= VipTierThresholds.platinum) {
    return 'Platinum'
  } else if (lifetimeSpend >= VipTierThresholds.gold) {
    return 'Gold'
  } else if (lifetimeSpend >= VipTierThresholds.silver) {
    return 'Silver'
  } else {
    return 'Bronze'
  }
}

/**
 * Calculate watch tier based on retail price
 *
 * @param retailPrice - Watch retail price in USD
 * @returns Watch tier (1-5)
 */
export function calculateWatchTier(retailPrice: number): number {
  if (retailPrice >= WatchTierThresholds.tier1) {
    return 1
  } else if (retailPrice >= WatchTierThresholds.tier2) {
    return 2
  } else if (retailPrice >= WatchTierThresholds.tier3) {
    return 3
  } else if (retailPrice >= WatchTierThresholds.tier4) {
    return 4
  } else {
    return 5
  }
}

/**
 * Calculate priority score for waitlist allocation
 *
 * @param params - Priority calculation parameters
 * @returns Priority score (0-100)
 */
export function calculatePriorityScore(params: {
  lifetimeSpend: number
  daysWaiting: number
  recentActivity: number
  vipTier: string
}): number {
  // Normalize lifetime spend (cap at $500k for scoring purposes)
  const normalizedSpend = Math.min(params.lifetimeSpend / 500000, 1) * 100

  // Normalize days waiting (cap at 365 days)
  const normalizedDays = Math.min(params.daysWaiting / 365, 1) * 100

  // Recent activity is already 0-100

  // VIP tier bonus
  const vipBonus = (() => {
    switch (params.vipTier.toLowerCase()) {
      case 'platinum': return 100
      case 'gold': return 75
      case 'silver': return 50
      case 'bronze': return 25
      default: return 0
    }
  })()

  // Calculate weighted score
  const score =
    (normalizedSpend * PriorityWeights.lifetimeSpend) +
    (normalizedDays * PriorityWeights.daysWaiting) +
    (params.recentActivity * PriorityWeights.recentActivity) +
    (vipBonus * PriorityWeights.vipBonus)

  // Round to 2 decimal places and ensure within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100))
}

/**
 * Validate if a purchase price is within acceptable tolerance of inventory price
 *
 * @param purchasePrice - The purchase price
 * @param inventoryPrice - The expected inventory price
 * @returns boolean - True if within tolerance
 */
export function isPriceWithinTolerance(purchasePrice: number, inventoryPrice: number): boolean {
  const difference = Math.abs(purchasePrice - inventoryPrice)
  return difference <= BusinessRules.purchasePriceTolerance
}

/**
 * Get environment-specific configuration overrides
 * Allows for different settings in dev, staging, production
 */
export const EnvironmentConfig = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',

  // Override business rules in development for testing
  get maxImportsPerHour() {
    return this.isDevelopment ? 999 : BusinessRules.maxImportsPerHour
  },

  get sessionTimeoutMinutes() {
    return this.isDevelopment ? 480 : BusinessRules.sessionTimeoutMinutes // 8 hours in dev
  }
} as const

/**
 * Export a combined configuration object for convenience
 */
export const BusinessConfig = {
  commissionRates: CommissionRates,
  vipTiers: VipTierThresholds,
  watchTiers: WatchTierThresholds,
  priorityWeights: PriorityWeights,
  rules: BusinessRules,
  environment: EnvironmentConfig,

  // Helper functions
  getCommissionRate: getCommissionRateForTier,
  getWatchCommissionRate: getCommissionRateForWatchTier,
  getDefaultCommissionRate,
  calculateVipTier,
  calculateWatchTier,
  calculatePriorityScore,
  isPriceWithinTolerance,
} as const

export default BusinessConfig

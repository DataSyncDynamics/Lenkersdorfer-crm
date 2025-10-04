'use client'

import { StateCreator } from 'zustand'
import { GreenBoxMatch, GreenBoxStatus, ClientTier, WatchTier, Client, WatchModel, Purchase } from '@/types'
import { clientTierDefinitions } from '@/data/mockData'
import { ClientSlice } from './clientStore'
import { WatchSlice } from './watchStore'
import { WaitlistSlice } from './waitlistStore'

export interface PerfectMatchActions {
  calculateMatchStatus: (clientTier: ClientTier, watchTier: WatchTier, clientLifetimeSpend: number, watchPrice: number) => GreenBoxStatus
  getPerfectMatches: () => GreenBoxMatch[]
  getCriticalAlerts: () => GreenBoxMatch[]
  calculatePriorityScore: (client: Client, watch: WatchModel, daysWaiting: number) => number
  getClientTierInfo: (tier: ClientTier) => { name: string; description: string; color: string }
  isWatchAffordable: (clientLifetimeSpend: number, watchPrice: number) => boolean
  getAffordabilityStatus: (clientLifetimeSpend: number, watchPrice: number) => 'COMFORTABLE' | 'STRETCH' | 'OVERPRICED'
  calculateClientTier: (lifetimeSpend: number, purchases?: Purchase[]) => ClientTier
}

export type PerfectMatchSlice = PerfectMatchActions

export const createPerfectMatchSlice: StateCreator<
  PerfectMatchSlice & ClientSlice & WatchSlice & WaitlistSlice,
  [],
  [],
  PerfectMatchSlice
> = (set, get) => ({
  // Advanced affordability calculator based on realistic luxury watch buying patterns
  isWatchAffordable: (clientLifetimeSpend: number, watchPrice: number): boolean => {
    // Determine client tier first
    const tier = get().calculateClientTier(clientLifetimeSpend)

    // Realistic affordability ranges based on actual luxury watch market data
    const affordabilityMatrix = {
      1: { comfortable: [25000, 75000], stretch: [75000, 150000], max: 300000 }, // Ultra-High Net Worth
      2: { comfortable: [15000, 35000], stretch: [35000, 60000], max: 100000 },  // High Net Worth
      3: { comfortable: [8000, 18000], stretch: [18000, 30000], max: 45000 },    // Established Collectors
      4: { comfortable: [4000, 10000], stretch: [10000, 15000], max: 20000 },    // Growing Enthusiasts
      5: { comfortable: [1000, 5000], stretch: [5000, 8000], max: 12000 }        // Entry Level
    }

    const ranges = affordabilityMatrix[tier]

    // Strict affordability check - watch must be within max limit
    return watchPrice <= ranges.max
  },

  // Helper function to get affordability status
  getAffordabilityStatus: (clientLifetimeSpend: number, watchPrice: number): 'COMFORTABLE' | 'STRETCH' | 'OVERPRICED' => {
    const tier = get().calculateClientTier(clientLifetimeSpend)

    const affordabilityMatrix = {
      1: { comfortable: [25000, 75000], stretch: [75000, 150000], max: 300000 },
      2: { comfortable: [15000, 35000], stretch: [35000, 60000], max: 100000 },
      3: { comfortable: [8000, 18000], stretch: [18000, 30000], max: 45000 },
      4: { comfortable: [4000, 10000], stretch: [10000, 15000], max: 20000 },
      5: { comfortable: [1000, 5000], stretch: [5000, 8000], max: 12000 }
    }

    const ranges = affordabilityMatrix[tier]

    if (watchPrice >= ranges.comfortable[0] && watchPrice <= ranges.comfortable[1]) {
      return 'COMFORTABLE'
    } else if (watchPrice >= ranges.stretch[0] && watchPrice <= ranges.stretch[1]) {
      return 'STRETCH'
    } else {
      return 'OVERPRICED'
    }
  },

  // Calculate accurate client tier based on spending patterns
  calculateClientTier: (lifetimeSpend: number, purchases: Purchase[] = []): ClientTier => {
    // Calculate average order value if purchases exist
    const avgOrderValue = purchases.length > 0
      ? purchases.reduce((sum, p) => sum + p.price, 0) / purchases.length
      : lifetimeSpend / 3 // Conservative estimate if no purchase history

    // Tier 1: Ultra-High Net Worth ($250K+ lifetime, $50K+ avg orders)
    if (lifetimeSpend >= 250000 && avgOrderValue >= 50000) return 1

    // Tier 2: High Net Worth ($100K+ lifetime, $25K+ avg orders)
    if (lifetimeSpend >= 100000 && avgOrderValue >= 25000) return 2

    // Tier 3: Established Collectors ($50K+ lifetime, $15K+ avg orders)
    if (lifetimeSpend >= 50000 && avgOrderValue >= 15000) return 3

    // Tier 4: Growing Enthusiasts ($20K+ lifetime, $8K+ avg orders)
    if (lifetimeSpend >= 20000 && avgOrderValue >= 8000) return 4

    // Tier 5: Entry Level (Under $20K lifetime)
    return 5
  },

  // GREEN BOX Functions - Advanced matching logic with strict business rules
  calculateMatchStatus: (clientTier: ClientTier, watchTier: WatchTier, clientLifetimeSpend: number, watchPrice: number): GreenBoxStatus => {
    const { isWatchAffordable, getAffordabilityStatus, calculateClientTier } = get()

    // CRITICAL: Re-calculate client tier based on actual spend (ignore mock data tiers)
    const realClientTier = calculateClientTier(clientLifetimeSpend)

    // First check: Strict affordability - if not affordable, it's automatically RED
    if (!isWatchAffordable(clientLifetimeSpend, watchPrice)) {
      return 'RED'
    }

    const affordabilityStatus = getAffordabilityStatus(clientLifetimeSpend, watchPrice)

    // GREEN: Perfect Match Criteria
    if (realClientTier <= watchTier && affordabilityStatus === 'COMFORTABLE') {
      return 'GREEN' // Client tier qualified + price in comfort zone
    }

    // YELLOW: Possible Match Scenarios
    if (realClientTier <= watchTier && affordabilityStatus === 'STRETCH') {
      return 'YELLOW' // Qualified tier but price is a stretch
    }

    if (realClientTier < watchTier && affordabilityStatus === 'COMFORTABLE') {
      return 'YELLOW' // Upgrade opportunity - client tier is higher than watch tier
    }

    // RED: No Match - Everything else
    return 'RED' // Client tier too low OR price overpriced OR both
  },

  getPerfectMatches: (): GreenBoxMatch[] => {
    const { clients, watchModels, waitlist, calculateMatchStatus, calculatePriorityScore } = get()

    const matches: GreenBoxMatch[] = waitlist.map(entry => {
      const client = clients.find(c => c.id === entry.clientId)
      const watch = watchModels.find(w => w.id === entry.watchModelId)

      if (!client || !watch) {
        return null
      }

      const daysWaiting = Math.floor(
        (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
      )

      const status = calculateMatchStatus(client.clientTier, watch.watchTier, client.lifetimeSpend, watch.price)
      const priorityScore = calculatePriorityScore(client, watch, daysWaiting)

      let urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      let callToAction: string

      const { isWatchAffordable, getAffordabilityStatus, calculateClientTier } = get()
      const affordable = isWatchAffordable(client.lifetimeSpend, watch.price)
      const affordabilityStatus = getAffordabilityStatus(client.lifetimeSpend, watch.price)
      const realClientTier = calculateClientTier(client.lifetimeSpend, client.purchases)

      if (status === 'GREEN') {
        if (realClientTier === 1 && watch.watchTier === 1) {
          urgencyLevel = 'CRITICAL'
          callToAction = `IMMEDIATE ALLOCATION - Ultra-high net worth client ($${(client.lifetimeSpend/1000).toFixed(0)}K) + Tier 1 watch = Maximum revenue potential`
        } else if (realClientTier === 2 && watch.watchTier <= 2) {
          urgencyLevel = 'HIGH'
          callToAction = `Priority allocation - High net worth client ($${(client.lifetimeSpend/1000).toFixed(0)}K) + Price in comfort zone`
        } else {
          urgencyLevel = 'MEDIUM'
          callToAction = `Perfect Match - Client qualified + price comfortable. Strong conversion probability`
        }
      } else if (status === 'YELLOW') {
        if (affordabilityStatus === 'STRETCH') {
          urgencyLevel = 'MEDIUM'
          callToAction = `Stretch Purchase - Price at limit for Tier ${realClientTier} client. Build value proposition`
        } else {
          urgencyLevel = 'MEDIUM'
          callToAction = `Upgrade Opportunity - Suggest Tier ${realClientTier} equivalent: better fit for spending pattern`
        }
      } else {
        // RED status
        if (!affordable) {
          urgencyLevel = 'LOW'
          const maxPrice = realClientTier === 1 ? 300000 : realClientTier === 2 ? 100000 : realClientTier === 3 ? 45000 : realClientTier === 4 ? 20000 : 12000
          callToAction = `PRICE MISMATCH - Client max: $${maxPrice.toLocaleString()} | Watch: $${watch.price.toLocaleString()}. Focus on tier-appropriate watches`
        } else {
          urgencyLevel = 'LOW'
          callToAction = `TIER MISMATCH - Build relationship first. Client needs Tier ${realClientTier} spending pattern for Tier ${watch.watchTier} watches`
        }
      }

      return {
        id: `gb_${entry.id}`,
        clientId: client.id,
        watchModelId: watch.id,
        clientTier: client.clientTier,
        watchTier: watch.watchTier,
        status,
        priorityScore,
        urgencyLevel,
        daysWaiting,
        lifetimeSpend: client.lifetimeSpend,
        spendPercentile: client.spendPercentile,
        callToAction,
        dateCreated: entry.dateAdded
      }
    }).filter(Boolean) as GreenBoxMatch[]

    return matches.sort((a, b) => {
      // Sort by urgency level first, then by priority score
      const urgencyOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
      if (urgencyOrder[a.urgencyLevel] !== urgencyOrder[b.urgencyLevel]) {
        return urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel]
      }
      return b.priorityScore - a.priorityScore
    })
  },

  getCriticalAlerts: (): GreenBoxMatch[] => {
    const matches = get().getPerfectMatches()
    return matches.filter(match =>
      match.status === 'GREEN' &&
      (match.urgencyLevel === 'CRITICAL' || match.urgencyLevel === 'HIGH')
    )
  },

  calculatePriorityScore: (client: Client, watch: WatchModel, daysWaiting: number): number => {
    let score = 0

    const { isWatchAffordable, getAffordabilityStatus, calculateClientTier } = get()
    const affordable = isWatchAffordable(client.lifetimeSpend, watch.price)
    const affordabilityStatus = getAffordabilityStatus(client.lifetimeSpend, watch.price)
    const realClientTier = calculateClientTier(client.lifetimeSpend, client.purchases)

    // AFFORDABILITY SCORING (40% of total score - most important)
    if (affordabilityStatus === 'COMFORTABLE') {
      score += 40 // Perfect price fit
    } else if (affordabilityStatus === 'STRETCH') {
      score += 20 // Possible but risky
    } else {
      score -= 30 // Overpriced = major penalty
    }

    // TIER MATCHING SCORING (30% of total score)
    if (realClientTier === watch.watchTier && affordable) {
      score += 30 // Perfect tier + affordability match
    } else if (realClientTier < watch.watchTier && affordable) {
      score += 20 // Upgrade opportunity
    } else if (realClientTier > watch.watchTier) {
      score += 10 // Client overqualified - still good
    } else {
      score -= 20 // Tier mismatch penalty
    }

    // PURCHASE HISTORY ANALYSIS (20% of total score)
    const avgPurchase = client.purchases.length > 0
      ? client.purchases.reduce((sum, p) => sum + p.price, 0) / client.purchases.length
      : 0

    const priceRatio = avgPurchase > 0 ? watch.price / avgPurchase : 0
    if (priceRatio >= 0.5 && priceRatio <= 1.5) {
      score += 20 // Watch price aligns with purchase history
    } else if (priceRatio < 0.5) {
      score += 10 // Watch is cheaper than usual - easy sell
    } else {
      score -= 10 // Watch is much more expensive than usual
    }

    // WAIT TIME URGENCY (10% of total score)
    const waitTimeScore = Math.min(daysWaiting / 365, 1) * 10
    score += waitTimeScore

    // BRAND PREFERENCE (10% of total score)
    if (client.preferredBrands.includes(watch.brand)) {
      score += 10
    }

    // RECENT ACTIVITY BONUS (10% of total score)
    const daysSinceLastPurchase = client.lastPurchase
      ? Math.floor((new Date().getTime() - new Date(client.lastPurchase).getTime()) / (1000 * 60 * 60 * 24))
      : 999

    if (daysSinceLastPurchase < 90) {
      score += 10 // Recent buyer = hot lead
    } else if (daysSinceLastPurchase < 180) {
      score += 5 // Moderately recent
    }

    return Math.round(Math.max(score, 0) * 100) / 100 // Don't allow negative scores
  },

  getClientTierInfo: (tier: ClientTier) => {
    const tierInfo = clientTierDefinitions.find(t => t.tier === tier)
    return {
      name: tierInfo?.name || 'Unknown',
      description: tierInfo?.description || 'Unknown tier',
      color: tierInfo?.color || 'bg-gray-100 text-gray-800'
    }
  }
})
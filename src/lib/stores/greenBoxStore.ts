'use client'

import { StateCreator } from 'zustand'
import { GreenBoxMatch, GreenBoxStatus, ClientTier, WatchTier, Client, WatchModel } from '@/types'
import { clientTierDefinitions } from '@/data/mockData'
import { ClientSlice } from './clientStore'
import { WatchSlice } from './watchStore'
import { WaitlistSlice } from './waitlistStore'

export interface GreenBoxActions {
  calculateGreenBoxStatus: (clientTier: ClientTier, watchTier: WatchTier, clientLifetimeSpend: number, watchPrice: number) => GreenBoxStatus
  getGreenBoxMatches: () => GreenBoxMatch[]
  getCriticalGreenBoxAlerts: () => GreenBoxMatch[]
  calculatePriorityScore: (client: Client, watch: WatchModel, daysWaiting: number) => number
  getClientTierInfo: (tier: ClientTier) => { name: string; description: string; color: string }
  isWatchAffordable: (clientLifetimeSpend: number, watchPrice: number) => boolean
}

export type GreenBoxSlice = GreenBoxActions

export const createGreenBoxSlice: StateCreator<
  GreenBoxSlice & ClientSlice & WatchSlice & WaitlistSlice,
  [],
  [],
  GreenBoxSlice
> = (set, get) => ({
  // Helper function to check if a watch is affordable based on lifetime spend
  isWatchAffordable: (clientLifetimeSpend: number, watchPrice: number): boolean => {
    // Use a conservative approach: watch price should not exceed 2-3x their typical spending pattern
    // Based on lifetime spend, estimate their comfort zone for a single purchase
    const avgPurchaseSize = clientLifetimeSpend * 0.15 // Assume 15% of lifetime spend is comfortable for a single purchase
    const maxStretchPurchase = clientLifetimeSpend * 0.35 // Maximum stretch purchase (35% of lifetime spend)

    return watchPrice <= maxStretchPurchase
  },

  // GREEN BOX Functions
  calculateGreenBoxStatus: (clientTier: ClientTier, watchTier: WatchTier, clientLifetimeSpend: number, watchPrice: number): GreenBoxStatus => {
    const { isWatchAffordable } = get()

    // First check affordability - if not affordable, it's automatically RED
    if (!isWatchAffordable(clientLifetimeSpend, watchPrice)) {
      return 'RED'
    }

    // Then check tier matching
    if (clientTier === watchTier) return 'GREEN' // Perfect match
    if (clientTier < watchTier) return 'YELLOW' // Client tier is higher than watch tier (e.g., Tier 1 client wants Tier 3 watch - upgrade opportunity)
    return 'RED' // Client tier is lower than watch tier (e.g., Tier 5 client wants Tier 1 watch - tier too low)
  },

  getGreenBoxMatches: (): GreenBoxMatch[] => {
    const { clients, watchModels, waitlist, calculateGreenBoxStatus, calculatePriorityScore } = get()

    const matches: GreenBoxMatch[] = waitlist.map(entry => {
      const client = clients.find(c => c.id === entry.clientId)
      const watch = watchModels.find(w => w.id === entry.watchModelId)

      if (!client || !watch) {
        return null
      }

      const daysWaiting = Math.floor(
        (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
      )

      const status = calculateGreenBoxStatus(client.clientTier, watch.watchTier, client.lifetimeSpend, watch.price)
      const priorityScore = calculatePriorityScore(client, watch, daysWaiting)

      let urgencyLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      let callToAction: string

      const { isWatchAffordable } = get()
      const affordable = isWatchAffordable(client.lifetimeSpend, watch.price)

      if (status === 'GREEN' && affordable) {
        if (client.clientTier === 1 && watch.watchTier === 1) {
          urgencyLevel = 'CRITICAL'
          callToAction = 'IMMEDIATE ALLOCATION - Perfect tier + price match, maximum revenue opportunity'
        } else if (client.clientTier === 2 && watch.watchTier === 2) {
          urgencyLevel = 'HIGH'
          callToAction = 'Priority allocation - Perfect tier + price match, strong conversion potential'
        } else {
          urgencyLevel = 'MEDIUM'
          callToAction = 'Schedule allocation - Tier + price match ensures satisfaction'
        }
      } else if (status === 'YELLOW' && affordable) {
        urgencyLevel = 'MEDIUM'
        callToAction = `Upgrade opportunity - Suggest Tier ${client.clientTier} watch instead`
      } else if (!affordable) {
        urgencyLevel = 'LOW'
        const suggestedPrice = Math.round(client.lifetimeSpend * 0.35)
        callToAction = `Price too high - Suggest watches under $${suggestedPrice.toLocaleString()} based on spending pattern`
      } else {
        urgencyLevel = 'LOW'
        callToAction = 'Build relationship - Client needs higher spend tier for this watch'
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

  getCriticalGreenBoxAlerts: (): GreenBoxMatch[] => {
    const matches = get().getGreenBoxMatches()
    return matches.filter(match =>
      match.status === 'GREEN' &&
      (match.urgencyLevel === 'CRITICAL' || match.urgencyLevel === 'HIGH')
    )
  },

  calculatePriorityScore: (client: Client, watch: WatchModel, daysWaiting: number): number => {
    let score = 0

    const { isWatchAffordable } = get()
    const affordable = isWatchAffordable(client.lifetimeSpend, watch.price)

    // Affordability check is critical (30% of total score)
    if (affordable) {
      score += 30
    } else {
      // If not affordable, significantly reduce the score
      score -= 20
    }

    // Tier match bonus (30% of total score)
    if (client.clientTier === watch.watchTier && affordable) {
      score += 30
    } else if (client.clientTier < watch.watchTier && affordable) {
      score += 15 // YELLOW - some points for upgrade opportunity if affordable
    }

    // Lifetime spend scoring (30% of total score)
    score += (client.spendPercentile / 100) * 30

    // Wait time scoring (20% of total score)
    const waitTimeScore = Math.min(daysWaiting / 365, 1) * 20 // Max 1 year = full points
    score += waitTimeScore

    // Brand preference scoring (10% of total score)
    if (client.preferredBrands.includes(watch.brand)) {
      score += 10
    }

    return Math.round(score * 100) / 100
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
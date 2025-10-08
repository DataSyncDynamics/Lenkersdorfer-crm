'use client'

import { StateCreator } from 'zustand'
import { WaitlistEntry, AllocationSuggestion } from '@/types'
import { mockWaitlist } from '@/data/mockData'
import { ClientSlice } from './clientStore'
import { WatchSlice } from './watchStore'

export interface WaitlistState {
  waitlist: WaitlistEntry[]
}

export interface WaitlistActions {
  getWaitlistForClient: (clientId: string) => WaitlistEntry[]
  getWaitlistForWatch: (watchId: string) => WaitlistEntry[]
  generateAllocationSuggestions: (watchId: string) => AllocationSuggestion[]
  addToWaitlist: (clientId: string, watchId: string, notes?: string) => void
  removeFromWaitlist: (entryId: string) => void
  calculateEntryMatchScore: (clientId: string, watchId: string, dateAdded: string) => number
}

export type WaitlistSlice = WaitlistState & WaitlistActions

// Helper function to calculate match quality score for a waitlist entry
const calculateMatchScore = (
  client: any,
  watch: any,
  daysWaiting: number
): { score: number; reasons: string[] } => {
  let score = 0
  const reasons: string[] = []

  // VIP tier scoring
  switch (client.vipTier) {
    case 'Platinum':
      score += 40
      reasons.push('Platinum VIP status')
      break
    case 'Gold':
      score += 30
      reasons.push('Gold VIP status')
      break
    case 'Silver':
      score += 20
      reasons.push('Silver VIP status')
      break
    case 'Bronze':
      score += 10
      reasons.push('Bronze VIP status')
      break
  }

  // Lifetime spend scoring
  if (client.lifetimeSpend > 550000) {
    score += 30
    reasons.push('High lifetime value ($550K+)')
  } else if (client.lifetimeSpend > 220000) {
    score += 20
    reasons.push('Significant lifetime value ($220K+)')
  } else if (client.lifetimeSpend > 110000) {
    score += 10
    reasons.push('Good lifetime value ($110K+)')
  }

  // Wait time scoring
  if (daysWaiting > 90) {
    score += 15
    reasons.push(`Waiting ${daysWaiting} days`)
  } else if (daysWaiting > 60) {
    score += 10
    reasons.push(`Waiting ${daysWaiting} days`)
  } else if (daysWaiting > 30) {
    score += 5
    reasons.push(`Waiting ${daysWaiting} days`)
  }

  // Brand preference scoring
  if (client.preferredBrands.includes(watch.brand)) {
    score += 15
    reasons.push(`Prefers ${watch.brand}`)
  }

  return { score, reasons }
}

export const createWaitlistSlice: StateCreator<
  WaitlistSlice & ClientSlice & WatchSlice,
  [],
  [],
  WaitlistSlice
> = (set, get) => ({
  // Initial state
  waitlist: mockWaitlist,

  // Actions
  getWaitlistForClient: (clientId: string) => {
    const { waitlist } = get()
    return waitlist.filter(entry => entry.clientId === clientId)
  },

  getWaitlistForWatch: (watchId: string) => {
    const { waitlist } = get()
    return waitlist.filter(entry => entry.watchModelId === watchId)
      .sort((a, b) => new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime())
  },

  generateAllocationSuggestions: (watchId: string) => {
    const { clients, waitlist, getWatchModelById } = get()
    const watch = getWatchModelById(watchId)
    if (!watch) return []

    const waitlistEntries = waitlist.filter(entry => entry.watchModelId === watchId)

    const suggestions: AllocationSuggestion[] = waitlistEntries.map(entry => {
      const client = clients.find(c => c.id === entry.clientId)
      if (!client) return { clientId: entry.clientId, score: 0, reasons: [] }

      const daysWaiting = Math.floor(
        (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
      )

      const { score, reasons } = calculateMatchScore(client, watch, daysWaiting)

      return { clientId: client.id, score, reasons }
    })

    return suggestions.sort((a, b) => b.score - a.score)
  },

  addToWaitlist: (clientId: string, watchId: string, notes = '') => {
    set(state => ({
      waitlist: [...state.waitlist, {
        id: `wl_${Date.now()}`,
        clientId,
        watchModelId: watchId,
        dateAdded: new Date().toISOString().split('T')[0],
        priority: 1,
        notes
      }]
    }))
  },

  removeFromWaitlist: (entryId: string) => {
    set(state => ({
      waitlist: state.waitlist.filter(entry => entry.id !== entryId)
    }))
  },

  calculateEntryMatchScore: (clientId: string, watchId: string, dateAdded: string) => {
    const { getClientById, getWatchModelById } = get()
    const client = getClientById(clientId)
    const watch = getWatchModelById(watchId)

    if (!client || !watch) return 0

    const daysWaiting = Math.floor(
      (new Date().getTime() - new Date(dateAdded).getTime()) / (1000 * 60 * 60 * 24)
    )

    const { score } = calculateMatchScore(client, watch, daysWaiting)
    return score
  }
})
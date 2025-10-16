'use client'

import { StateCreator } from 'zustand'
import { AllocationContact, ContactAttempt, SMSTemplate } from '@/types'
import { ClientSlice } from './clientStore'
import { WatchSlice } from './watchStore'
import { WaitlistSlice } from './waitlistStore'

export interface AllocationState {
  allocationContacts: AllocationContact[]
  contactAttempts: ContactAttempt[]
  smsTemplates: SMSTemplate[]
}

export interface AllocationActions {
  generateAllocationContacts: (watchId: string, showAllClients?: boolean) => AllocationContact[]
  allocateWatchToClient: (alertId: string, contactMethod?: 'SMS' | 'CALL' | 'EMAIL') => void
  markContactAttempt: (clientId: string, watchId: string, method: 'SMS' | 'CALL' | 'EMAIL', message?: string, successful?: boolean, notes?: string) => void
  completeSale: (clientId: string, watchId: string) => void
  getSMSTemplates: (type?: 'ALLOCATION' | 'FOLLOWUP' | 'CUSTOM') => SMSTemplate[]
  generateSMSMessage: (templateId: string, clientName: string, watchBrand: string, watchModel: string) => string
  getContactHistory: (clientId: string, watchId: string) => ContactAttempt[]
  // New business logic functions
  calculateClientCapacity: (client: any) => { maxSingle: number; avgOrder: number }
  getBusinessRecommendation: (client: any, watch: any, daysWaiting?: number) => {
    category: string
    label: string
    priority: number
    action: string
    reasoning: string
    confidence: string
  }
}

export type AllocationSlice = AllocationState & AllocationActions

export const createAllocationSlice: StateCreator<
  AllocationSlice & ClientSlice & WatchSlice & WaitlistSlice,
  [],
  [],
  AllocationSlice
> = (set, get) => ({
  // Initial state
  allocationContacts: [],
  contactAttempts: [],
  smsTemplates: [
    {
      id: 'allocation_available',
      name: 'Watch Available',
      message: 'Hi {clientName}! Your {watchBrand} {watchModel} is now available. Call us immediately to secure your purchase!',
      type: 'ALLOCATION'
    },
    {
      id: 'followup_waiting',
      name: 'Long Wait Follow-up',
      message: 'Hi {clientName}, checking in on your interest in the {watchBrand} {watchModel}. Any updates on your timeline?',
      type: 'FOLLOWUP'
    },
    {
      id: 'priority_match',
      name: 'Priority Match',
      message: '{clientName}, we have a perfect match for you! Your {watchBrand} {watchModel} just arrived. Contact us ASAP!',
      type: 'ALLOCATION'
    }
  ],

  // Helper function to calculate client's purchasing capacity
  calculateClientCapacity: (client: any) => {
    const purchases = client.purchases || []
    if (purchases.length === 0) return { maxSingle: client.lifetimeSpend, avgOrder: client.lifetimeSpend }

    const maxSingle = Math.max(...purchases.map((p: any) => p.price))
    const avgOrder = purchases.reduce((sum: number, p: any) => sum + p.price, 0) / purchases.length

    return { maxSingle, avgOrder }
  },

  // Business logic for allocation suitability
  getBusinessRecommendation: (client: any, watch: any, daysWaiting: number = 0) => {
    const capacity = get().calculateClientCapacity(client)
    const watchPrice = watch.price
    let baseCategory: string
    let baseLabel: string
    let basePriority: number
    let baseAction: string
    let baseReasoning: string
    let baseConfidence: string

    // First, determine base recommendation from price/capacity matching
    if (watchPrice <= capacity.avgOrder * 1.2) {
      baseCategory = 'PERFECT_MATCH'
      baseLabel = 'PERFECT MATCH'
      basePriority = 1
      baseAction = 'CALL NOW - Ready to purchase'
      baseReasoning = `Within comfort zone: Watch $${watchPrice.toLocaleString()} ≤ $${Math.round(capacity.avgOrder * 1.2).toLocaleString()} (1.2x avg order)`
      baseConfidence = 'HIGH'
    } else if (watchPrice <= Math.max(capacity.avgOrder * 1.5, capacity.maxSingle)) {
      baseCategory = 'STRETCH_PURCHASE'
      baseLabel = 'STRETCH PURCHASE'
      basePriority = 2
      baseAction = 'DISCUSS FINANCING - Client can stretch with motivation'
      baseReasoning = `Stretch territory: Watch $${watchPrice.toLocaleString()} vs avg order $${Math.round(capacity.avgOrder).toLocaleString()}`
      baseConfidence = 'MEDIUM'
    } else if (client.lifetimeSpend > 50000 && watchPrice <= capacity.avgOrder * 3) {
      baseCategory = 'UPGRADE_OPPORTUNITY'
      baseLabel = 'UPGRADE OPPORTUNITY'
      basePriority = 3
      baseAction = `SUGGEST ALTERNATIVES - Recommend $${Math.round(capacity.avgOrder * 0.8).toLocaleString()}-$${Math.round(capacity.avgOrder * 1.5).toLocaleString()} range`
      baseReasoning = `Build relationship: Current capacity $${Math.round(capacity.avgOrder).toLocaleString()}, watch $${watchPrice.toLocaleString()}`
      baseConfidence = 'LOW'
    } else {
      baseCategory = 'NOT_SUITABLE'
      baseLabel = 'NOT SUITABLE'
      basePriority = 4
      baseAction = `FOCUS ELSEWHERE - Client needs $${Math.round(capacity.avgOrder * 0.8).toLocaleString()}-$${Math.round(capacity.avgOrder * 1.2).toLocaleString()} range`
      baseReasoning = `Outside capacity: Watch $${watchPrice.toLocaleString()} >> client avg $${Math.round(capacity.avgOrder).toLocaleString()}`
      baseConfidence = 'NONE'
    }

    // Apply waitlist overrides - if client has been waiting, they're serious
    if (daysWaiting >= 540) {
      // 540+ days (18 months) waiting = EXCEPTIONAL commitment, upgrade to PERFECT_MATCH
      if (baseCategory === 'NOT_SUITABLE' || baseCategory === 'UPGRADE_OPPORTUNITY' || baseCategory === 'STRETCH_PURCHASE') {
        return {
          category: 'PERFECT_MATCH',
          label: 'PERFECT MATCH',
          priority: 1,
          action: 'CALL NOW - 18+ months waitlist proves exceptional commitment',
          reasoning: `🔥 WAITLIST PRIORITY: ${daysWaiting} days (${Math.round(daysWaiting / 30)} months) waiting! ${baseReasoning}`,
          confidence: 'HIGH'
        }
      }
    } else if (daysWaiting >= 180) {
      // 180+ days (6 months) waiting = upgrade by one level
      if (baseCategory === 'NOT_SUITABLE' || baseCategory === 'UPGRADE_OPPORTUNITY') {
        const monthsWaiting = Math.round(daysWaiting / 30)
        let commitmentLevel = ''

        if (daysWaiting >= 360) {
          // 12-17 months
          commitmentLevel = `${monthsWaiting}+ months proves exceptional patience and commitment`
        } else if (daysWaiting >= 270) {
          // 9-11 months
          commitmentLevel = `${monthsWaiting}+ months shows serious dedication despite price`
        } else {
          // 6-8 months
          commitmentLevel = `${monthsWaiting}+ months shows commitment despite price`
        }

        return {
          category: 'STRETCH_PURCHASE',
          label: 'STRETCH PURCHASE',
          priority: 2,
          action: `DISCUSS - ${commitmentLevel}`,
          reasoning: `⏰ ${daysWaiting} days (${monthsWaiting} months) waiting. ${baseReasoning}`,
          confidence: 'MEDIUM'
        }
      }
    }

    // VIP override - Platinum/Gold clients on waitlist get priority
    if (daysWaiting > 0 && (client.vipTier === 'Platinum' || client.vipTier === 'Gold')) {
      if (baseCategory === 'NOT_SUITABLE') {
        return {
          category: 'STRETCH_PURCHASE',
          label: 'STRETCH PURCHASE',
          priority: 2,
          action: `DISCUSS - ${client.vipTier} VIP on waitlist deserves attention`,
          reasoning: `👑 ${client.vipTier} VIP waiting ${daysWaiting} days. ${baseReasoning}`,
          confidence: 'MEDIUM'
        }
      }
    }

    // Return base recommendation if no overrides applied
    return {
      category: baseCategory,
      label: baseLabel,
      priority: basePriority,
      action: baseAction,
      reasoning: baseReasoning,
      confidence: baseConfidence
    }
  },

  // Actions
  generateAllocationContacts: (watchId: string, showAllClients: boolean = false): AllocationContact[] => {
    const { clients, waitlist, getWatchModelById, getBusinessRecommendation } = get()
    const watch = getWatchModelById(watchId)
    if (!watch) return []

    const waitlistEntries = waitlist.filter(entry => entry.watchModelId === watchId)
    const waitlistClientIds = new Set(waitlistEntries.map(e => e.clientId))

    // Determine which clients to show
    let clientsToEvaluate: Array<{ client: any, waitlistEntry?: any }> = []

    // CRITICAL: For available watches, we can show all clients OR just waitlist
    // For non-available watches (Waitlist/Sold Out), ONLY show waitlist entries
    if (watch.availability === 'Available') {
      if (showAllClients) {
        // Show ALL clients BUT filter out NOT_SUITABLE unless they're on the waitlist
        clientsToEvaluate = clients.map(client => ({
          client,
          waitlistEntry: waitlistEntries.find(e => e.clientId === client.id),
          recommendation: getBusinessRecommendation(client, watch)
        }))
        .filter(item => {
          // Always show if on waitlist (even if NOT_SUITABLE - show as warning)
          if (item.waitlistEntry) return true

          // For non-waitlist clients, only show GREEN (PERFECT_MATCH) and YELLOW (STRETCH_PURCHASE)
          return item.recommendation.category === 'PERFECT_MATCH' ||
                 item.recommendation.category === 'STRETCH_PURCHASE'
        })
      } else {
        // Show only waitlist clients even though watch is available
        clientsToEvaluate = waitlistEntries.map(entry => ({
          client: clients.find(c => c.id === entry.clientId)!,
          waitlistEntry: entry
        })).filter(item => item.client)
      }
    } else {
      // For waitlist/reserved/sold out watches, ONLY show clients actually waiting
      // IGNORE showAllClients flag completely
      clientsToEvaluate = waitlistEntries.map(entry => ({
        client: clients.find(c => c.id === entry.clientId)!,
        waitlistEntry: entry
      })).filter(item => item.client)
    }

    const contacts: AllocationContact[] = clientsToEvaluate.map((item, index) => {
      const { client, waitlistEntry } = item
      if (!client) return null

      // Calculate days waiting for context
      const daysWaiting = waitlistEntry
        ? Math.floor((new Date().getTime() - new Date(waitlistEntry.dateAdded).getTime()) / (1000 * 60 * 60 * 24))
        : 0

      // Get business recommendation with waitlist context
      const recommendation = getBusinessRecommendation(client, watch, daysWaiting)

      // Build contextual reasons
      const reasons: string[] = [
        `${client.lifetimeSpend >= 100000 ? 'High-value' : 'Entry-level'} client ($${client.lifetimeSpend.toLocaleString()} lifetime)`,
      ]

      if (waitlistEntry) {
        reasons.push(`Waiting ${daysWaiting} days`)
      } else {
        reasons.push('Not on waitlist - potential opportunity')
      }

      if (client.preferredBrands.includes(watch.brand)) {
        reasons.push(`Prefers ${watch.brand}`)
      }

      // Check tier matching (GREEN BOX)
      const tierMatch = client.clientTier === watch.watchTier
      if (tierMatch) {
        reasons.push('🎯 GREEN BOX - Perfect tier match')
      }

      return {
        id: `allocation_${waitlistEntry?.id || client.id}`,
        clientId: client.id,
        watchModelId: watchId,
        rank: index + 1, // Will be reordered by priority
        score: 100 - recommendation.priority * 20, // Convert to legacy score for compatibility
        reasons,
        contacted: false,
        saleCompleted: false,
        // New business fields
        businessCategory: recommendation.category,
        businessLabel: recommendation.label,
        businessAction: recommendation.action,
        businessReasoning: recommendation.reasoning,
        businessConfidence: recommendation.confidence,
        daysWaiting,
        isOnWaitlist: !!waitlistEntry
      }
    }).filter(Boolean) as AllocationContact[]

    // Sort by business priority (1 = highest), tier match, and days waiting
    return contacts
      .sort((a, b) => {
        // First: Prioritize waitlist clients for non-available watches
        if (watch.availability !== 'Available') {
          if (a.isOnWaitlist && !b.isOnWaitlist) return -1
          if (!a.isOnWaitlist && b.isOnWaitlist) return 1
        }

        // Second: Sort by business priority
        const priorityA = a.businessCategory === 'PERFECT_MATCH' ? 1 :
                         a.businessCategory === 'STRETCH_PURCHASE' ? 2 :
                         a.businessCategory === 'UPGRADE_OPPORTUNITY' ? 3 : 4
        const priorityB = b.businessCategory === 'PERFECT_MATCH' ? 1 :
                         b.businessCategory === 'STRETCH_PURCHASE' ? 2 :
                         b.businessCategory === 'UPGRADE_OPPORTUNITY' ? 3 : 4

        if (priorityA !== priorityB) {
          return priorityA - priorityB
        }

        // Third: Prioritize those on waitlist
        if (a.isOnWaitlist && !b.isOnWaitlist) return -1
        if (!a.isOnWaitlist && b.isOnWaitlist) return 1

        // Fourth: Sort by days waiting (descending)
        return (b.daysWaiting || 0) - (a.daysWaiting || 0)
      })
      .map((contact, index) => ({ ...contact, rank: index + 1 }))
  },

  allocateWatchToClient: (alertId: string, contactMethod: 'SMS' | 'CALL' | 'EMAIL' = 'SMS') => {
    const { allocationContacts, waitlist } = get()
    const allocation = allocationContacts.find(a => a.id === alertId)
    if (!allocation) return

    // Remove client from waitlist - find the correct waitlist entry
    const waitlistEntry = waitlist.find(
      entry => entry.clientId === allocation.clientId && entry.watchModelId === allocation.watchModelId
    )
    if (waitlistEntry) {
      get().removeFromWaitlist(waitlistEntry.id)
    }

    // Mark allocation as contacted
    set(state => ({
      allocationContacts: state.allocationContacts.map(a =>
        a.id === alertId
          ? { ...a, contacted: true, contactMethod, contactTimestamp: new Date().toISOString() }
          : a
      )
    }))

    // Create contact attempt record
    get().markContactAttempt(
      allocation.clientId,
      allocation.watchModelId,
      contactMethod,
      `Priority allocation contact via ${contactMethod}`,
      true,
      'Automated allocation contact'
    )
  },

  markContactAttempt: (
    clientId: string,
    watchId: string,
    method: 'SMS' | 'CALL' | 'EMAIL',
    message = '',
    successful = true,
    notes = ''
  ) => {
    const attempt: ContactAttempt = {
      id: `contact_${Date.now()}`,
      clientId,
      watchModelId: watchId,
      method,
      message,
      timestamp: new Date().toISOString(),
      successful,
      notes
    }

    set(state => ({
      contactAttempts: [...state.contactAttempts, attempt]
    }))
  },

  completeSale: (clientId: string, watchId: string) => {
    // Mark allocation as sale completed
    set(state => ({
      allocationContacts: state.allocationContacts.map(a =>
        a.clientId === clientId && a.watchModelId === watchId
          ? { ...a, saleCompleted: true, completedAt: new Date().toISOString() }
          : a
      )
    }))

    // Remove client from ALL waitlists for this watch model
    set(state => ({
      waitlist: state.waitlist.filter(entry =>
        !(entry.clientId === clientId && entry.watchModelId === watchId)
      )
    }))

    // Log the sale completion
    get().markContactAttempt(
      clientId,
      watchId,
      'CALL',
      'Sale completed successfully',
      true,
      'Client purchased the watch'
    )
  },

  getSMSTemplates: (type?: 'ALLOCATION' | 'FOLLOWUP' | 'CUSTOM') => {
    const { smsTemplates } = get()
    if (!type) return smsTemplates
    return smsTemplates.filter(template => template.type === type)
  },

  generateSMSMessage: (templateId: string, clientName: string, watchBrand: string, watchModel: string) => {
    const { smsTemplates } = get()
    const template = smsTemplates.find(t => t.id === templateId)
    if (!template) return ''

    return template.message
      .replace(/{clientName}/g, clientName)
      .replace(/{watchBrand}/g, watchBrand)
      .replace(/{watchModel}/g, watchModel)
  },

  getContactHistory: (clientId: string, watchId: string) => {
    const { contactAttempts } = get()
    return contactAttempts
      .filter(attempt => attempt.clientId === clientId && attempt.watchModelId === watchId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }
})
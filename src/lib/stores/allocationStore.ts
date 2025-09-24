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
  generateAllocationContacts: (watchId: string) => AllocationContact[]
  allocateWatchToClient: (alertId: string, contactMethod?: 'SMS' | 'CALL' | 'EMAIL') => void
  markContactAttempt: (clientId: string, watchId: string, method: 'SMS' | 'CALL' | 'EMAIL', message?: string, successful?: boolean, notes?: string) => void
  completeSale: (clientId: string, watchId: string) => void
  getSMSTemplates: (type?: 'ALLOCATION' | 'FOLLOWUP' | 'CUSTOM') => SMSTemplate[]
  generateSMSMessage: (templateId: string, clientName: string, watchBrand: string, watchModel: string) => string
  getContactHistory: (clientId: string, watchId: string) => ContactAttempt[]
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

  // Actions
  generateAllocationContacts: (watchId: string): AllocationContact[] => {
    const { clients, waitlist, getWatchModelById } = get()
    const watch = getWatchModelById(watchId)
    if (!watch) return []

    const waitlistEntries = waitlist.filter(entry => entry.watchModelId === watchId)

    const contacts: AllocationContact[] = waitlistEntries.map((entry, index) => {
      const client = clients.find(c => c.id === entry.clientId)
      if (!client) return null

      let score = 0
      const reasons: string[] = []

      // Client tier scoring (1 = highest tier, 5 = lowest)
      score += (6 - client.clientTier) * 20
      reasons.push(`Tier ${client.clientTier} client`)

      // Lifetime spend scoring
      if (client.lifetimeSpend > 550000) {
        score += 30
        reasons.push('Ultra-high lifetime value ($550K+)')
      } else if (client.lifetimeSpend > 220000) {
        score += 20
        reasons.push('High lifetime value ($220K+)')
      } else if (client.lifetimeSpend > 110000) {
        score += 10
        reasons.push('Good lifetime value ($110K+)')
      }

      // Wait time scoring
      const daysWaiting = Math.floor(
        (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
      )
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

      return {
        id: `allocation_${entry.id}`,
        clientId: client.id,
        watchModelId: watchId,
        rank: index + 1, // Will be reordered by score
        score,
        reasons,
        contacted: false,
        saleCompleted: false
      }
    }).filter(Boolean) as AllocationContact[]

    // Sort by score (highest first) and update ranks
    return contacts
      .sort((a, b) => b.score - a.score)
      .map((contact, index) => ({ ...contact, rank: index + 1 }))
  },

  allocateWatchToClient: (alertId: string, contactMethod: 'SMS' | 'CALL' | 'EMAIL' = 'SMS') => {
    const { allocationContacts } = get()
    const allocation = allocationContacts.find(a => a.id === alertId)
    if (!allocation) return

    // Remove client from waitlist
    get().removeFromWaitlist(allocation.watchModelId)

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
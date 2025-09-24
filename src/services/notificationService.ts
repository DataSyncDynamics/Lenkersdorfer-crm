import type { UrgentNotification, NotificationCategory, NotificationUrgency } from '@/components/notifications/UrgentNotificationDashboard'
import type { Client, WaitlistEntry, Allocation, VipTier } from '@/types'

// Threshold constants for notification triggers
const NOTIFICATION_THRESHOLDS = {
  HOT_LEAD_COOLING_DAYS: 7,
  VIP_WAITING_PRIORITY_DAYS: 30,
  FOLLOW_UP_DUE_DAYS: 90,
  CRITICAL_WAITING_DAYS: 60,
} as const

// VIP tier priorities for GREEN BOX matching
const VIP_TIER_PRIORITY: Record<VipTier, number> = {
  'Platinum': 4,
  'Gold': 3,
  'Silver': 2,
  'Bronze': 1,
}

interface NotificationServiceData {
  clients: Client[]
  waitlistEntries: WaitlistEntry[]
  allocations: Allocation[]
  recentContacts: Record<string, Date>
  newArrivals: Array<{
    id: string
    brand: string
    model: string
    arrivalDate: Date
    potentialMatches: number
  }>
}

export class NotificationService {
  private data: NotificationServiceData

  constructor(data: NotificationServiceData) {
    this.data = data
  }

  /**
   * Generate all urgent notifications based on current CRM data
   */
  generateNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    // 1. GREEN BOX Perfect Matches (CRITICAL)
    notifications.push(...this.generateGreenBoxNotifications())

    // 2. VIP Clients Waiting Too Long (HIGH)
    notifications.push(...this.generateVIPWaitingNotifications())

    // 3. Hot Leads Cooling Off (HIGH/MEDIUM)
    notifications.push(...this.generateHotLeadNotifications())

    // 4. New Watch Arrivals Needing Allocation (MEDIUM)
    notifications.push(...this.generateNewArrivalNotifications())

    // 5. Follow-ups Due (MEDIUM)
    notifications.push(...this.generateFollowUpNotifications())

    // 6. Scheduled Callbacks (MEDIUM)
    notifications.push(...this.generateCallbackNotifications())

    // Sort by urgency and creation time
    return notifications.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 }
      if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
        return urgencyOrder[b.urgency] - urgencyOrder[a.urgency]
      }
      return b.createdAt.getTime() - a.createdAt.getTime()
    })
  }

  /**
   * Generate GREEN BOX perfect match notifications
   */
  private generateGreenBoxNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    // Find waitlist entries where client tier matches available watch tier
    this.data.waitlistEntries.forEach(entry => {
      const client = this.data.clients.find(c => c.id === entry.client_id)
      if (!client || !entry.is_active) return

      // Check if there's a new arrival that matches this client's preference
      const matchingArrival = this.data.newArrivals.find(arrival =>
        arrival.brand.toLowerCase() === entry.brand.toLowerCase() &&
        arrival.model.toLowerCase().includes(entry.model.toLowerCase().split(' ')[0])
      )

      if (matchingArrival && this.isGreenBoxMatch(client, entry)) {
        const daysWaiting = Math.floor(
          (Date.now() - new Date(entry.wait_start_date).getTime()) / (1000 * 60 * 60 * 24)
        )

        notifications.push({
          id: `greenbox-${entry.id}-${Date.now()}`,
          category: 'GREEN_BOX',
          urgency: 'CRITICAL',
          title: 'Perfect GREEN BOX Match!',
          message: `${client.name} (${client.vip_tier}) has exact tier match for new ${entry.brand} ${entry.model}`,
          clientName: client.name,
          clientId: client.id,
          watchBrand: entry.brand,
          watchModel: entry.model,
          daysWaiting,
          actions: [
            {
              type: 'CALL',
              label: 'Call Now',
              isPrimary: true,
              phoneNumber: client.phone
            },
            {
              type: 'ALLOCATE',
              label: 'Allocate Watch',
              allocationData: { clientId: client.id, watchId: matchingArrival.id }
            },
            {
              type: 'VIEW_CLIENT',
              label: 'View Client',
              clientId: client.id
            }
          ],
          createdAt: new Date(),
          isRead: false
        })
      }
    })

    return notifications
  }

  /**
   * Generate VIP waiting too long notifications
   */
  private generateVIPWaitingNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    this.data.waitlistEntries.forEach(entry => {
      const client = this.data.clients.find(c => c.id === entry.client_id)
      if (!client || !entry.is_active) return

      const daysWaiting = Math.floor(
        (Date.now() - new Date(entry.wait_start_date).getTime()) / (1000 * 60 * 60 * 24)
      )

      // VIP clients waiting more than threshold
      if ((client.vip_tier === 'Platinum' || client.vip_tier === 'Gold') &&
          daysWaiting > NOTIFICATION_THRESHOLDS.VIP_WAITING_PRIORITY_DAYS) {

        const urgency: NotificationUrgency =
          client.vip_tier === 'Platinum' && daysWaiting > NOTIFICATION_THRESHOLDS.CRITICAL_WAITING_DAYS
            ? 'CRITICAL'
            : 'HIGH'

        notifications.push({
          id: `vip-waiting-${entry.id}-${Date.now()}`,
          category: 'VIP_WAITING',
          urgency,
          title: `${client.vip_tier} Client Waiting`,
          message: `${client.name} (${client.vip_tier}) waiting ${daysWaiting} days for ${entry.brand} ${entry.model}`,
          clientName: client.name,
          clientId: client.id,
          watchBrand: entry.brand,
          watchModel: entry.model,
          daysWaiting,
          actions: [
            {
              type: 'CALL',
              label: 'Call Now',
              isPrimary: true,
              phoneNumber: client.phone
            },
            {
              type: 'SCHEDULE',
              label: 'Priority Meeting'
            },
            {
              type: 'VIEW_CLIENT',
              label: 'View Client',
              clientId: client.id
            }
          ],
          createdAt: new Date(),
          isRead: false
        })
      }
    })

    return notifications
  }

  /**
   * Generate hot leads cooling off notifications
   */
  private generateHotLeadNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    this.data.clients.forEach(client => {
      const lastContact = this.data.recentContacts[client.id]
      if (!lastContact) return

      const daysSinceContact = Math.floor(
        (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
      )

      if (daysSinceContact >= NOTIFICATION_THRESHOLDS.HOT_LEAD_COOLING_DAYS) {
        const urgency: NotificationUrgency =
          daysSinceContact > 14 ? 'HIGH' : 'MEDIUM'

        notifications.push({
          id: `hot-lead-${client.id}-${Date.now()}`,
          category: 'HOT_LEADS',
          urgency,
          title: 'Hot Lead Cooling Off',
          message: `${client.name} (${client.vip_tier}) - No contact in ${daysSinceContact} days`,
          clientName: client.name,
          clientId: client.id,
          lastContact: `${daysSinceContact} days ago`,
          actions: [
            {
              type: 'CALL',
              label: 'Call Now',
              isPrimary: true,
              phoneNumber: client.phone
            },
            {
              type: 'SCHEDULE',
              label: 'Schedule Follow-up'
            },
            {
              type: 'MARK_CONTACTED',
              label: 'Mark Contacted'
            }
          ],
          createdAt: new Date(),
          isRead: false
        })
      }
    })

    return notifications
  }

  /**
   * Generate new arrival allocation notifications
   */
  private generateNewArrivalNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    this.data.newArrivals.forEach(arrival => {
      if (arrival.potentialMatches > 0) {
        notifications.push({
          id: `new-arrival-${arrival.id}-${Date.now()}`,
          category: 'NEW_ARRIVALS',
          urgency: 'MEDIUM',
          title: 'New Arrival Needs Allocation',
          message: `${arrival.brand} ${arrival.model} just arrived - ${arrival.potentialMatches} waitlist candidates`,
          watchBrand: arrival.brand,
          watchModel: arrival.model,
          actions: [
            {
              type: 'ALLOCATE',
              label: 'View Candidates',
              isPrimary: true,
              allocationData: { watchId: arrival.id }
            },
            {
              type: 'DISMISS',
              label: 'Later'
            }
          ],
          createdAt: new Date(),
          isRead: false
        })
      }
    })

    return notifications
  }

  /**
   * Generate follow-up due notifications
   */
  private generateFollowUpNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    // Find clients who need 90-day follow-ups
    const clientsNeedingFollowUp = this.data.clients.filter(client => {
      const lastContact = this.data.recentContacts[client.id]
      if (!lastContact) return false

      const daysSinceContact = Math.floor(
        (Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24)
      )

      return daysSinceContact >= NOTIFICATION_THRESHOLDS.FOLLOW_UP_DUE_DAYS
    })

    if (clientsNeedingFollowUp.length > 0) {
      notifications.push({
        id: `follow-ups-${Date.now()}`,
        category: 'FOLLOW_UPS',
        urgency: 'MEDIUM',
        title: '3-Month Follow-ups Due',
        message: `${clientsNeedingFollowUp.length} clients need 90-day check-ins`,
        actions: [
          {
            type: 'VIEW_CLIENT',
            label: 'View List',
            isPrimary: true
          },
          {
            type: 'SCHEDULE',
            label: 'Batch Schedule'
          }
        ],
        createdAt: new Date(),
        isRead: false
      })
    }

    return notifications
  }

  /**
   * Generate callback notifications
   */
  private generateCallbackNotifications(): UrgentNotification[] {
    const notifications: UrgentNotification[] = []

    // This would typically pull from a callbacks/appointments table
    // For now, we'll create a sample notification
    const today = new Date()
    const scheduledCallbacks = [] // Would be fetched from database

    if (scheduledCallbacks.length > 0) {
      notifications.push({
        id: `callbacks-${Date.now()}`,
        category: 'CALLBACKS',
        urgency: 'MEDIUM',
        title: 'Scheduled Callbacks Due',
        message: `${scheduledCallbacks.length} callbacks scheduled for today`,
        actions: [
          {
            type: 'CALL',
            label: 'Start Calls',
            isPrimary: true
          },
          {
            type: 'SCHEDULE',
            label: 'Reschedule'
          }
        ],
        createdAt: new Date(),
        isRead: false
      })
    }

    return notifications
  }

  /**
   * Check if a client/waitlist entry represents a GREEN BOX match
   */
  private isGreenBoxMatch(client: Client, entry: WaitlistEntry): boolean {
    // GREEN BOX logic: client tier should match watch category/tier
    // This is simplified - in real app, you'd have more complex matching logic
    const clientPriority = VIP_TIER_PRIORITY[client.vip_tier]
    const entryPriority = entry.priority_score

    // Perfect match if priorities align and client has been waiting
    return Math.abs(clientPriority - (entryPriority / 25)) < 1 // Allow some variance
  }

  /**
   * Update notification data for real-time updates
   */
  updateData(newData: Partial<NotificationServiceData>): void {
    this.data = { ...this.data, ...newData }
  }
}

/**
 * Factory function to create notification service with current data
 */
export function createNotificationService(data: NotificationServiceData): NotificationService {
  return new NotificationService(data)
}

/**
 * Utility to format time ago for notifications
 */
export function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffDays > 0) {
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
  } else {
    return 'Just now'
  }
}
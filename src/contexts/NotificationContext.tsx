'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import type { UrgentNotification, NotificationCategory } from '@/components/notifications/UrgentNotificationDashboard'

interface NotificationContextType {
  notifications: UrgentNotification[]
  addNotification: (notification: Omit<UrgentNotification, 'id' | 'createdAt' | 'isRead'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
  refreshReminders: () => Promise<void>
  getCounts: () => {
    total: number
    byCategory: Record<NotificationCategory, number>
    critical: number
    high: number
    medium: number
    low: number
  }
  getNotificationsByCategory: (category: NotificationCategory) => UrgentNotification[]
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

// Start with empty notifications - real notifications will be generated based on actual CRM data
const initialNotifications: UrgentNotification[] = []

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<UrgentNotification[]>(initialNotifications)
  const { session, loading } = useAuth()

  // Load due reminders from API and convert to notifications
  const refreshReminders = async () => {
    // Double-check auth before making API call
    if (!session) {
      console.log('[NotificationContext] Skipping refresh - no session')
      return
    }

    try {
      const response = await fetch('/api/reminders?filter=due')
      if (!response.ok) {
        // Don't log 401s as errors - they're expected during auth transitions
        if (response.status !== 401) {
          console.error('[NotificationContext] Failed to fetch reminders:', response.status)
        }
        return
      }

      const reminders = await response.json()

      // Convert reminders to notifications
      const reminderNotifications: UrgentNotification[] = await Promise.all(
        reminders.map(async (reminder: any) => {
          // Fetch client info
          let clientName = 'Unknown Client'
          try {
            const clientResponse = await fetch(`/api/clients/${reminder.client_id}`)
            if (clientResponse.ok) {
              const client = await clientResponse.json()
              clientName = client.name
            }
          } catch {}

          // Determine urgency based on how overdue
          const reminderDate = new Date(reminder.reminder_date)
          const now = new Date()
          const diffHours = Math.floor((now.getTime() - reminderDate.getTime()) / (1000 * 60 * 60))

          let urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM'
          if (diffHours > 24) urgency = 'CRITICAL'
          else if (diffHours > 6) urgency = 'HIGH'

          return {
            id: `reminder-${reminder.id}`,
            category: 'FOLLOW-UPS' as NotificationCategory,
            urgency,
            title: `${reminder.reminder_type === 'follow-up' ? 'Follow-Up' : reminder.reminder_type === 'call-back' ? 'Call Back' : reminder.reminder_type === 'meeting' ? 'Meeting' : 'Reminder'} Due`,
            message: reminder.notes || `${reminder.reminder_type} reminder for ${clientName}`,
            clientName,
            clientId: reminder.client_id,
            actions: [
              {
                type: 'CALL',
                label: 'Call Now',
                isPrimary: true,
                phoneNumber: '' // Would need to fetch from client
              },
              {
                type: 'MARK_CONTACTED',
                label: 'Complete',
              },
              {
                type: 'VIEW_CLIENT',
                label: 'View Client',
                clientId: reminder.client_id
              }
            ],
            createdAt: new Date(reminder.created_at),
            isRead: false,
            data: { reminderId: reminder.id }
          }
        })
      )

      // Remove old reminder notifications and add new ones
      setNotifications(prev => {
        const nonReminderNotifications = prev.filter(n => !n.id.startsWith('reminder-'))
        return [...nonReminderNotifications, ...reminderNotifications]
      })
    } catch (error) {
      console.error('[NotificationContext] Error loading reminders:', error)
    }
  }

  // Load reminders only when authenticated
  useEffect(() => {
    // Don't do anything while auth is loading
    if (loading) {
      console.log('[NotificationContext] Waiting for auth to load...')
      return
    }

    // Clear notifications if user logged out
    if (!session) {
      console.log('[NotificationContext] No session - clearing notifications')
      setNotifications([])
      return
    }

    // User is authenticated - load reminders and set up interval
    console.log('[NotificationContext] Session detected - loading reminders')
    refreshReminders()

    // Set up refresh interval (only runs while this effect is active)
    const interval = setInterval(() => {
      console.log('[NotificationContext] Interval tick - refreshing reminders')
      refreshReminders()
    }, 60000) // Refresh every minute

    // Clean up interval when session changes or component unmounts
    return () => {
      console.log('[NotificationContext] Cleaning up interval')
      clearInterval(interval)
    }
  }, [session, loading]) // Re-run when session or loading state changes

  const addNotification = (notification: Omit<UrgentNotification, 'id' | 'createdAt' | 'isRead'>) => {
    const newNotification: UrgentNotification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      isRead: false
    }
    setNotifications(prev => [newNotification, ...prev])
  }

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, isRead: true }))
    )
  }

  const clearAll = () => {
    setNotifications([])
  }

  const getCounts = () => {
    // Show ALL notifications in badge (not just unread) for better visibility
    const total = notifications.length

    const byCategory = notifications.reduce((acc, notification) => {
      acc[notification.category] = (acc[notification.category] || 0) + 1
      return acc
    }, {} as Record<NotificationCategory, number>)

    // Ensure all categories are present
    const categories: NotificationCategory[] = ['URGENT', 'FOLLOW-UPS']
    categories.forEach(category => {
      if (!byCategory[category]) {
        byCategory[category] = 0
      }
    })

    // Count by urgency (all notifications, not just unread)
    const critical = notifications.filter(n => n.urgency === 'CRITICAL').length
    const high = notifications.filter(n => n.urgency === 'HIGH').length
    const medium = notifications.filter(n => n.urgency === 'MEDIUM').length
    const low = notifications.filter(n => n.urgency === 'LOW').length

    return {
      total,
      byCategory,
      critical,
      high,
      medium,
      low
    }
  }

  const getNotificationsByCategory = (category: NotificationCategory) => {
    return notifications.filter(notification => notification.category === category)
  }

  const value: NotificationContextType = {
    notifications,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    refreshReminders,
    getCounts,
    getNotificationsByCategory
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
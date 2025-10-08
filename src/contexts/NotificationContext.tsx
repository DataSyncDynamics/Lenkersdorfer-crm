'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { UrgentNotification, NotificationCategory } from '@/components/notifications/UrgentNotificationDashboard'

interface NotificationContextType {
  notifications: UrgentNotification[]
  addNotification: (notification: Omit<UrgentNotification, 'id' | 'createdAt' | 'isRead'>) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  clearAll: () => void
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

  // Real-time notification updates - disabled for now
  // In production, this would check for new notifications from an API
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     // Check for new notifications from API
  //   }, 60000)
  //   return () => clearInterval(interval)
  // }, [])

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
    const unreadNotifications = notifications.filter(n => !n.isRead)
    const total = unreadNotifications.length

    const byCategory = unreadNotifications.reduce((acc, notification) => {
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

    // Count by urgency
    const critical = unreadNotifications.filter(n => n.urgency === 'CRITICAL').length
    const high = unreadNotifications.filter(n => n.urgency === 'HIGH').length
    const medium = unreadNotifications.filter(n => n.urgency === 'MEDIUM').length
    const low = unreadNotifications.filter(n => n.urgency === 'LOW').length

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
    getCounts,
    getNotificationsByCategory
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
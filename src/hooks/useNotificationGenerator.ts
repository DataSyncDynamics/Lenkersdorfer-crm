'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { useNotifications } from '@/contexts/NotificationContext'
import type { UrgentNotification } from '@/components/notifications/UrgentNotificationDashboard'

/**
 * Hook to auto-generate URGENT and FOLLOW-UP notifications based on CRM data
 * Monitors Perfect Matches, Critical Alerts, and generates notifications automatically
 */
export function useNotificationGenerator() {
  const { getPerfectMatches, getCriticalAlerts, getClientById, getWatchModelById } = useAppStore()
  const { addNotification, notifications } = useNotifications()
  const processedMatchesRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    // Get current perfect matches and critical alerts
    const perfectMatches = getPerfectMatches()
    const criticalAlerts = getCriticalAlerts()

    // Process Perfect Matches - GREEN status matches
    perfectMatches
      .filter(match => match.status === 'GREEN')
      .forEach(match => {
        const notificationHash = `perfect-${match.clientId}-${match.watchModelId}`

        // Skip if already processed
        if (processedMatchesRef.current.has(notificationHash)) return

        const client = getClientById(match.clientId)
        const watch = getWatchModelById(match.watchModelId)

        if (!client || !watch) return

        // Determine urgency based on match urgency level
        const category: 'URGENT' | 'FOLLOW-UPS' =
          match.urgencyLevel === 'CRITICAL' || match.urgencyLevel === 'HIGH'
            ? 'URGENT'
            : 'FOLLOW-UPS'

        // Create notification
        const notification: Omit<UrgentNotification, 'id' | 'createdAt' | 'isRead'> = {
          category,
          title: match.urgencyLevel === 'CRITICAL'
            ? 'Perfect Match: Immediate Action Required'
            : 'Perfect Match Available',
          message: match.callToAction,
          clientName: client.name,
          clientId: client.id,
          watchBrand: watch.brand,
          watchModel: watch.model,
          daysWaiting: match.daysWaiting,
          lastContact: match.daysWaiting ? `${match.daysWaiting} days waiting` : undefined,
          actions: [
            {
              type: 'TEXT_CLIENT',
              label: 'Text Now',
              isPrimary: true,
              phoneNumber: client.phone,
              tier: client.clientTier
            },
            {
              type: 'CALL',
              label: 'Call',
              phoneNumber: client.phone,
              tier: client.clientTier
            },
            {
              type: 'VIEW_CLIENT',
              label: 'View Profile',
              clientId: client.id
            },
            {
              type: 'DISMISS',
              label: 'Dismiss'
            }
          ],
          data: {
            matchId: match.id,
            priorityScore: match.priorityScore,
            urgencyLevel: match.urgencyLevel
          }
        }

        addNotification(notification)
        processedMatchesRef.current.add(notificationHash)
      })

    // Process Critical Alerts - High urgency GREEN matches
    criticalAlerts.forEach(alert => {
      const notificationHash = `critical-${alert.clientId}-${alert.watchModelId}`

      // Skip if already processed
      if (processedMatchesRef.current.has(notificationHash)) return

      const client = getClientById(alert.clientId)
      const watch = getWatchModelById(alert.watchModelId)

      if (!client || !watch) return

      // Critical alerts are always URGENT
      const notification: Omit<UrgentNotification, 'id' | 'createdAt' | 'isRead'> = {
        category: 'URGENT',
        title: `Critical: ${client.vipTier || 'VIP'} Client Waiting`,
        message: `${client.name} - ${alert.callToAction}`,
        clientName: client.name,
        clientId: client.id,
        watchBrand: watch.brand,
        watchModel: watch.model,
        daysWaiting: alert.daysWaiting,
        lastContact: alert.daysWaiting ? `${alert.daysWaiting} days waiting` : undefined,
        actions: [
          {
            type: 'TEXT_CLIENT',
            label: 'Text Now',
            isPrimary: true,
            phoneNumber: client.phone,
            tier: client.clientTier
          },
          {
            type: 'CALL',
            label: 'Call',
            phoneNumber: client.phone,
            tier: client.clientTier
          },
          {
            type: 'VIEW_CLIENT',
            label: 'View Client',
            clientId: client.id
          },
          {
            type: 'DISMISS',
            label: 'Dismiss'
          }
        ],
        data: {
          matchId: alert.id,
          priorityScore: alert.priorityScore,
          urgencyLevel: alert.urgencyLevel
        }
      }

      addNotification(notification)
      processedMatchesRef.current.add(notificationHash)
    })

    // Clean up old hashes (keep only last 100 to prevent memory leak)
    if (processedMatchesRef.current.size > 100) {
      const array = Array.from(processedMatchesRef.current)
      processedMatchesRef.current = new Set(array.slice(-100))
    }

  }, [getPerfectMatches, getCriticalAlerts, getClientById, getWatchModelById, addNotification])

  // Return nothing - this hook just generates notifications in the background
  return null
}

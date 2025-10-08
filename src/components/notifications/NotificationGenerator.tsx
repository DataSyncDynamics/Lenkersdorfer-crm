'use client'

import { useNotificationGenerator } from '@/hooks/useNotificationGenerator'

/**
 * Client component that runs the notification generator hook
 * This should be placed in the app layout to run globally
 */
export function NotificationGenerator() {
  useNotificationGenerator()
  return null // This component doesn't render anything
}

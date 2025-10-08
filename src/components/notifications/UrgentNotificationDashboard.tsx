'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useNotifications } from '@/contexts/NotificationContext'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  XMarkIcon,
  PhoneIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InboxIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline'
import {
  BellIcon as BellSolid,
  StarIcon as StarSolid,
  FireIcon as FireSolid,
  ExclamationTriangleIcon as ExclamationSolid
} from '@heroicons/react/24/solid'

// Types for notifications - Simplified to URGENT and FOLLOW-UPS
export type NotificationCategory = 'URGENT' | 'FOLLOW-UPS'

export interface UrgentNotification {
  id: string
  category: NotificationCategory
  title: string
  message: string
  clientName?: string
  clientId?: string
  watchBrand?: string
  watchModel?: string
  daysWaiting?: number
  lastContact?: string
  followUpDate?: string
  actions: NotificationAction[]
  createdAt: Date
  expiresAt?: Date
  isRead: boolean
  data?: any
}

export interface NotificationAction {
  type: 'CALL' | 'ALLOCATE' | 'SCHEDULE' | 'FOLLOW_UP' | 'MARK_CONTACTED' | 'VIEW_CLIENT' | 'DISMISS' | 'TEXT_CLIENT'
  label: string
  icon?: React.ComponentType<{ className?: string }>
  isPrimary?: boolean
  phoneNumber?: string
  clientId?: string
  allocationData?: any
  tier?: number
}

interface UrgentNotificationDashboardProps {
  isOpen: boolean
  onClose: () => void
  onFollowUpRequest?: (notification: UrgentNotification) => void
  className?: string
}


const categoryConfig = {
  URGENT: {
    icon: FireSolid,
    color: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    borderColor: 'border-red-200 dark:border-red-800/50'
  },
  'FOLLOW-UPS': {
    icon: ClockIcon,
    color: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800/50'
  }
}


export default function UrgentNotificationDashboard({
  isOpen,
  onClose,
  onFollowUpRequest,
  className = ''
}: UrgentNotificationDashboardProps) {
  const router = useRouter()
  const { notifications, removeNotification, markAsRead, getCounts } = useNotifications()
  const [swipedNotification, setSwipedNotification] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<NotificationCategory>('URGENT')

  // Priority scoring function
  const getPriorityScore = (notification: UrgentNotification): number => {
    const isPerfectMatch = notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
    const urgencyLevel = notification.data?.urgencyLevel || 'MEDIUM'
    const daysWaiting = notification.daysWaiting || 0

    let score = 0

    // Perfect Match + CRITICAL = highest priority
    if (isPerfectMatch && urgencyLevel === 'CRITICAL') score = 1000
    // URGENT + CRITICAL
    else if (notification.category === 'URGENT' && urgencyLevel === 'CRITICAL') score = 900
    // Perfect Match + HIGH
    else if (isPerfectMatch && urgencyLevel === 'HIGH') score = 800
    // URGENT + HIGH
    else if (notification.category === 'URGENT' && urgencyLevel === 'HIGH') score = 700
    // Perfect Match (any other urgency)
    else if (isPerfectMatch) score = 600
    // URGENT (any other urgency)
    else if (notification.category === 'URGENT') score = 500
    // FOLLOW-UPS
    else if (notification.category === 'FOLLOW-UPS') score = 400
    // Default
    else score = 300

    // Add days waiting as secondary priority (more days = higher priority within same tier)
    score += Math.min(daysWaiting, 100)

    return score
  }

  // Filter notifications by active tab
  const filteredNotifications = notifications
    .filter(n => n.category === activeTab)
    .sort((a, b) => {
      const scoreA = getPriorityScore(a)
      const scoreB = getPriorityScore(b)

      if (scoreA !== scoreB) {
        return scoreB - scoreA // Higher score first
      }

      // If same score, sort by created date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime()
    })

  // Get counts from context
  const counts = getCounts()

  // Handle notification action
  const handleAction = useCallback((notificationId: string, action: NotificationAction) => {
    console.log('Handling action:', action.type, 'for notification:', notificationId)

    // Find the notification to get context
    const notification = notifications.find(n => n.id === notificationId)

    switch (action.type) {
      case 'CALL':
        if (action.phoneNumber) {
          window.location.href = `tel:${action.phoneNumber}`
        }
        break
      case 'TEXT_CLIENT':
        if (action.clientId) {
          router.push(`/messages?clientId=${action.clientId}`)
          onClose() // Close notification panel when navigating
        }
        break
      case 'DISMISS':
        removeNotification(notificationId)
        break
      case 'MARK_CONTACTED':
        markAsRead(notificationId)
        break
      case 'VIEW_CLIENT':
        if (action.clientId) {
          router.push(`/clients/${action.clientId}`)
          onClose() // Close notification panel when navigating
        }
        break
      case 'SCHEDULE':
      case 'FOLLOW_UP':
        // Open follow-up modal with notification context
        if (notification && onFollowUpRequest) {
          onFollowUpRequest(notification)
        }
        break
      // Add other action handlers as needed
    }
  }, [removeNotification, markAsRead, router, onClose, notifications, onFollowUpRequest])

  // Handle swipe gestures
  const handleSwipeLeft = useCallback((notificationId: string) => {
    setSwipedNotification(notificationId)
    setTimeout(() => {
      removeNotification(notificationId)
      setSwipedNotification(null)
    }, 300)
  }, [removeNotification])

  // Get total notification count
  const totalCount = counts.total

  // Lock body scroll when panel is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 z-50 ${className}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Notification Panel - Fixed positioning with vh units */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 h-[100vh] w-full max-w-md bg-white/95 dark:bg-black/30 backdrop-blur-xl border-l border-gray-200 dark:border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <BellSolid className="w-6 h-6 text-gold-400" />
              {totalCount > 0 && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {totalCount > 99 ? '99+' : totalCount}
                  </span>
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Notifications</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {totalCount} active notification{totalCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-all duration-200 touch-target"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex border-b border-gray-200 dark:border-white/10 bg-white/50 dark:bg-black/20">
          <button
            onClick={() => setActiveTab('URGENT')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'URGENT'
                ? 'text-red-600 dark:text-red-400 border-b-2 border-red-600 dark:border-red-400 bg-red-50 dark:bg-red-950/30'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <FireSolid className="h-4 w-4" />
              <span>Urgent</span>
              {counts.byCategory.URGENT > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {counts.byCategory.URGENT}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('FOLLOW-UPS')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-all duration-200 ${
              activeTab === 'FOLLOW-UPS'
                ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 bg-amber-50 dark:bg-amber-950/30'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <ClockIcon className="h-4 w-4" />
              <span>Follow-ups</span>
              {counts.byCategory['FOLLOW-UPS'] > 0 && (
                <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                  {counts.byCategory['FOLLOW-UPS']}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <AnimatePresence>
            {filteredNotifications.map((notification) => {
              const category = categoryConfig[notification.category]
              const CategoryIcon = category.icon

              return (
                <motion.div
                  key={notification.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95, x: -300 }}
                  drag="x"
                  dragConstraints={{ left: -100, right: 0 }}
                  dragElastic={0.2}
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -50) {
                      handleSwipeLeft(notification.id)
                    }
                  }}
                  className={`relative bg-gradient-to-r ${
                    notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
                      ? 'bg-green-50/30 dark:bg-green-950/20 border-green-200 dark:border-green-900/50'
                      : category.bgColor
                  } backdrop-blur-xl border ${
                    notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
                      ? 'border-green-200 dark:border-green-900/50'
                      : category.borderColor
                  } rounded-2xl p-4 ${
                    swipedNotification === notification.id ? 'opacity-50' : ''
                  } cursor-pointer group overflow-hidden`}
                >
                  {/* Category Indicator */}
                  <div className={`absolute top-4 left-4 w-1 h-16 ${
                    notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
                      ? 'bg-green-500'
                      : category.color.replace('text-', 'bg-')
                  } rounded-full`} />

                  {/* Content */}
                  <div className="pl-6 pr-2 min-w-0 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                        <CategoryIcon className={`w-4 h-4 ${
                          notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
                            ? 'text-green-600 dark:text-green-400'
                            : category.color
                        } flex-shrink-0`} />
                        <span className={`text-xs font-medium uppercase tracking-wide ${
                          notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
                            ? 'text-green-700 dark:text-green-400'
                            : category.color
                        } truncate`}>
                          {notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match')
                            ? 'PERFECT MATCH'
                            : notification.category.replace('_', ' ')}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-2 break-words line-clamp-2 overflow-hidden">
                      {notification.title.includes('PERFECT MATCH') || notification.title.includes('Perfect Match') ? (
                        <>
                          <span className="text-green-600 dark:text-green-400">PERFECT MATCH</span>
                          {notification.title.replace(/PERFECT MATCH|Perfect Match/g, '').trim() && (
                            <span> - {notification.title.replace(/PERFECT MATCH|Perfect Match/g, '').replace(/^-\s*/, '').trim()}</span>
                          )}
                        </>
                      ) : (
                        notification.title
                      )}
                    </h3>

                    {/* Message */}
                    <p className="text-gray-300 text-xs mb-3 leading-relaxed break-words line-clamp-3 overflow-hidden">
                      {notification.message}
                    </p>

                    {/* Metadata */}
                    {(notification.daysWaiting || notification.lastContact) && (
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-400">
                        {notification.daysWaiting && (
                          <div className="flex items-center space-x-1 whitespace-nowrap">
                            <ClockIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{notification.daysWaiting} days waiting</span>
                          </div>
                        )}
                        {notification.lastContact && (
                          <div className="flex items-center space-x-1 whitespace-nowrap">
                            <PhoneIcon className="w-4 h-4 flex-shrink-0" />
                            <span>Last contact: {notification.lastContact}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 overflow-hidden">
                      {notification.actions.slice(0, 2).map((action, index) => {
                        const ActionIcon = action.icon || ChevronRightIcon
                        const isTextClient = action.type === 'TEXT_CLIENT'
                        return (
                          <button
                            key={index}
                            onClick={() => handleAction(notification.id, action)}
                            className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap max-w-[120px] ${
                              action.isPrimary
                                ? 'bg-gold-400 text-black hover:bg-gold-500'
                                : isTextClient
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-white/10 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            <ActionIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate text-xs">{action.label}</span>
                          </button>
                        )
                      })}
                      {notification.actions.length > 2 && (
                        <button className="flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium bg-white/10 text-gray-300 hover:bg-white/20 transition-all duration-200 whitespace-nowrap">
                          <EllipsisHorizontalIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="text-xs">More</span>
                        </button>
                      )}
                    </div>

                    {/* Swipe Hint */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 mt-2">
                      <p className="text-xs text-gray-500">Swipe left to dismiss</p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <BellIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">No notifications</p>
              <p className="text-gray-500 text-xs mt-1">You're all caught up!</p>
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-white/10">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-red-700 dark:text-red-400 text-lg font-bold">{counts.byCategory.URGENT || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Urgent</div>
            </div>
            <div>
              <div className="text-amber-700 dark:text-amber-400 text-lg font-bold">{counts.byCategory['FOLLOW-UPS'] || 0}</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Follow-ups</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
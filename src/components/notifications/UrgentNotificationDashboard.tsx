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
  StarIcon,
  ExclamationTriangleIcon,
  FireIcon,
  InboxIcon,
  UserGroupIcon,
  CalendarDaysIcon,
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

// Types for notifications
export type NotificationCategory = 'ALLOCATION' | 'HOT_LEADS' | 'NEW_ARRIVALS' | 'FOLLOW_UPS' | 'VIP_WAITING' | 'CALLBACKS'

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
  type: 'CALL' | 'ALLOCATE' | 'SCHEDULE' | 'FOLLOW_UP' | 'MARK_CONTACTED' | 'VIEW_CLIENT' | 'DISMISS'
  label: string
  icon?: React.ComponentType<{ className?: string }>
  isPrimary?: boolean
  phoneNumber?: string
  clientId?: string
  allocationData?: any
}

interface UrgentNotificationDashboardProps {
  isOpen: boolean
  onClose: () => void
  onFollowUpRequest?: (notification: UrgentNotification) => void
  className?: string
}


const categoryConfig = {
  ALLOCATION: {
    icon: StarSolid,
    color: 'text-success-400',
    bgColor: 'bg-success-400/20',
    borderColor: 'border-success-400/30'
  },
  HOT_LEADS: {
    icon: FireSolid,
    color: 'text-orange-400',
    bgColor: 'bg-orange-400/20',
    borderColor: 'border-orange-400/30'
  },
  NEW_ARRIVALS: {
    icon: InboxIcon,
    color: 'text-blue-400',
    bgColor: 'bg-blue-400/20',
    borderColor: 'border-blue-400/30'
  },
  FOLLOW_UPS: {
    icon: ClockIcon,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-400/20',
    borderColor: 'border-yellow-400/30'
  },
  VIP_WAITING: {
    icon: StarIcon,
    color: 'text-gold-400',
    bgColor: 'bg-gold-400/20',
    borderColor: 'border-gold-400/30'
  },
  CALLBACKS: {
    icon: CalendarDaysIcon,
    color: 'text-purple-400',
    bgColor: 'bg-purple-400/20',
    borderColor: 'border-purple-400/30'
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

  // Show all notifications (no filtering)
  const filteredNotifications = notifications

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

      {/* Notification Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute right-0 top-0 h-full w-full max-w-md bg-black/30 backdrop-blur-xl border-l border-white/10 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
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
              <h2 className="text-lg font-bold text-white">Notifications</h2>
              <p className="text-xs text-gray-400">
                {totalCount} active notification{totalCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-200 touch-target"
          >
            <XMarkIcon className="w-6 h-6" />
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
                  className={`relative bg-gradient-to-r ${category.bgColor} backdrop-blur-xl border ${category.borderColor} rounded-2xl p-4 ${
                    swipedNotification === notification.id ? 'opacity-50' : ''
                  } cursor-pointer group overflow-hidden`}
                >
                  {/* Category Indicator */}
                  <div className={`absolute top-4 left-4 w-1 h-16 ${category.color.replace('text-', 'bg-')} rounded-full`} />

                  {/* Content */}
                  <div className="pl-6 pr-2 min-w-0 flex-1">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1 overflow-hidden">
                        <CategoryIcon className={`w-4 h-4 ${category.color} flex-shrink-0`} />
                        <span className={`text-xs font-medium uppercase tracking-wide ${category.color} truncate`}>
                          {notification.category.replace('_', ' ')}
                        </span>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0 ml-2" />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-white font-semibold text-sm mb-2 break-words line-clamp-2 overflow-hidden">
                      {notification.title}
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
                        return (
                          <button
                            key={index}
                            onClick={() => handleAction(notification.id, action)}
                            className={`flex items-center space-x-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all duration-200 whitespace-nowrap max-w-[120px] ${
                              action.isPrimary
                                ? 'bg-gold-400 text-black hover:bg-gold-500'
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
        <div className="p-4 border-t border-white/10">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-orange-400 text-lg font-bold">{counts.byCategory.HOT_LEADS || 0}</div>
              <div className="text-xs text-gray-400">Hot Leads</div>
            </div>
            <div>
              <div className="text-purple-400 text-lg font-bold">{counts.byCategory.VIP_WAITING || 0}</div>
              <div className="text-xs text-gray-400">VIP Waiting</div>
            </div>
            <div>
              <div className="text-success-400 text-lg font-bold">
                {counts.byCategory.ALLOCATION || 0}
              </div>
              <div className="text-xs text-gray-400">Allocation</div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
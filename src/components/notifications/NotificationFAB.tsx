'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellIcon,
  ExclamationTriangleIcon,
  FireIcon,
  StarIcon
} from '@heroicons/react/24/outline'
import {
  BellIcon as BellSolid,
  ExclamationTriangleIcon as ExclamationSolid,
  FireIcon as FireSolid,
  StarIcon as StarSolid
} from '@heroicons/react/24/solid'
import UrgentNotificationDashboard from './UrgentNotificationDashboard'
import { FollowUpModal } from './FollowUpModal'
import { useNotifications } from '@/contexts/NotificationContext'

interface NotificationFABProps {
  className?: string
}

export default function NotificationFAB({ className = '' }: NotificationFABProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [followUpModal, setFollowUpModal] = useState<{
    isOpen: boolean
    client?: any
    context?: any
  }>({ isOpen: false })
  const { getCounts } = useNotifications()
  const counts = getCounts()

  // Simple notification count
  const hasNotifications = counts.total > 0

  // Standard notification appearance
  const config = {
    bgGradient: 'from-gold-400 to-gold-600',
    shadowColor: 'shadow-gold-500/50',
    textColor: 'text-black'
  }
  const MainIcon = hasNotifications ? BellSolid : BellIcon

  // Handle follow-up modal opening
  const handleFollowUpRequest = (notification: any) => {
    setFollowUpModal({
      isOpen: true,
      client: {
        name: notification.clientName || 'Unknown Client',
        phone: '+1-555-0123', // In production, get from client record
        tier: Math.floor(Math.random() * 5) + 1, // In production, get from client record
        preferredBrands: ['Rolex', 'Omega'], // In production, get from client record
        lastContact: '3 days ago' // In production, get from client record
      },
      context: {
        alertType: notification.category,
        reason: notification.message,
        watchBrand: notification.watchBrand,
        watchModel: notification.watchModel,
        daysWaiting: notification.daysWaiting
      }
    })
  }

  // Handle follow-up action completion
  const handleFollowUpAction = (action: string, details: any) => {
    console.log('Follow-up action:', action, details)
    // In production, this would integrate with your SMS service, calendar API, etc.
    switch (action) {
      case 'call':
        // Open dialer or log call intent
        alert(`Calling ${details.phone}...`)
        break
      case 'sms':
        // Send SMS via service
        alert(`SMS sent to ${details.phone}: "${details.message}"`)
        break
      case 'schedule':
        // Create calendar event
        alert(`Appointment scheduled for ${details.customDateTime}`)
        break
    }
    setFollowUpModal({ isOpen: false })
  }

  return (
    <>
      {/* Notifications Bar */}
      <div className={`fixed top-4 right-4 z-40 ${className}`}>
        <AnimatePresence>
          {/* Simple hover preview */}
          {isExpanded && hasNotifications && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="mb-4"
            >
              <motion.div
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gold-500/90 backdrop-blur-xl rounded-xl p-3 shadow-lg border border-gold-400/30 min-w-[200px]"
              >
                <div className="flex items-center space-x-2">
                  <BellSolid className="w-5 h-5 text-white" />
                  <div>
                    <div className="text-white font-semibold text-sm">
                      {counts.total} Notification{counts.total !== 1 ? 's' : ''}
                    </div>
                    <div className="text-gold-100 text-xs">View all notifications</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main FAB */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          onHoverStart={() => setIsExpanded(true)}
          onHoverEnd={() => setIsExpanded(false)}
          className={`relative bg-gradient-to-r ${config.bgGradient} ${config.shadowColor} shadow-xl rounded-full w-16 h-16 flex items-center justify-center transition-all duration-300 touch-target`}
        >
          {/* Main Icon */}
          <MainIcon className={`w-8 h-8 ${config.textColor}`} />

          {/* Notification Badge */}
          {hasNotifications && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg"
            >
              <span className="text-black text-xs font-bold">
                {counts.total > 99 ? '99+' : counts.total}
              </span>
            </motion.div>
          )}
        </motion.button>

        {/* Touch Indicator for Mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 2 }}
          className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-400 whitespace-nowrap md:hidden"
        >
          Notifications
        </motion.div>
      </div>

      {/* Notification Dashboard */}
      <UrgentNotificationDashboard
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onFollowUpRequest={handleFollowUpRequest}
      />

      {/* Follow-up Modal */}
      {followUpModal.isOpen && followUpModal.client && followUpModal.context && (
        <FollowUpModal
          isOpen={followUpModal.isOpen}
          onClose={() => setFollowUpModal({ isOpen: false })}
          client={followUpModal.client}
          context={followUpModal.context}
          onFollowUpAction={handleFollowUpAction}
        />
      )}
    </>
  )
}
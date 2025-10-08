'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  Flame,
  Clock,
  X,
  Phone,
  MessageSquare,
  Info
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'
import { triggerHapticFeedback } from '@/lib/haptic-utils'
import { useAppStore } from '@/lib/store'

// Lazy load FollowUpModal
const FollowUpModal = dynamic(() => import('@/components/notifications/FollowUpModal').then(mod => ({ default: mod.FollowUpModal })), { ssr: false })

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const router = useRouter()
  const { notifications, getCounts, removeNotification } = useNotifications()
  const { getClientById, setSelectedClient } = useAppStore()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [showInfoTooltip, setShowInfoTooltip] = useState(false)
  const [followUpModal, setFollowUpModal] = useState<{
    isOpen: boolean
    client?: any
    context?: any
  }>({ isOpen: false })

  const counts = getCounts()

  const categoryIcons = {
    URGENT: Flame,
    'FOLLOW-UPS': Clock
  }

  const filteredNotifications = selectedCategory === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory)

  const handleFollowUpAction = (action: string, details: any) => {
    console.log('Follow-up action:', action, details)
    switch (action) {
      case 'call':
        alert(`Calling ${details.phone}...`)
        break
      case 'sms':
        alert(`SMS sent to ${details.phone}: "${details.message}"`)
        break
      case 'schedule':
        alert(`Appointment scheduled for ${details.slot}`)
        break
    }
  }

  const openFollowUpModal = (notification: any) => {
    setFollowUpModal({
      isOpen: true,
      client: {
        name: notification.clientName,
        phone: notification.actions?.find((a: any) => a.type === 'CALL')?.phoneNumber || '',
        tier: 1
      },
      context: {
        watch: `${notification.watchBrand} ${notification.watchModel}`,
        waitTime: notification.daysWaiting
      }
    })
  }

  const handleActionClick = (action: any, notification: any) => {
    triggerHapticFeedback('light')

    switch (action.type) {
      case 'CALL':
        if (action.phoneNumber) {
          window.location.href = `tel:${action.phoneNumber}`
        }
        break
      case 'TEXT_CLIENT':
        if (action.phoneNumber) {
          window.location.href = `sms:${action.phoneNumber}`
        }
        break
      case 'SCHEDULE':
        openFollowUpModal(notification)
        break
      case 'VIEW_CLIENT':
        if (action.clientId) {
          const client = getClientById(action.clientId)
          if (client) {
            setSelectedClient(client)
            router.push('/clients')
            onClose()
          }
        }
        break
      case 'DISMISS':
        removeNotification(notification.id)
        break
    }
  }

  const getCategoryColors = (category: string) => {
    switch (category) {
      case 'URGENT':
        return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
      case 'FOLLOW-UPS':
        return { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' }
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[450px] bg-background border-l border-border/10 shadow-2xl z-50 flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-border/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-yellow-500/10 p-2 rounded-lg">
                    <Bell className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-bold">Notifications</h2>
                      <button
                        onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Real-time alerts</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-accent"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              {/* Info Tooltip */}
              {showInfoTooltip && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mx-4 mt-4 p-4 bg-card/80 backdrop-blur-sm border border-border/20 rounded-lg space-y-3 relative"
                >
                  <button
                    onClick={() => setShowInfoTooltip(false)}
                    className="absolute top-2 right-2 text-muted-foreground/40 hover:text-muted-foreground/80 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="h-4 w-4 text-red-500" />
                      <h3 className="font-semibold text-sm">URGENT</h3>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Immediate revenue opportunities requiring action TODAY:
                    </p>
                    <ul className="text-xs text-muted-foreground ml-6 mt-1 space-y-0.5 list-disc list-inside">
                      <li>VIP clients (Gold/Platinum) waiting 60+ days</li>
                      <li>Perfect watch matches for high-value clients</li>
                      <li>Hot leads going cold (14+ days no contact)</li>
                    </ul>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <h3 className="font-semibold text-sm">FOLLOW-UPS</h3>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6">
                      Scheduled touchpoints and routine check-ins:
                    </p>
                    <ul className="text-xs text-muted-foreground ml-6 mt-1 space-y-0.5 list-disc list-inside">
                      <li>90-day client relationship maintenance</li>
                      <li>Scheduled callbacks/appointments</li>
                      <li>Medium-priority watch matches</li>
                    </ul>
                  </div>
                </motion.div>
              )}

              {/* Summary Cards */}
              <div className="p-4 grid grid-cols-3 gap-2 border-b border-border/20">
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/20">
                  <div className="flex flex-col items-center">
                    <Flame className="w-5 h-5 text-red-500 mb-1" />
                    <div className="text-red-500 text-xl font-bold">{counts.byCategory['URGENT'] || 0}</div>
                    <div className="text-foreground/60 text-xs font-medium">Urgent</div>
                    <div className="text-foreground/40 text-[10px] text-center mt-0.5">Act today</div>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/20">
                  <div className="flex flex-col items-center">
                    <Clock className="w-5 h-5 text-amber-500 mb-1" />
                    <div className="text-amber-500 text-xl font-bold">{counts.byCategory['FOLLOW-UPS'] || 0}</div>
                    <div className="text-foreground/60 text-xs font-medium">Follow-ups</div>
                    <div className="text-foreground/40 text-[10px] text-center mt-0.5">Scheduled</div>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm rounded-lg p-3 border border-border/20">
                  <div className="flex flex-col items-center">
                    <Bell className="w-5 h-5 text-blue-500 mb-1" />
                    <div className="text-blue-500 text-xl font-bold">{counts.total}</div>
                    <div className="text-foreground/60 text-xs font-medium">Total</div>
                    <div className="text-foreground/40 text-[10px] text-center mt-0.5">All alerts</div>
                  </div>
                </div>
              </div>

              {/* Filter */}
              <div className="p-4 border-b border-border/20">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                    <SelectItem value="FOLLOW-UPS">Follow-ups</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => {
                      const CategoryIcon = categoryIcons[notification.category]
                      const categoryColors = getCategoryColors(notification.category)

                      return (
                        <motion.div
                          key={notification.id}
                          layout
                          initial={{ opacity: 1, x: 0 }}
                          exit={{
                            opacity: 0,
                            x: 100,
                            transition: { duration: 0.2, ease: "easeOut" }
                          }}
                          className="border rounded-lg p-3 bg-card/30 backdrop-blur-sm hover:shadow-md transition-all duration-200"
                        >
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`${categoryColors.bg} p-2 rounded-lg flex-shrink-0`}>
                            <CategoryIcon className={`w-4 h-4 ${categoryColors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-sm flex-1">{notification.title}</h3>
                              <Badge className={cn("text-xs flex items-center gap-1 flex-shrink-0", categoryColors.bg, categoryColors.text, categoryColors.border)}>
                                {notification.category === 'FOLLOW-UPS' && '📅'}
                                {notification.category === 'FOLLOW-UPS' ? 'Follow-up' : notification.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-xs mb-2">{notification.message}</p>
                            {notification.clientName && (
                              <div className="text-xs text-muted-foreground">
                                {notification.clientName}
                                {notification.daysWaiting && ` • ${notification.daysWaiting} days`}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        {notification.actions && notification.actions.length > 0 && (
                          <div className="flex flex-wrap items-center justify-center gap-2">
                            {notification.actions.map((action: any, idx: number) => (
                              <Button
                                key={idx}
                                onClick={() => handleActionClick(action, notification)}
                                variant={action.isPrimary ? 'default' : 'outline'}
                                size="sm"
                                className="text-xs"
                              >
                                {action.type === 'CALL' && <Phone className="h-3 w-3 mr-1" />}
                                {action.type === 'TEXT_CLIENT' && <MessageSquare className="h-3 w-3 mr-1" />}
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        )}
                        </motion.div>
                      )
                    })
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Bell className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No notifications</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Follow-up Modal */}
      <FollowUpModal
        isOpen={followUpModal.isOpen}
        onClose={() => setFollowUpModal({ isOpen: false })}
        client={followUpModal.client}
        context={followUpModal.context}
        onAction={handleFollowUpAction}
      />
    </>
  )
}

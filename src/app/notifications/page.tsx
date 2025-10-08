'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion } from 'framer-motion'
import {
  Bell,
  AlertTriangle,
  Flame,
  Star,
  CheckCircle,
  Clock,
  Phone,
  Users,
  Inbox,
  Calendar,
  X
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { useNotifications } from '@/contexts/NotificationContext'
import { cn } from '@/lib/utils'
import { triggerHapticFeedback } from '@/lib/haptic-utils'

// Lazy load FollowUpModal
const FollowUpModal = dynamic(() => import('@/components/notifications/FollowUpModal').then(mod => ({ default: mod.FollowUpModal })), { ssr: false })

export default function NotificationsDemoPage() {
  const router = useRouter()
  const { notifications, getCounts, addNotification, removeNotification, markAllAsRead } = useNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [showStatsModal, setShowStatsModal] = useState<'URGENT' | 'FOLLOW-UPS' | 'ALL' | null>(null)
  const [followUpModal, setFollowUpModal] = useState<{
    isOpen: boolean
    client?: any
    context?: any
  }>({ isOpen: false })

  const counts = getCounts()

  // Add demo notifications on mount for testing
  useEffect(() => {
    // Only add demo notifications if there are no notifications
    if (notifications.length === 0) {
      // URGENT notification example
      addNotification({
        category: 'URGENT',
        title: 'Critical: Platinum Client Waiting 120+ Days',
        message: 'Sarah Chen has been waiting 127 days for Rolex Daytona. Immediate follow-up required.',
        clientName: 'Sarah Chen',
        clientId: 'client-1',
        watchBrand: 'Rolex',
        watchModel: 'Daytona',
        daysWaiting: 127,
        actions: [
          { type: 'TEXT_CLIENT', label: 'Text Now', isPrimary: true, phoneNumber: '+1-555-0123' },
          { type: 'CALL', label: 'Call', phoneNumber: '+1-555-0123' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-1' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      // URGENT notification example
      addNotification({
        category: 'URGENT',
        title: 'High-Value Client: Strong Buying Intent',
        message: 'Michael Rodriguez ($85K lifetime spend) is interested in Patek Philippe Nautilus. Recent purchase indicates immediate opportunity.',
        clientName: 'Michael Rodriguez',
        clientId: 'client-2',
        watchBrand: 'Patek Philippe',
        watchModel: 'Nautilus',
        daysWaiting: 45,
        actions: [
          { type: 'TEXT_CLIENT', label: 'Text Now', isPrimary: true, phoneNumber: '+1-555-0124' },
          { type: 'CALL', label: 'Call', phoneNumber: '+1-555-0124' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-2' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      // FOLLOW-UPS notification example
      addNotification({
        category: 'FOLLOW-UPS',
        title: '90-Day Check-in: David Martinez',
        message: 'Relationship maintenance touchpoint due. Last contact was 92 days ago. Client has $45K lifetime spend.',
        clientName: 'David Martinez',
        clientId: 'client-3',
        daysWaiting: 92,
        actions: [
          { type: 'TEXT_CLIENT', label: 'Text Now', isPrimary: true, phoneNumber: '+1-555-0125' },
          { type: 'CALL', label: 'Call', phoneNumber: '+1-555-0125' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-3' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      addNotification({
        category: 'FOLLOW-UPS',
        title: 'Scheduled Callback: Lisa Wang',
        message: 'Appointment reminder for 2:30 PM today. Interested in Cartier Santos.',
        clientName: 'Lisa Wang',
        clientId: 'client-4',
        watchBrand: 'Cartier',
        watchModel: 'Santos',
        actions: [
          { type: 'TEXT_CLIENT', label: 'Text Now', isPrimary: true, phoneNumber: '+1-555-0126' },
          { type: 'SCHEDULE', label: 'Reschedule' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-4' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      addNotification({
        category: 'FOLLOW-UPS',
        title: 'Client Interest: Audemars Piguet Royal Oak',
        message: 'James Chen (Bronze tier) expressed interest 15 days ago. Follow up to gauge continued interest.',
        clientName: 'James Chen',
        clientId: 'client-5',
        watchBrand: 'Audemars Piguet',
        watchModel: 'Royal Oak',
        daysWaiting: 15,
        actions: [
          { type: 'TEXT_CLIENT', label: 'Text Now', isPrimary: true, phoneNumber: '+1-555-0127' },
          { type: 'CALL', label: 'Call', phoneNumber: '+1-555-0127' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-5' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })
    }
  }, []) // Only run once on mount

  const categoryIcons = {
    URGENT: Flame,
    'FOLLOW-UPS': Clock
  }


  const filteredNotifications = selectedCategory === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory)

  // Get filtered notifications for modal
  const getModalNotifications = () => {
    switch (showStatsModal) {
      case 'URGENT':
        return notifications.filter(n => n.category === 'URGENT')
      case 'FOLLOW-UPS':
        return notifications.filter(n => n.category === 'FOLLOW-UPS')
      case 'ALL':
        return notifications
      default:
        return []
    }
  }

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
        alert(`Appointment scheduled for ${details.slot}`)
        break
    }
  }

  const openFollowUpModal = (notification: any) => {
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

  return (
    <LenkersdorferSidebar>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        <main className="flex-1 w-full max-w-full mx-auto px-4 lg:px-8 pb-8 overflow-y-auto space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background md:static flex items-center space-x-4 pt-6">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-3 rounded-full">
            <Bell className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Real-time alerts to prevent missed opportunities</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          <div
            className="cursor-pointer"
            onClick={() => setShowStatsModal('URGENT')}
          >
            <Card className="hover:shadow-lg transition-all duration-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 dark:bg-red-950 p-3 rounded-lg flex-shrink-0">
                    <Flame className="w-7 h-7 text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <div className="text-red-600 dark:text-red-500 text-3xl font-bold">{counts.byCategory.URGENT || 0}</div>
                    <div className="text-foreground/60 text-sm font-medium">Urgent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setShowStatsModal('FOLLOW-UPS')}
          >
            <Card className="hover:shadow-lg transition-all duration-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-amber-100 dark:bg-amber-950 p-3 rounded-lg flex-shrink-0">
                    <Clock className="w-7 h-7 text-amber-600 dark:text-amber-500" />
                  </div>
                  <div>
                    <div className="text-amber-600 dark:text-amber-500 text-3xl font-bold">{counts.byCategory['FOLLOW-UPS'] || 0}</div>
                    <div className="text-foreground/60 text-sm font-medium">Follow-ups</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div
            className="cursor-pointer"
            onClick={() => setShowStatsModal('ALL')}
          >
            <Card className="hover:shadow-lg transition-all duration-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-lg flex-shrink-0">
                    <Bell className="w-7 h-7 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div>
                    <div className="text-blue-600 dark:text-blue-500 text-3xl font-bold">{counts.total}</div>
                    <div className="text-foreground/60 text-sm font-medium">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 w-full max-w-full">
          {/* Notification List */}
          <div className="lg:col-span-2 min-w-0">
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Active Notifications</CardTitle>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Categories</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                      <SelectItem value="FOLLOW-UPS">Follow-ups</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredNotifications.map((notification) => {
                  const CategoryIcon = categoryIcons[notification.category]

                  const getCategoryColors = (category: string) => {
                    switch (category) {
                      case 'URGENT': return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
                      case 'FOLLOW-UPS': return { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' }
                      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
                    }
                  }

                  const categoryColors = getCategoryColors(notification.category)

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      className="border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className={`${categoryColors.bg} p-2 rounded-lg flex-shrink-0`}>
                            <CategoryIcon className={`w-5 h-5 ${categoryColors.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              <Badge className={cn("text-xs", categoryColors.bg, categoryColors.text, categoryColors.border)}>
                                {notification.category === 'FOLLOW-UPS' ? 'Follow-up' : notification.category}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm mb-2">{notification.message}</p>
                            {notification.clientName && (
                              <div className="text-xs text-muted-foreground">
                                Client: {notification.clientName}
                                {notification.daysWaiting && ` • ${notification.daysWaiting} days waiting`}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-2 mt-3">
                                {notification.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant={action.isPrimary ? "default" : "outline"}
                                    onClick={() => {
                                      if (action.type === 'SCHEDULE') {
                                        openFollowUpModal(notification)
                                      } else if (action.type === 'CALL') {
                                        alert(`Calling ${action.phoneNumber || notification.clientName}...`)
                                      } else if (action.type === 'DISMISS') {
                                        removeNotification(notification.id)
                                      } else if (action.type === 'VIEW_CLIENT') {
                                        router.push(`/clients/${action.clientId || notification.clientId}`)
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            triggerHapticFeedback()
                            removeNotification(notification.id)
                          }}
                          className="p-2 flex-shrink-0"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })}

                {filteredNotifications.length === 0 && (
                  <div className="text-center py-12">
                    <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No notifications in this category</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Demo Controls - Disabled (notifications now come from messages only) */}
          <div className="space-y-6">
            {/* <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Add Demo Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                Demo notification controls removed - notifications now come from real user actions only
              </CardContent>
            </Card> */}

            <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">System Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Real-time notification updates</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Priority-based sorting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>One-tap call integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Swipe gestures support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Mobile-optimized design</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Allocation system integration</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Follow-Up Modal */}
        {followUpModal.isOpen && followUpModal.client && followUpModal.context && (
          <FollowUpModal
            isOpen={followUpModal.isOpen}
            onClose={() => setFollowUpModal({ isOpen: false })}
            client={followUpModal.client}
            context={followUpModal.context}
            onFollowUpAction={handleFollowUpAction}
          />
        )}

        {/* Stats Modal */}
        <Dialog open={!!showStatsModal} onOpenChange={() => setShowStatsModal(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)] md:w-full">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {showStatsModal === 'URGENT' && (
                  <>
                    <div className="bg-red-100 dark:bg-red-950 p-2 rounded-lg">
                      <Flame className="h-5 w-5 text-red-600 dark:text-red-500" />
                    </div>
                    Urgent Notifications ({counts.byCategory.URGENT || 0})
                  </>
                )}
                {showStatsModal === 'FOLLOW-UPS' && (
                  <>
                    <div className="bg-amber-100 dark:bg-amber-950 p-2 rounded-lg">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                    </div>
                    Follow-up Notifications ({counts.byCategory['FOLLOW-UPS'] || 0})
                  </>
                )}
                {showStatsModal === 'ALL' && (
                  <>
                    <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    </div>
                    All Notifications ({counts.total})
                  </>
                )}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {getModalNotifications().length === 0 ? (
                <div className="text-center py-12 text-foreground/60">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No notifications in this category</p>
                </div>
              ) : (
                getModalNotifications().map((notification) => {
                  const CategoryIcon = categoryIcons[notification.category]
                  const getCategoryColors = (category: string) => {
                    switch (category) {
                      case 'URGENT': return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
                      case 'FOLLOW-UPS': return { bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' }
                      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
                    }
                  }

                  const categoryColors = getCategoryColors(notification.category)

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`${categoryColors.bg} p-2 rounded-lg`}>
                            <CategoryIcon className={`w-5 h-5 ${categoryColors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground">{notification.title}</h3>
                              <Badge className={cn("text-xs", categoryColors.bg, categoryColors.text, categoryColors.border)}>
                                {notification.category === 'FOLLOW-UPS' ? 'Follow-up' : notification.category}
                              </Badge>
                            </div>
                            <p className="text-foreground/70 text-sm mb-2">{notification.message}</p>
                            {notification.clientName && (
                              <div className="text-xs text-foreground/60">
                                Client: {notification.clientName}
                                {notification.daysWaiting && ` • ${notification.daysWaiting} days waiting`}
                              </div>
                            )}

                            {/* Action Buttons */}
                            {notification.actions && notification.actions.length > 0 && (
                              <div className="flex gap-2 mt-3 flex-wrap">
                                {notification.actions.map((action, index) => (
                                  <Button
                                    key={index}
                                    size="sm"
                                    variant={action.isPrimary ? "default" : "outline"}
                                    onClick={() => {
                                      if (action.type === 'SCHEDULE') {
                                        setShowStatsModal(null)
                                        openFollowUpModal(notification)
                                      } else if (action.type === 'CALL') {
                                        alert(`Calling ${action.phoneNumber || notification.clientName}...`)
                                      } else if (action.type === 'DISMISS') {
                                        removeNotification(notification.id)
                                      } else if (action.type === 'VIEW_CLIENT') {
                                        setShowStatsModal(null)
                                        router.push(`/clients/${action.clientId || notification.clientId}`)
                                      }
                                    }}
                                    className="text-xs"
                                  >
                                    {action.label}
                                  </Button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            triggerHapticFeedback()
                            removeNotification(notification.id)
                          }}
                          className="p-2"
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </motion.div>
                  )
                })
              )}
            </div>
          </DialogContent>
        </Dialog>
        </main>
      </div>
    </LenkersdorferSidebar>
  )
}
'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { FollowUpModal } from '@/components/notifications/FollowUpModal'
import { cn } from '@/lib/utils'
import { triggerHapticFeedback } from '@/lib/haptic-utils'

export default function NotificationsDemoPage() {
  const router = useRouter()
  const { notifications, getCounts, addNotification, removeNotification, markAllAsRead } = useNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [showStatsModal, setShowStatsModal] = useState<'CRITICAL' | 'HIGH' | 'MESSAGES' | 'ALL' | null>(null)
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
      // Critical notification example
      addNotification({
        category: 'MESSAGES',
        urgency: 'CRITICAL',
        title: 'VIP Client Waiting 120+ Days',
        message: 'Sarah Chen (Tier 1) has been waiting 127 days for Rolex Daytona. Immediate follow-up required.',
        clientName: 'Sarah Chen',
        clientId: 'client-1',
        watchBrand: 'Rolex',
        watchModel: 'Daytona',
        daysWaiting: 127,
        actions: [
          { type: 'CALL', label: 'Call Now', isPrimary: true, phoneNumber: '+1-555-0123' },
          { type: 'SCHEDULE', label: 'Follow Up' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-1' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      // High priority notification example
      addNotification({
        category: 'MESSAGES',
        urgency: 'HIGH',
        title: 'High-Value Client Inquiry',
        message: 'Michael Rodriguez (Tier 2, $85K lifetime) is interested in Patek Philippe Nautilus. Recent purchase indicates strong buying intent.',
        clientName: 'Michael Rodriguez',
        clientId: 'client-2',
        watchBrand: 'Patek Philippe',
        watchModel: 'Nautilus',
        daysWaiting: 45,
        actions: [
          { type: 'CALL', label: 'Call Now', isPrimary: true, phoneNumber: '+1-555-0124' },
          { type: 'SCHEDULE', label: 'Follow Up' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-2' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      // Message notification example
      addNotification({
        category: 'MESSAGES',
        urgency: 'MEDIUM',
        title: 'New Message from Client',
        message: 'Emma Wilson inquired about availability of Omega Speedmaster Professional. Last purchase was 8 months ago.',
        clientName: 'Emma Wilson',
        clientId: 'client-3',
        watchBrand: 'Omega',
        watchModel: 'Speedmaster',
        daysWaiting: 12,
        actions: [
          { type: 'CALL', label: 'Call Now', isPrimary: true, phoneNumber: '+1-555-0125' },
          { type: 'SCHEDULE', label: 'Follow Up' },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-3' },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      // System notification example
      addNotification({
        category: 'SYSTEM',
        urgency: 'LOW',
        title: 'Daily Summary Report',
        message: 'Your daily client activity summary is ready. 3 new waitlist entries, 2 allocations made, 5 follow-ups pending.',
        actions: [
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })
    }
  }, []) // Only run once on mount

  // Demo notification templates (disabled - notifications now come from messages only)
  // const demoNotifications = []

  const addDemoNotification = (template: typeof demoNotifications[0]) => {
    const clientNames = ['Sarah Chen', 'Michael Rodriguez', 'James Thompson', 'Emma Wilson', 'David Kim']
    const watchBrands = ['Rolex', 'Patek Philippe', 'Omega', 'Tudor', 'Cartier']
    const watchModels = ['Submariner', 'Nautilus', 'Speedmaster', 'Black Bay', 'Santos']

    const randomClient = clientNames[Math.floor(Math.random() * clientNames.length)]
    const randomBrand = watchBrands[Math.floor(Math.random() * watchBrands.length)]
    const randomModel = watchModels[Math.floor(Math.random() * watchModels.length)]

    addNotification({
      category: template.category,
      urgency: template.urgency,
      title: template.title,
      message: template.message.replace('VIP client', randomClient).replace('New VIP client', randomClient),
      clientName: randomClient,
      clientId: `client-${Date.now()}`,
      watchBrand: randomBrand,
      watchModel: randomModel,
      daysWaiting: Math.floor(Math.random() * 90) + 1,
      actions: [
        { type: 'CALL', label: 'Call Now', isPrimary: true, phoneNumber: '+1-555-0123' },
        { type: 'SCHEDULE', label: 'Follow Up' },
        { type: 'VIEW_CLIENT', label: 'View Client' },
        { type: 'DISMISS', label: 'Dismiss' }
      ]
    })
  }

  const categoryIcons = {
    MESSAGES: Bell,
    SYSTEM: Inbox
  }


  const filteredNotifications = selectedCategory === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory)

  // Get filtered notifications for modal
  const getModalNotifications = () => {
    switch (showStatsModal) {
      case 'CRITICAL':
        return notifications.filter(n => n.urgency === 'CRITICAL')
      case 'HIGH':
        return notifications.filter(n => n.urgency === 'HIGH')
      case 'MESSAGES':
        return notifications.filter(n => n.category === 'MESSAGES')
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
        <main className="flex-1 w-full max-w-full mx-auto px-4 lg:px-8 pb-8 overflow-hidden space-y-6">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-background md:static flex items-center space-x-4 pt-6">
          <div className="bg-gradient-to-r from-yellow-400 to-yellow-600 p-3 rounded-full">
            <Bell className="w-8 h-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">Real-time alerts to prevent missed opportunities</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => setShowStatsModal('CRITICAL')}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 dark:bg-red-950 p-3 rounded-lg">
                    <AlertTriangle className="w-7 h-7 text-red-600 dark:text-red-500" />
                  </div>
                  <div>
                    <div className="text-red-600 dark:text-red-500 text-3xl font-bold">{counts.critical}</div>
                    <div className="text-foreground/60 text-sm font-medium">Critical</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => setShowStatsModal('HIGH')}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 dark:bg-orange-950 p-3 rounded-lg">
                    <Flame className="w-7 h-7 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div>
                    <div className="text-orange-600 dark:text-orange-500 text-3xl font-bold">{counts.high}</div>
                    <div className="text-foreground/60 text-sm font-medium">High</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => setShowStatsModal('MESSAGES')}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-100 dark:bg-blue-950 p-3 rounded-lg">
                    <Bell className="w-7 h-7 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div>
                    <div className="text-blue-600 dark:text-blue-500 text-3xl font-bold">{counts.byCategory.MESSAGES || 0}</div>
                    <div className="text-foreground/60 text-sm font-medium">Messages</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cursor-pointer"
            onClick={() => setShowStatsModal('ALL')}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 dark:bg-yellow-950 p-3 rounded-lg">
                    <Bell className="w-7 h-7 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-yellow-600 dark:text-yellow-500 text-3xl font-bold">{counts.total}</div>
                    <div className="text-foreground/60 text-sm font-medium">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Notification List */}
          <div className="lg:col-span-2">
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
                      <SelectItem value="MESSAGES">Messages</SelectItem>
                      <SelectItem value="SYSTEM">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredNotifications.map((notification) => {
                  const CategoryIcon = categoryIcons[notification.category]

                  const getUrgencyColors = (urgency: string) => {
                    switch (urgency) {
                      case 'CRITICAL': return { bg: 'bg-red-100', text: 'text-red-600', border: 'border-red-200' }
                      case 'HIGH': return { bg: 'bg-orange-100', text: 'text-orange-600', border: 'border-orange-200' }
                      case 'MEDIUM': return { bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' }
                      case 'LOW': return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
                      default: return { bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
                    }
                  }

                  const urgencyColors = getUrgencyColors(notification.urgency)

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      className="border rounded-lg p-4 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`${urgencyColors.bg} p-2 rounded-lg`}>
                            <CategoryIcon className={`w-5 h-5 ${urgencyColors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{notification.title}</h3>
                              <Badge className={cn("text-xs", urgencyColors.bg, urgencyColors.text, urgencyColors.border)}>
                                {notification.urgency}
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
                          className="p-2"
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
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[calc(100vw-2rem)]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {showStatsModal === 'CRITICAL' && (
                  <>
                    <div className="bg-red-100 dark:bg-red-950 p-2 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-500" />
                    </div>
                    Critical Notifications ({counts.critical})
                  </>
                )}
                {showStatsModal === 'HIGH' && (
                  <>
                    <div className="bg-orange-100 dark:bg-orange-950 p-2 rounded-lg">
                      <Flame className="h-5 w-5 text-orange-600 dark:text-orange-500" />
                    </div>
                    High Priority Notifications ({counts.high})
                  </>
                )}
                {showStatsModal === 'MESSAGES' && (
                  <>
                    <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-blue-600 dark:text-blue-500" />
                    </div>
                    Message Notifications ({counts.byCategory.MESSAGES || 0})
                  </>
                )}
                {showStatsModal === 'ALL' && (
                  <>
                    <div className="bg-yellow-100 dark:bg-yellow-950 p-2 rounded-lg">
                      <Bell className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
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
                  const getUrgencyColors = (urgency: string) => {
                    switch (urgency) {
                      case 'CRITICAL': return { bg: 'bg-red-100 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
                      case 'HIGH': return { bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' }
                      case 'MEDIUM': return { bg: 'bg-yellow-100 dark:bg-yellow-950', text: 'text-yellow-600 dark:text-yellow-400', border: 'border-yellow-200 dark:border-yellow-800' }
                      case 'LOW': return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
                      default: return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' }
                    }
                  }

                  const urgencyColors = getUrgencyColors(notification.urgency)

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      className="border rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`${urgencyColors.bg} p-2 rounded-lg`}>
                            <CategoryIcon className={`w-5 h-5 ${urgencyColors.text}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-foreground">{notification.title}</h3>
                              <Badge className={cn("text-xs", urgencyColors.bg, urgencyColors.text, urgencyColors.border)}>
                                {notification.urgency}
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
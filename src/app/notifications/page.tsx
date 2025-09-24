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
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { useNotifications } from '@/contexts/NotificationContext'
import { FollowUpModal } from '@/components/notifications/FollowUpModal'
import { cn } from '@/lib/utils'

export default function NotificationsDemoPage() {
  const router = useRouter()
  const { notifications, getCounts, addNotification, removeNotification, markAllAsRead } = useNotifications()
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [followUpModal, setFollowUpModal] = useState<{
    isOpen: boolean
    client?: any
    context?: any
  }>({ isOpen: false })

  const counts = getCounts()

  // Add a demo notification for testing
  useEffect(() => {
    addNotification({
      category: 'HOT_LEADS',
      title: 'Hot Lead Cooling',
      message: 'High-value prospect Sarah Chen needs immediate follow-up',
      clientName: 'Sarah Chen',
      clientId: 'client-demo-123',
      watchBrand: 'Rolex',
      watchModel: 'Submariner',
      daysWaiting: 15,
      actions: [
        { type: 'CALL', label: 'Call Now', isPrimary: true, phoneNumber: '+1-555-0123' },
        { type: 'SCHEDULE', label: 'Follow Up' },
        { type: 'VIEW_CLIENT', label: 'View Client', clientId: 'client-demo-123' },
        { type: 'DISMISS', label: 'Dismiss' }
      ]
    })
  }, [])

  // Demo notification templates
  const demoNotifications = [
    {
      category: 'ALLOCATION' as const,
      urgency: 'CRITICAL' as const,
      title: 'Perfect Allocation Match!',
      message: 'New VIP client with exact tier match available',
      template: true
    },
    {
      category: 'HOT_LEADS' as const,
      urgency: 'HIGH' as const,
      title: 'Hot Lead Cooling',
      message: 'High-value prospect needs immediate follow-up',
      template: true
    },
    {
      category: 'VIP_WAITING' as const,
      urgency: 'HIGH' as const,
      title: 'VIP Client Alert',
      message: 'Platinum client waiting too long for watch',
      template: true
    },
    {
      category: 'NEW_ARRIVALS' as const,
      urgency: 'MEDIUM' as const,
      title: 'New Watch Arrival',
      message: 'Fresh inventory needs allocation review',
      template: true
    }
  ]

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
    ALLOCATION: Star,
    HOT_LEADS: Flame,
    VIP_WAITING: Star,
    NEW_ARRIVALS: Inbox,
    FOLLOW_UPS: Clock,
    CALLBACKS: Calendar
  }


  const filteredNotifications = selectedCategory === 'ALL'
    ? notifications
    : notifications.filter(n => n.category === selectedCategory)

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
      <div className="flex-1 space-y-6 p-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
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
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-red-100 p-3 rounded-lg">
                    <AlertTriangle className="w-7 h-7 text-red-600" />
                  </div>
                  <div>
                    <div className="text-red-600 text-3xl font-bold">{counts.critical}</div>
                    <div className="text-muted-foreground text-sm font-medium">Critical</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-orange-100 p-3 rounded-lg">
                    <Flame className="w-7 h-7 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-orange-600 text-3xl font-bold">{counts.high}</div>
                    <div className="text-muted-foreground text-sm font-medium">High</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <Star className="w-7 h-7 text-green-600" />
                  </div>
                  <div>
                    <div className="text-green-600 text-3xl font-bold">{counts.byCategory.ALLOCATION || 0}</div>
                    <div className="text-muted-foreground text-sm font-medium">Allocation</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-yellow-100 p-3 rounded-lg">
                    <Bell className="w-7 h-7 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-yellow-600 text-3xl font-bold">{counts.total}</div>
                    <div className="text-muted-foreground text-sm font-medium">Total</div>
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
                      <SelectItem value="ALLOCATION">Allocation</SelectItem>
                      <SelectItem value="HOT_LEADS">Hot Leads</SelectItem>
                      <SelectItem value="VIP_WAITING">VIP Waiting</SelectItem>
                      <SelectItem value="NEW_ARRIVALS">New Arrivals</SelectItem>
                      <SelectItem value="FOLLOW_UPS">Follow-ups</SelectItem>
                      <SelectItem value="CALLBACKS">Callbacks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 max-h-96 overflow-y-auto">
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
                          onClick={() => removeNotification(notification.id)}
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

          {/* Demo Controls */}
          <div className="space-y-6">
            <Card className="hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="text-lg">Add Demo Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {demoNotifications.map((template, index) => {
                  const getUrgencyColors = (urgency: string) => {
                    switch (urgency) {
                      case 'CRITICAL': return { bg: 'bg-red-50 hover:bg-red-100', border: 'border-red-200', icon: 'bg-red-100', iconText: 'text-red-600' }
                      case 'HIGH': return { bg: 'bg-orange-50 hover:bg-orange-100', border: 'border-orange-200', icon: 'bg-orange-100', iconText: 'text-orange-600' }
                      case 'MEDIUM': return { bg: 'bg-yellow-50 hover:bg-yellow-100', border: 'border-yellow-200', icon: 'bg-yellow-100', iconText: 'text-yellow-600' }
                      case 'LOW': return { bg: 'bg-gray-50 hover:bg-gray-100', border: 'border-gray-200', icon: 'bg-gray-100', iconText: 'text-gray-600' }
                      default: return { bg: 'bg-gray-50 hover:bg-gray-100', border: 'border-gray-200', icon: 'bg-gray-100', iconText: 'text-gray-600' }
                    }
                  }

                  const colors = getUrgencyColors(template.urgency)
                  const CategoryIcon = categoryIcons[template.category]

                  return (
                    <Button
                      key={index}
                      variant="outline"
                      onClick={() => addDemoNotification(template)}
                      className={cn("w-full h-auto p-3 justify-start", colors.bg, colors.border)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn("p-2 rounded-lg", colors.icon)}>
                          <CategoryIcon className={cn("w-4 h-4", colors.iconText)} />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm">{template.title}</div>
                          <div className="text-muted-foreground text-xs">{template.urgency} Priority</div>
                        </div>
                      </div>
                    </Button>
                  )
                })}
              </CardContent>
            </Card>

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
      </div>
    </LenkersdorferSidebar>
  )
}
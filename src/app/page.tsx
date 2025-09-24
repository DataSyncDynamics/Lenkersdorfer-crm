'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AllocationContactPanel } from '@/components/allocation/AllocationContactPanel'
import { ClientModal } from '@/components/clients/ClientModal'
import { useNotifications } from '@/contexts/NotificationContext'
import { motion, useInView, useSpring, useTransform, AnimatePresence } from 'framer-motion'
import {
  DollarSign,
  Users,
  AlertTriangle,
  TrendingUp,
  Watch,
  Crown,
  Star,
  Package,
  ChevronUp,
  ChevronDown,
  Filter,
  Search,
  Bell,
  BellIcon,
  AlertCircle,
  Clock,
  ClockIcon,
  Target,
  X,
  StarIcon,
  Flame as FireIcon,
  Inbox as InboxIcon,
  Calendar as CalendarIcon,
  Phone as PhoneIcon,
  MessageSquare
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import type { Client } from '@/types'
import { cn } from '@/lib/utils'

// TypeScript interfaces for new alert system
interface AllocationAlert {
  id: string
  priority: 'PERFECT_MATCH' | 'GOOD_MATCH' | 'NEEDS_FOLLOWUP' | 'AT_RISK'
  clientName: string
  clientTier: number
  message: string
  action: string
  daysWaiting?: number
  watchModel?: string
  watchTier?: number
  timestamp: Date
  read: boolean
}

interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ReactNode
  className?: string
}

interface Alert {
  id: string
  type: 'urgent' | 'warning' | 'info'
  message: string
  timestamp: string
  clientName?: string
  watchModel?: string
}

interface InventoryItem {
  id: string
  brand: string
  model: string
  collection: string
  price: number
  availability: 'Available' | 'Reserved' | 'Waitlist' | 'Sold'
  tier: number
}

const AnimatedCounter = ({ value, duration = 2000 }: { value: number; duration?: number }) => {
  const nodeRef = useRef<HTMLSpanElement>(null)
  const isInView = useInView(nodeRef, { once: true })
  const spring = useSpring(isInView ? value : 0, { duration })

  return <span ref={nodeRef}>{Math.round(spring.get())}</span>
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType,
  icon,
  className = ""
}) => {
  const isPositive = changeType === 'positive'

  return (
    <Card className={cn("hover:shadow-lg transition-all duration-200", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={cn(
          "text-xs",
          isPositive ? "text-green-600" : "text-red-600"
        )}>
          {change} from last month
        </p>
      </CardContent>
    </Card>
  )
}

const TopClientsCarousel = ({ clients }: { clients: Client[] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  const topClients = clients
    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
    .slice(0, 8)

  // Auto-advance carousel
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, topClients.length - 2))
    }, 3000)

    return () => clearInterval(interval)
  }, [isPlaying, topClients.length])

  const visibleClients = topClients.slice(currentIndex, currentIndex + 3)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Top VIP Clients
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="text-muted-foreground"
          >
            {isPlaying ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visibleClients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center text-black font-bold text-sm">
                    {currentIndex + index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                      {client.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{client.name}</span>
                    <Badge className={cn("text-xs", getVipTierColor(client.clientTier.toString()))}>
                      Tier {client.clientTier}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(client.lifetimeSpend)} lifetime
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsDashboard() {
  const router = useRouter()

  const {
    clients,
    waitlist,
    watchModels,
    generateAllocationContacts,
    getGreenBoxMatches,
    getClientById,
    getWatchModelById
  } = useAppStore()

  const { notifications, getCounts, removeNotification, markAsRead, addNotification } = useNotifications()

  // State for new Priority Allocation Alerts system
  const [alerts, setAlerts] = useState<AllocationAlert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showAlertsPanel, setShowAlertsPanel] = useState(false)
  const [showAllocationPanel, setShowAllocationPanel] = useState(false)
  const [selectedWatchForAllocation, setSelectedWatchForAllocation] = useState<string>('')
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [selectedClientForView, setSelectedClientForView] = useState<string | null>(null)

  // Fetch allocation alerts from API
  useEffect(() => {
    fetchAllocationAlerts()
  }, [])

  // Add demo notifications for testing
  useEffect(() => {
    if (notifications.length === 0 && clients.length > 0) {
      // Use actual client IDs from the store
      const client1 = clients[0]
      const client2 = clients[1] || clients[0]
      const client3 = clients[2] || clients[0]

      addNotification({
        category: 'HOT_LEADS',
        title: 'Hot Lead Cooling',
        message: `High-value prospect ${client1.name} needs immediate follow-up`,
        clientName: client1.name,
        clientId: client1.id,
        watchBrand: 'Rolex',
        watchModel: 'Submariner',
        daysWaiting: 15,
        actions: [
          { type: 'FOLLOW_UP', label: 'SMS', isPrimary: true, phoneNumber: client1.phone },
          { type: 'FOLLOW_UP', label: 'Follow Up', phoneNumber: client1.phone },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: client1.id },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      addNotification({
        category: 'ALLOCATION',
        title: 'Perfect Match Available',
        message: `VIP client ${client2.name} tier matches available Daytona`,
        clientName: client2.name,
        clientId: client2.id,
        watchBrand: 'Rolex',
        watchModel: 'Daytona',
        daysWaiting: 42,
        actions: [
          { type: 'ALLOCATE', label: 'Allocate Now', isPrimary: true },
          { type: 'FOLLOW_UP', label: 'SMS', phoneNumber: client2.phone },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: client2.id },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })

      addNotification({
        category: 'VIP_WAITING',
        title: 'VIP Client Alert',
        message: `Platinum client ${client3.name} waiting too long for GMT-Master`,
        clientName: client3.name,
        clientId: client3.id,
        watchBrand: 'Rolex',
        watchModel: 'GMT-Master II',
        daysWaiting: 67,
        actions: [
          { type: 'FOLLOW_UP', label: 'Follow Up', isPrimary: true, phoneNumber: client3.phone },
          { type: 'VIEW_CLIENT', label: 'View Client', clientId: client3.id },
          { type: 'DISMISS', label: 'Dismiss' }
        ]
      })
    }
  }, [addNotification, notifications.length, clients])

  const fetchAllocationAlerts = () => {
    const processedAlerts: AllocationAlert[] = []

    // Get GREEN BOX matches (perfect tier alignment + affordable combinations)
    const greenBoxMatches = getGreenBoxMatches()
    greenBoxMatches
      .filter(match => match.status === 'GREEN' || (match.status === 'YELLOW' && match.urgencyLevel === 'HIGH'))
      .slice(0, 5) // Top 5 matches
      .forEach(match => {
        const client = getClientById(match.clientId)
        const watch = getWatchModelById(match.watchModelId)
        if (client && watch) {
          processedAlerts.push({
            id: `perfect-${match.id}`,
            priority: match.status === 'GREEN' ? 'PERFECT_MATCH' : 'GOOD_MATCH',
            clientName: client.name,
            clientTier: match.clientTier,
            message: match.status === 'GREEN' ?
              `Perfect tier & price match for ${watch.brand} ${watch.model}` :
              `Good upgrade opportunity for ${watch.brand} ${watch.model}`,
            action: match.status === 'GREEN' ? 'ALLOCATE NOW' : 'SUGGEST UPGRADE',
            daysWaiting: match.daysWaiting,
            watchModel: `${watch.brand} ${watch.model}`,
            watchTier: match.watchTier,
            timestamp: new Date(),
            read: false
          })
        }
      })

    // Long waiters needing follow-up (30+ days)
    waitlist.forEach(entry => {
      const client = getClientById(entry.clientId)
      const watch = getWatchModelById(entry.watchModelId)
      if (client && watch) {
        const daysWaiting = Math.floor(
          (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
        )

        if (daysWaiting >= 30) {
          processedAlerts.push({
            id: `followup-${entry.id}`,
            priority: 'NEEDS_FOLLOWUP',
            clientName: client.name,
            clientTier: client.clientTier,
            message: `Waiting ${daysWaiting} days for ${watch.brand} ${watch.model}`,
            action: 'FOLLOW UP',
            daysWaiting,
            watchModel: `${watch.brand} ${watch.model}`,
            timestamp: new Date(),
            read: false
          })
        }
      }
    })

    // Sort by priority (PERFECT_MATCH first, then by days waiting)
    const sortedAlerts = processedAlerts.sort((a, b) => {
      if (a.priority === 'PERFECT_MATCH' && b.priority !== 'PERFECT_MATCH') return -1
      if (b.priority === 'PERFECT_MATCH' && a.priority !== 'PERFECT_MATCH') return 1
      return (b.daysWaiting || 0) - (a.daysWaiting || 0)
    })

    setAlerts(sortedAlerts)
    setUnreadCount(sortedAlerts.filter(a => !a.read).length)
  }

  const markAlertsAsRead = () => {
    setAlerts(alerts.map(a => ({ ...a, read: true })))
    setUnreadCount(0)
  }

  const handleAllocateNow = (alert: AllocationAlert) => {
    // Extract watch ID from the alert to open allocation panel
    const alertWatchId = watchModels.find(w =>
      `${w.brand} ${w.model}` === alert.watchModel
    )?.id

    if (alertWatchId) {
      setSelectedWatchForAllocation(alertWatchId)
      setShowAllocationPanel(true)
    }
  }

  const handleFollowUp = (alert: AllocationAlert) => {
    // For now, just mark as read and show a notification
    // Later we can implement follow-up SMS templates

    // Show immediate feedback
    window.alert(`✅ Follow-up scheduled for ${alert.clientName}\n\nAction: Contact regarding ${alert.watchModel}\nDays waiting: ${alert.daysWaiting}`)
  }

  // Handle notification actions
  const handleNotificationAction = (notificationId: string, action: any) => {
    console.log('Handling notification action:', action.type, 'for notification:', notificationId)

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
          setSelectedClientForView(action.clientId)
        }
        break
      case 'FOLLOW_UP':
      case 'SCHEDULE':
        // Send SMS with pre-formatted message
        if (notification && action.phoneNumber) {
          const smsMessage = `Hi ${notification.clientName}, this is Jason from Lenkersdorfer. I wanted to update you on your ${notification.watchBrand} ${notification.watchModel} request. You've been waiting ${notification.daysWaiting} days and I have some updates to share. When would be a good time to connect? Thanks!`

          // Open SMS app with pre-filled message
          window.open(`sms:${action.phoneNumber}?body=${encodeURIComponent(smsMessage)}`)
          markAsRead(notificationId)
        }
        break
      case 'ALLOCATE':
        // Handle allocation action
        if (notification) {
          window.alert(`✅ Allocation started for ${notification.clientName}\n\nWatch: ${notification.watchBrand} ${notification.watchModel}`)
          markAsRead(notificationId)
        }
        break
    }
  }

  const getAlertColor = (priority: AllocationAlert['priority']) => {
    switch(priority) {
      case 'PERFECT_MATCH': return 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-500 dark:text-green-400'
      case 'GOOD_MATCH': return 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-500 dark:text-yellow-400'
      case 'NEEDS_FOLLOWUP': return 'bg-orange-50 border-orange-200 text-orange-800 dark:bg-orange-900/20 dark:border-orange-500 dark:text-orange-400'
      case 'AT_RISK': return 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-500 dark:text-red-400'
    }
  }

  const getAlertIcon = (priority: AllocationAlert['priority']) => {
    switch(priority) {
      case 'PERFECT_MATCH': return <Star className="w-5 h-5" />
      case 'GOOD_MATCH': return <Target className="w-5 h-5" />
      case 'NEEDS_FOLLOWUP': return <Clock className="w-5 h-5" />
      case 'AT_RISK': return <AlertCircle className="w-5 h-5" />
    }
  }

  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalRevenue = clients.reduce((sum, client) => sum + client.lifetimeSpend, 0)
    const activeClients = clients.length
    const avgOrderValue = totalRevenue / activeClients || 0

    // Calculate conversion rate (mock data for now)
    const conversionRate = 24.8

    // Priority alerts calculations
    const availableWatches = watchModels.filter(w => w.availability === 'Available').length
    const totalWaitlist = waitlist.length

    return {
      totalRevenue,
      activeClients,
      avgOrderValue,
      conversionRate,
      availableWatches,
      totalWaitlist
    }
  }, [clients, watchModels, waitlist])

  // Metrics data
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(analytics.totalRevenue),
      change: "+12.5%",
      changeType: "positive" as const,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Active Clients",
      value: analytics.activeClients.toString(),
      change: "+8.2%",
      changeType: "positive" as const,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Avg. Order Value",
      value: formatCurrency(analytics.avgOrderValue),
      change: "+15.3%",
      changeType: "positive" as const,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Conversion Rate",
      value: `${analytics.conversionRate}%`,
      change: "-2.1%",
      changeType: "negative" as const,
      icon: <Watch className="h-4 w-4 text-muted-foreground" />
    }
  ]

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header with Alert Bell */}
        <div className="flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lenkersdorfer Analytics</h1>
            <p className="text-muted-foreground">Professional luxury watch sales dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowAlertsPanel(!showAlertsPanel)
                if (!showAlertsPanel) markAlertsAsRead()
              }}
              className="relative"
            >
              <Bell className="h-4 w-4 mr-2" />
              Priority Alerts
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-medium">
                  {Math.min(unreadCount, 99)}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 max-w-full mx-auto px-4 lg:px-8 pb-8">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.title}
                {...metric}
                className="transform hover:scale-105 transition-transform duration-200"
              />
            ))}
          </div>

          {/* Notifications Section */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <BellIcon className="h-5 w-5 text-gold-500" />
                  Notifications
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {getCounts().total} active notification{getCounts().total !== 1 ? 's' : ''}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                    className="text-gold-600 border-gold-300 hover:bg-gold-50"
                  >
                    {showNotificationsPanel ? 'Show Less' : 'View All'}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(showNotificationsPanel ? notifications : notifications.slice(0, 3)).map(notification => {
                  const categoryConfig = {
                    ALLOCATION: { icon: StarIcon, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
                    HOT_LEADS: { icon: FireIcon, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
                    NEW_ARRIVALS: { icon: InboxIcon, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
                    FOLLOW_UPS: { icon: ClockIcon, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
                    VIP_WAITING: { icon: StarIcon, color: 'text-gold-600', bgColor: 'bg-gold-50', borderColor: 'border-gold-200' },
                    CALLBACKS: { icon: CalendarIcon, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' }
                  }

                  const config = categoryConfig[notification.category]
                  const NotificationIcon = config.icon

                  return (
                    <motion.div
                      key={notification.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-lg border hover:shadow-lg transition-all duration-200 ${config.bgColor} ${config.borderColor}`}
                    >
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <NotificationIcon className={`h-5 w-5 ${config.color} flex-shrink-0 mt-0.5`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 break-words">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-700 mt-1 break-words">{notification.message}</p>
                            {(notification.daysWaiting || notification.lastContact) && (
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                <span>Client: {notification.clientName}</span>
                                {notification.daysWaiting && (
                                  <span className="flex items-center gap-1">
                                    • {notification.daysWaiting} days waiting
                                  </span>
                                )}
                                {notification.lastContact && (
                                  <span className="flex items-center gap-1">
                                    <PhoneIcon className="h-3 w-3" />
                                    Last contact: {notification.lastContact}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant={action.isPrimary ? "default" : "outline"}
                              onClick={() => handleNotificationAction(notification.id, action)}
                              className={action.isPrimary ? "bg-gold-600 hover:bg-gold-700" : ""}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                      {!notification.isRead && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </motion.div>
                  )
                })}

                {notifications.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No notifications at this time</p>
                    <p className="text-xs mt-1">You're all caught up!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rest of Dashboard Content */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top VIP Clients */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  Top VIP Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {clients
                    .filter(client => client.clientTier >= 1 && client.clientTier <= 2)
                    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
                    .slice(0, 5)
                    .map((client, index) => (
                      <div key={client.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className={cn("text-white font-semibold", getVipTierColor(client.clientTier))}>
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{client.name}</p>
                            <Badge variant="outline" className={cn("text-xs", getVipTierColor(client.clientTier.toString()))}>
                              Tier {client.clientTier}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(client.lifetimeSpend)} lifetime spend
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">
                            {client.purchases?.length || 0} purchase{(client.purchases?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Available Watches</span>
                    <Badge variant="outline">{analytics.availableWatches}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Waitlist Entries</span>
                    <Badge variant="outline">{analytics.totalWaitlist}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Priority Alerts</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                      {unreadCount}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* Alerts Sidebar Panel */}
        <AnimatePresence>
          {showAlertsPanel && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => setShowAlertsPanel(false)}
              />

              {/* Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-xl z-50 overflow-y-auto"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">All Priority Alerts</h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAlertsPanel(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {alerts.map(alert => (
                      <motion.div
                        key={alert.id}
                        layout
                        className={cn("p-3 rounded-lg border", getAlertColor(alert.priority))}
                      >
                        <div className="flex items-start gap-2">
                          {getAlertIcon(alert.priority)}
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{alert.clientName}</p>
                            <p className="text-sm opacity-90">{alert.message}</p>
                            <div className="flex items-center justify-between mt-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                className="text-xs h-6"
                                onClick={() => {
                                  if (alert.priority === 'PERFECT_MATCH') {
                                    setShowAlertsPanel(false) // Close sidebar first
                                    handleAllocateNow(alert)
                                  } else if (alert.priority === 'NEEDS_FOLLOWUP') {
                                    handleFollowUp(alert)
                                  }
                                }}
                              >
                                {alert.action}
                              </Button>
                              {alert.daysWaiting && (
                                <span className="text-xs opacity-75">{alert.daysWaiting}d</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}

                    {alerts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No alerts available</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Notifications Panel - Integrated into main dashboard */}

        {/* Allocation Contact Panel */}
        <AllocationContactPanel
          isOpen={showAllocationPanel}
          onClose={() => setShowAllocationPanel(false)}
          watchId={selectedWatchForAllocation}
          onContactInitiated={(clientId, method) => {
            console.log(`Contact initiated: ${clientId} via ${method}`)
            // Refresh alerts after contact
            fetchAllocationAlerts()
          }}
        />

        {/* Client Modal */}
        {selectedClientForView && (
          <ClientModal
            selectedClient={getClientById(selectedClientForView)}
            onClose={() => setSelectedClientForView(null)}
            onSave={(clientData) => {
              // Handle client updates here if needed
              setSelectedClientForView(null)
            }}
            readonly={true}
          />
        )}
      </div>
    </LenkersdorferSidebar>
  )
}
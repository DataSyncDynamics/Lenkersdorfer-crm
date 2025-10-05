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
  Package,
  ChevronUp,
  ChevronDown,
  Bell,
  BellIcon,
  Clock,
  ClockIcon,
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
import { formatClientName } from '@/lib/ui-utils'
import { triggerHapticFeedback } from '@/lib/haptic-utils'


interface MetricCardProps {
  title: string
  value: string
  change: string
  changeType: 'positive' | 'negative'
  icon: React.ReactNode
  className?: string
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
                    <span className="font-semibold">{formatClientName(client.name)}</span>
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
    getPerfectMatches,
    getClientById,
    getWatchModelById
  } = useAppStore()

  const { notifications, getCounts, removeNotification, markAsRead, addNotification } = useNotifications()

  const [showAllocationPanel, setShowAllocationPanel] = useState(false)
  const [selectedWatchForAllocation, setSelectedWatchForAllocation] = useState<string>('')
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false)
  const [selectedClientForView, setSelectedClientForView] = useState<string | null>(null)


  // Generate priority notifications for high-value clients and important business events
  useEffect(() => {
    // Only generate priority notifications if none exist
    if (notifications.length === 0) {
      const priorityNotifications = []

      // Find high-value clients who haven't purchased recently (7+ days ago)
      const highValueClients = clients
        .filter(client => client.clientTier <= 2 && client.lifetimeSpend > 50000)
        .sort((a, b) => a.clientTier - b.clientTier) // Sort by tier priority
        .slice(0, 3) // Top 3 priority clients

      highValueClients.forEach(client => {
        const daysSinceContact = Math.floor(Math.random() * 14) + 7 // 7-21 days

        priorityNotifications.push({
          category: 'MESSAGES' as const,
          title: `Priority Follow-up: ${formatClientName(client.name)}`,
          message: `Tier ${client.clientTier} client (${formatCurrency(client.lifetimeSpend)} lifetime) needs follow-up on watch availability`,
          clientName: formatClientName(client.name),
          clientId: client.id,
          watchBrand: client.preferredBrands?.[0] || 'Rolex',
          watchModel: 'Submariner',
          daysWaiting: daysSinceContact,
          lastContact: `${daysSinceContact} days ago`,
          actions: [
            {
              type: 'TEXT_CLIENT' as const,
              label: 'Send Update',
              isPrimary: true,
              phoneNumber: client.phone,
              tier: client.clientTier
            },
            {
              type: 'CALL' as const,
              label: 'Call Now',
              phoneNumber: client.phone,
              tier: client.clientTier
            },
            {
              type: 'VIEW_CLIENT' as const,
              label: 'View Profile',
              clientId: client.id
            }
          ]
        })
      })

      // Add priority notifications to context
      priorityNotifications.forEach(notification => {
        addNotification(notification)
      })
    }
  }, [clients, notifications.length, addNotification])

  // SMS template function for relationship-based messaging
  const getTierSMSTemplate = (clientName: string, tier: number, watchBrand: string, watchModel: string): string => {
    const templates = {
      1: `Hi ${clientName}, this is Jason from Lenkersdorfer. As one of our most valued clients, I wanted to personally update you on your ${watchBrand} ${watchModel} request. I have some exclusive opportunities to discuss. When would be the best time for a private call?`,
      2: `Hi ${clientName}, this is Jason from Lenkersdorfer. I have an important update regarding your ${watchBrand} ${watchModel} request. Given our ongoing relationship, you have priority access to our latest arrivals. Let's schedule a call to discuss your options.`,
      3: `Hi ${clientName}, this is Jason from Lenkersdorfer. I wanted to update you on your ${watchBrand} ${watchModel} request. We have some new developments I'd like to share with you. When would be a good time to connect?`,
      4: `Hi ${clientName}, this is Jason from Lenkersdorfer. I have an update on your ${watchBrand} ${watchModel} inquiry. Would you be available for a brief call to discuss the latest availability?`,
      5: `Hi ${clientName}, this is Jason from Lenkersdorfer. I wanted to follow up on your ${watchBrand} ${watchModel} interest. Please let me know if you'd like to discuss current options.`
    }
    return templates[tier as keyof typeof templates] || templates[5]
  }





  // Handle notification actions
  const handleNotificationAction = (notificationId: string, action: any) => {
    console.log('Handling notification action:', action.type, 'for notification:', notificationId)

    const notification = notifications.find(n => n.id === notificationId)

    switch (action.type) {
      case 'OPEN_MESSAGES':
        // Navigate to messaging page with specific client selected
        if (action.clientId) {
          router.push(`/messages?client=${action.clientId}`)
          markAsRead(notificationId)
        }
        break
      case 'TEXT_CLIENT':
        // New tier-based SMS action
        if (notification && action.phoneNumber) {
          const tier = action.tier || 3 // Default to tier 3 if not specified
          const smsMessage = getTierSMSTemplate(
            notification.clientName,
            tier,
            notification.watchBrand,
            notification.watchModel
          )

          // For desktop/mobile compatibility, try both SMS formats
          try {
            // iOS/macOS format
            window.location.href = `sms:${action.phoneNumber}&body=${encodeURIComponent(smsMessage)}`
          } catch (error) {
            // Android format fallback
            window.open(`sms:${action.phoneNumber}?body=${encodeURIComponent(smsMessage)}`)
          }

          // Show confirmation with the message that was sent
          setTimeout(() => {
            alert(`📱 SMS sent to ${notification.clientName}\n\nMessage: "${smsMessage}"\n\nTier ${tier} client follow-up completed.`)
          }, 500)

          markAsRead(notificationId)
        } else {
          // Fallback - show phone number and tier-appropriate message for manual action
          if (notification) {
            const tier = action.tier || 3
            const smsMessage = getTierSMSTemplate(
              notification.clientName,
              tier,
              notification.watchBrand,
              notification.watchModel
            )
            alert(`📱 Text ${notification.clientName} (Tier ${tier})\n\nPhone: ${action.phoneNumber || 'Not available'}\n\nSuggested message: ${smsMessage}`)
            markAsRead(notificationId)
          }
        }
        break
      case 'CALL':
        triggerHapticFeedback()
        if (action.phoneNumber) {
          window.location.href = `tel:${action.phoneNumber}`
        }
        markAsRead(notificationId)
        break
      case 'DISMISS':
        removeNotification(notificationId)
        break
      case 'MARK_CONTACTED':
        markAsRead(notificationId)
        break
      case 'VIEW_CLIENT':
        if (action.clientId) {
          console.log('Opening client modal for clientId:', action.clientId)
          setSelectedClientForView(action.clientId)
        } else {
          console.error('No clientId provided for VIEW_CLIENT action')
        }
        break
      case 'FOLLOW_UP':
      case 'SCHEDULE':
        // Legacy follow-up action (deprecated, use TEXT_CLIENT instead)
        if (notification && action.phoneNumber) {
          const smsMessage = `Hi ${notification.clientName}, this is Jason from Lenkersdorfer. I wanted to update you on your ${notification.watchBrand} ${notification.watchModel} request. You've been waiting ${notification.daysWaiting} days and I have some updates to share. When would be a good time to connect? Thanks!`

          try {
            window.location.href = `sms:${action.phoneNumber}&body=${encodeURIComponent(smsMessage)}`
          } catch (error) {
            window.open(`sms:${action.phoneNumber}?body=${encodeURIComponent(smsMessage)}`)
          }
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
      default:
        console.warn('Unknown notification action type:', action.type)
        break
    }
  }



  // Calculate analytics data
  const analytics = useMemo(() => {
    const totalRevenue = clients.reduce((sum, client) => sum + client.lifetimeSpend, 0)
    const activeClients = clients.length
    const avgOrderValue = totalRevenue / activeClients || 0

    // Calculate conversion rate (mock data for now)
    const conversionRate = 24.8

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
        <div className="sticky top-0 z-10 bg-background md:static flex flex-col gap-4 p-4 md:p-6 lg:p-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lenkersdorfer Analytics</h1>
            <p className="text-muted-foreground">Professional luxury watch sales dashboard</p>
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
                <div className="flex flex-col gap-1">
                  <CardTitle className="flex items-center gap-2">
                    <BellIcon className="h-5 w-5 text-gold-500" />
                    Priority Notifications
                  </CardTitle>
                  <p className="text-xs text-foreground/60">
                    Sorted by client tier & urgency
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {getCounts().total} active notification{getCounts().total !== 1 ? 's' : ''}
                  </span>
                  {notifications.length > 4 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowNotificationsPanel(!showNotificationsPanel)}
                      className="text-gold-600 border-gold-300 hover:bg-gold-50"
                    >
                      {showNotificationsPanel ? 'Show Less' : 'View All'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(showNotificationsPanel ? notifications : notifications.slice(0, 4))
                  .sort((a, b) => {
                    // Sort by tier priority (tier 1 = highest priority), then by days waiting
                    const tierA = a.actions?.find(action => action.tier)?.tier || 5
                    const tierB = b.actions?.find(action => action.tier)?.tier || 5

                    if (tierA !== tierB) {
                      return tierA - tierB // Lower tier number = higher priority
                    }

                    // Within same tier, sort by days waiting (descending)
                    return (b.daysWaiting || 0) - (a.daysWaiting || 0)
                  })
                  .map(notification => {
                  const categoryConfig = {
                    URGENT: {
                      icon: AlertTriangle,
                      color: 'text-red-700 dark:text-red-400',
                      bgColor: 'bg-red-50 dark:bg-red-950/30',
                      borderColor: 'border-red-200 dark:border-red-800/50'
                    },
                    FOLLOW_UPS: {
                      icon: ClockIcon,
                      color: 'text-amber-700 dark:text-amber-400',
                      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
                      borderColor: 'border-amber-200 dark:border-amber-800/50'
                    },
                    ALLOCATIONS: {
                      icon: StarIcon,
                      color: 'text-emerald-700 dark:text-emerald-400',
                      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
                      borderColor: 'border-emerald-200 dark:border-emerald-800/50'
                    },
                    MESSAGES: {
                      icon: InboxIcon,
                      color: 'text-blue-700 dark:text-blue-400',
                      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
                      borderColor: 'border-blue-200 dark:border-blue-800/50'
                    },
                    OPPORTUNITIES: {
                      icon: FireIcon,
                      color: 'text-orange-700 dark:text-orange-400',
                      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
                      borderColor: 'border-orange-200 dark:border-orange-800/50'
                    },
                    SYSTEM: {
                      icon: InboxIcon,
                      color: 'text-gray-700 dark:text-gray-400',
                      bgColor: 'bg-gray-50 dark:bg-gray-950/30',
                      borderColor: 'border-gray-200 dark:border-gray-800/50'
                    }
                  }

                  const config = categoryConfig[notification.category]
                  const NotificationIcon = config.icon

                  return (
                    <motion.div
                      key={notification.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`p-4 md:p-6 rounded-lg border hover:shadow-lg transition-all duration-200 ${config.bgColor} ${config.borderColor} relative w-full`}
                    >
                      {/* Priority indicator for urgent notifications - Top Right */}
                      {notification.daysWaiting && notification.daysWaiting >= 7 && (
                        <Badge className="absolute top-3 right-3 md:top-4 md:right-4 bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700 text-xs md:text-sm font-semibold" variant="outline">
                          {notification.daysWaiting >= 14 ? 'URGENT' : 'Overdue'}
                        </Badge>
                      )}
                      <div className="space-y-3 md:space-y-4">
                        <div className="flex items-start gap-2 md:gap-3">
                          <NotificationIcon className={`h-5 w-5 md:h-6 md:w-6 ${config.color} flex-shrink-0 mt-0.5`} />
                          <div className="min-w-0 flex-1 pr-16 md:pr-20">
                            <div className="mb-1.5 md:mb-2">
                              <p className="font-semibold text-foreground break-words text-base md:text-lg">
                                {notification.clientName
                                  ? notification.title.replace(notification.clientName, '').replace(/^\s*[-–]\s*/, '').replace(/\s*[-–]\s*$/, '').trim()
                                  : notification.title}
                              </p>
                            </div>
                            {/* Client name on its own line */}
                            {notification.clientName && (
                              <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2 flex-wrap">
                                <p className="font-medium text-foreground/90 text-lg md:text-xl break-words">
                                  {notification.clientName}
                                </p>
                                {/* Tier indicator badge */}
                                {notification.actions?.find(a => a.tier) && (
                                  <Badge
                                    className={cn(
                                      "text-xs md:text-sm font-medium flex-shrink-0",
                                      notification.actions.find(a => a.tier)?.tier <= 2
                                        ? "bg-yellow-100 dark:bg-yellow-950 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700"
                                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
                                    )}
                                    variant="outline"
                                  >
                                    Tier {notification.actions.find(a => a.tier)?.tier}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <p className="text-sm md:text-base text-foreground/70 break-words">
                              {notification.clientName
                                ? notification.message.replace(notification.clientName, '').replace(/^\s*[-–]\s*/, '').trim()
                                : notification.message}
                            </p>
                            {(notification.daysWaiting || notification.lastContact) && (
                              <div className="flex flex-col gap-1.5 md:gap-2 mt-2 md:mt-3 text-xs md:text-sm text-gray-600 dark:text-gray-400">
                                {notification.daysWaiting && (
                                  <div className="flex items-center gap-1.5 md:gap-2">
                                    <ClockIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                    <span>{notification.daysWaiting} days since last contact</span>
                                  </div>
                                )}
                                {notification.lastContact && (
                                  <div className="flex items-center gap-1.5 md:gap-2">
                                    <PhoneIcon className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0" />
                                    <span>Last contact: {notification.lastContact}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className={`grid gap-2 ${notification.actions.length === 3 ? 'grid-cols-1 md:grid-cols-3' : notification.actions.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
                          {notification.actions.map((action, index) => (
                            <Button
                              key={index}
                              size="default"
                              variant={action.isPrimary ? "default" : "outline"}
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                console.log('Button clicked:', action.label, action.type)
                                handleNotificationAction(notification.id, action)
                              }}
                              className={cn(
                                action.isPrimary ? "bg-gold-600 hover:bg-gold-700 text-white" : "hover:bg-muted",
                                "transition-all duration-200 active:scale-95 cursor-pointer w-full h-11 md:h-10 text-sm md:text-base"
                              )}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
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
                <div className="space-y-4">
                  {clients
                    .filter(client => client.clientTier >= 1 && client.clientTier <= 2)
                    .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
                    .slice(0, 2)
                    .map((client, index) => (
                      <motion.div
                        key={client.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center gap-4 p-5 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30"
                        onClick={() => setSelectedClient(client)}
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-500 text-white font-bold text-lg flex-shrink-0">
                          {index + 1}
                        </div>
                        <Avatar className="h-14 w-14">
                          <AvatarFallback className={cn("text-white font-semibold text-lg", getVipTierColor(client.clientTier.toString()))}>
                            {client.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-lg text-foreground">{formatClientName(client.name)}</p>
                            <Badge variant="outline" className={cn("text-xs font-medium", getVipTierColor(client.clientTier.toString()))}>
                              Tier {client.clientTier}
                            </Badge>
                          </div>
                          <p className="text-base text-foreground/70 font-medium">
                            {formatCurrency(client.lifetimeSpend)} lifetime spend
                          </p>
                          <p className="text-sm text-foreground/60 mt-1">
                            {client.purchases?.length || 0} purchase{(client.purchases?.length || 0) !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </motion.div>
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
                    <span className="text-muted-foreground">Active Notifications</span>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {getCounts().total}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>


        {/* Notifications Panel - Integrated into main dashboard */}

        {/* Allocation Contact Panel */}
        <AllocationContactPanel
          isOpen={showAllocationPanel}
          onClose={() => setShowAllocationPanel(false)}
          watchId={selectedWatchForAllocation}
          onContactInitiated={(clientId, method) => {
            console.log(`Contact initiated: ${clientId} via ${method}`)
            // Handle allocation complete
          }}
        />

        {/* Client Modal */}
        {selectedClientForView && (
          <ClientModal
            selectedClient={getClientById(selectedClientForView) || null}
            onClose={() => {
              console.log('Closing client modal')
              setSelectedClientForView(null)
            }}
            onSave={(clientData) => {
              console.log('Saving client data:', clientData)
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
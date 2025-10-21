'use client'

import React, { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useNotifications } from '@/contexts/NotificationContext'
import { motion, useInView, useSpring, useTransform, AnimatePresence } from 'framer-motion'

// Lazy load heavy modals/panels
const AllocationContactPanel = dynamic(() => import('@/components/allocation/AllocationContactPanel').then(mod => ({ default: mod.AllocationContactPanel })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-400"></div></div>
})

const ClientModal = dynamic(() => import('@/components/clients/ClientModal').then(mod => ({ default: mod.ClientModal })), {
  ssr: false,
  loading: () => null
})

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
import { RevenueChart } from '@/components/analytics/RevenueChart'
import { PriorityActionsCard } from '@/components/dashboard/PriorityActionsCard'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'


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
    getWatchModelById,
    updateClient,
    isLoading,
    isInitialized
  } = useAppStore()

  const { notifications, getCounts, removeNotification, markAsRead, addNotification } = useNotifications()
  const counts = getCounts()

  // All hooks must be called before any conditional returns
  const [showAllocationPanel, setShowAllocationPanel] = useState(false)
  const [selectedWatchForAllocation, setSelectedWatchForAllocation] = useState<string>('')
  const [selectedClientForView, setSelectedClientForView] = useState<string | null>(null)

  // ⚠️ CRITICAL: Calculate analytics data BEFORE early return - useMemo is a HOOK
  const analytics = useMemo(() => {
    // Get current date info
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Calculate last month's date range
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1)
    const lastMonth = lastMonthDate.getMonth()
    const lastMonthYear = lastMonthDate.getFullYear()

    // Revenue calculation from actual purchases
    let currentMonthRevenue = 0
    let lastMonthRevenue = 0
    let currentMonthOrders = 0
    let lastMonthOrders = 0

    clients.forEach(client => {
      if (client.purchases && Array.isArray(client.purchases)) {
        client.purchases.forEach(purchase => {
          const purchaseDate = new Date(purchase.date)
          const purchaseMonth = purchaseDate.getMonth()
          const purchaseYear = purchaseDate.getFullYear()

          if (purchaseYear === currentYear && purchaseMonth === currentMonth) {
            currentMonthRevenue += purchase.price
            currentMonthOrders++
          } else if (purchaseYear === lastMonthYear && purchaseMonth === lastMonth) {
            lastMonthRevenue += purchase.price
            lastMonthOrders++
          }
        })
      }
    })

    // Calculate total revenue from all purchases for consistency
    const totalRevenue = clients.reduce((sum, client) => {
      if (client.purchases && Array.isArray(client.purchases)) {
        return sum + client.purchases.reduce((pSum, p) => pSum + p.price, 0)
      }
      return sum
    }, 0)

    // Calculate revenue change percentage
    const revenueChange = lastMonthRevenue > 0
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : 0

    const activeClients = clients.length

    // Calculate average order value from all purchases
    const totalOrders = clients.reduce((sum, client) =>
      sum + (client.purchases?.length || 0), 0
    )
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Calculate avg order value change
    const currentMonthAvg = currentMonthOrders > 0 ? currentMonthRevenue / currentMonthOrders : 0
    const lastMonthAvg = lastMonthOrders > 0 ? lastMonthRevenue / lastMonthOrders : 0
    const avgOrderChange = lastMonthAvg > 0
      ? ((currentMonthAvg - lastMonthAvg) / lastMonthAvg) * 100
      : 0

    // Calculate conversion rate (waitlist to purchase)
    const totalPurchases = totalOrders
    const totalWaitlist = waitlist.length
    const conversionRate = (totalWaitlist + totalPurchases) > 0
      ? (totalPurchases / (totalWaitlist + totalPurchases)) * 100
      : 0

    const availableWatches = watchModels.filter(w => w.availability === 'Available').length

    return {
      totalRevenue,
      activeClients,
      avgOrderValue,
      conversionRate,
      availableWatches,
      totalWaitlist,
      revenueChange,
      avgOrderChange,
      clientChange: 0 // We don't track client join dates yet
    }
  }, [clients, watchModels, waitlist])

  // Show loading skeleton while data initializes
  if (!isInitialized || isLoading) {
    return (
      <LenkersdorferSidebar>
        <DashboardSkeleton />
      </LenkersdorferSidebar>
    )
  }

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





  // Handle priority action card interactions
  const handlePriorityTextClient = (notification: any) => {
    const textAction = notification.actions?.find((a: any) => a.type === 'TEXT_CLIENT')
    if (textAction) {
      handleNotificationAction(notification.id, textAction)
    }
  }

  const handlePriorityCallClient = (notification: any) => {
    const callAction = notification.actions?.find((a: any) => a.type === 'CALL')
    if (callAction) {
      handleNotificationAction(notification.id, callAction)
    }
  }

  const handlePriorityViewClient = (clientId: string) => {
    setSelectedClientForView(clientId)
  }

  // Handle notification actions
  const handleNotificationAction = (notificationId: string, action: any) => {

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
          setSelectedClientForView(action.clientId)
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
        break
    }
  }

  // Metrics data with real calculations
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(analytics.totalRevenue),
      change: analytics.revenueChange !== 0
        ? `${analytics.revenueChange > 0 ? '+' : ''}${analytics.revenueChange.toFixed(1)}%`
        : "No data",
      changeType: (analytics.revenueChange >= 0 ? "positive" : "negative") as const,
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Active Clients",
      value: analytics.activeClients.toString(),
      change: analytics.clientChange !== 0
        ? `${analytics.clientChange > 0 ? '+' : ''}${analytics.clientChange.toFixed(1)}%`
        : "No change",
      changeType: (analytics.clientChange >= 0 ? "positive" : "negative") as const,
      icon: <Users className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Avg. Order Value",
      value: formatCurrency(analytics.avgOrderValue),
      change: analytics.avgOrderChange !== 0
        ? `${analytics.avgOrderChange > 0 ? '+' : ''}${analytics.avgOrderChange.toFixed(1)}%`
        : "No data",
      changeType: (analytics.avgOrderChange >= 0 ? "positive" : "negative") as const,
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />
    },
    {
      title: "Conversion Rate",
      value: `${analytics.conversionRate.toFixed(1)}%`,
      change: "Lifetime",
      changeType: "positive" as const,
      icon: <Watch className="h-4 w-4 text-muted-foreground" />
    }
  ]

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background">
        {/* Header with Alert Bell */}
        <div className="sticky top-0 z-10 bg-background md:static flex flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 lg:p-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Lenkersdorfer Analytics</h1>
            <p className="text-muted-foreground">Professional luxury watch sales dashboard</p>
          </div>

          {/* Notification Bell - Visible on all devices */}
          <Link href="/notifications">
            <Button
              variant="ghost"
              size="icon"
              className="relative hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors flex-shrink-0"
              title={`${counts.total} notifications`}
            >
              <Bell className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              {counts.total > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white"
                >
                  {counts.total > 9 ? '9+' : counts.total}
                </motion.span>
              )}
            </Button>
          </Link>
        </div>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 lg:px-8 pb-8">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {metrics.map((metric, index) => (
              <MetricCard
                key={metric.title}
                {...metric}
                className="transition-all duration-200 hover:shadow-lg hover:border-primary/20"
              />
            ))}
          </div>

          {/* Revenue Chart */}
          <div className="grid gap-6 mb-6">
            <RevenueChart clients={clients} />
          </div>

          {/* Dashboard Content - Priority-First Layout */}
          <div className="space-y-6">
            {/* Priority Actions - FULL WIDTH AT TOP */}
            <div className="w-full">
              <PriorityActionsCard
                notifications={notifications}
                onTextClient={handlePriorityTextClient}
                onCallClient={handlePriorityCallClient}
                onViewClient={handlePriorityViewClient}
              />
            </div>

            {/* Secondary Cards - Two Column Below */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Top VIP Clients */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Top VIP Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {clients.length === 0 ? (
                      <div className="text-center py-8">
                        <Crown className="h-12 w-12 mx-auto mb-4 opacity-50 text-yellow-500" />
                        <p className="text-sm text-muted-foreground">No VIP clients yet</p>
                        <p className="text-xs text-muted-foreground mt-2">Add clients to see your top performers here</p>
                      </div>
                    ) : (
                      clients
                        .sort((a, b) => b.lifetimeSpend - a.lifetimeSpend)
                        .slice(0, 3)
                        .map((client, index) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all cursor-pointer border border-transparent hover:border-yellow-500/30 hover:scale-105 active:scale-95"
                          onClick={() => setSelectedClientForView(client.id)}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-yellow-500 text-white font-bold text-sm flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm text-foreground truncate">{formatClientName(client.name)}</p>
                              <Badge variant="outline" className={cn("text-xs", getVipTierColor(client.clientTier.toString()))}>
                                T{client.clientTier}
                              </Badge>
                            </div>
                            <p className="text-xs text-foreground/70">
                              {formatCurrency(client.lifetimeSpend)} • {client.purchases?.length || 0} purchase{(client.purchases?.length || 0) !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                        ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                      <span className="text-sm text-foreground/80">Available Watches</span>
                      <Badge variant="outline" className="text-xs">{analytics.availableWatches}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                      <span className="text-sm text-foreground/80">Waitlist Entries</span>
                      <Badge variant="outline" className="text-xs">{analytics.totalWaitlist}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-all">
                      <span className="text-sm text-foreground/80">Active Notifications</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400">
                        {getCounts().total}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>


        {/* Notifications Panel - Integrated into main dashboard */}

        {/* Allocation Contact Panel */}
        <AllocationContactPanel
          isOpen={showAllocationPanel}
          onClose={() => setShowAllocationPanel(false)}
          watchId={selectedWatchForAllocation}
          onContactInitiated={(clientId, method) => {
            // Handle allocation complete
          }}
        />

        {/* Client Modal */}
        {selectedClientForView && (
          <ClientModal
            selectedClient={getClientById(selectedClientForView) || null}
            onClose={() => {
              setSelectedClientForView(null)
            }}
            onSave={(clientData) => {
              const client = getClientById(selectedClientForView)
              if (client) {
                updateClient(client.id, clientData)
              }
              setSelectedClientForView(null)
            }}
          />
        )}

      </div>
    </LenkersdorferSidebar>
  )
}
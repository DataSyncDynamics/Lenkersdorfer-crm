'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  ClockIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  TrophyIcon,
  CalendarIcon,
  ShoppingBagIcon,
  EyeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'

interface MetricCard {
  title: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon: React.ComponentType<{ className?: string }>
  gradient: string
  description?: string
}

interface ChartData {
  label: string
  value: number
  color: string
}

export default function AnalyticsDashboard() {
  const { clients, waitlist, watchModels } = useAppStore()

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    const totalSales = clients.reduce((sum, client) => sum + client.lifetimeSpend, 0)
    const totalClients = clients.length
    const avgOrderValue = totalSales / totalClients || 0

    // VIP tier distribution
    const vipDistribution = {
      Platinum: clients.filter(c => c.vipTier === 'Platinum').length,
      Gold: clients.filter(c => c.vipTier === 'Gold').length,
      Silver: clients.filter(c => c.vipTier === 'Silver').length,
      Bronze: clients.filter(c => c.vipTier === 'Bronze').length,
    }

    // Brand preferences
    const brandPreferences: { [key: string]: number } = {}
    clients.forEach(client => {
      client.preferredBrands.forEach(brand => {
        brandPreferences[brand] = (brandPreferences[brand] || 0) + 1
      })
    })

    // Watch availability
    const availableWatches = watchModels.filter(w => w.availability === 'Available').length
    const soldOutWatches = watchModels.filter(w => w.availability === 'Sold Out').length
    const incomingWatches = watchModels.filter(w => w.availability === 'Incoming').length

    // Waitlist analytics
    const totalWaitlist = waitlist.length
    const avgWaitTime = waitlist.reduce((sum, entry) => {
      const days = Math.floor((new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24))
      return sum + days
    }, 0) / waitlist.length || 0

    // Recent activity (last 30 days)
    const recentClients = clients.filter(client => {
      const purchaseDate = new Date(client.lastPurchase)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return purchaseDate >= thirtyDaysAgo
    })

    return {
      totalSales,
      totalClients,
      avgOrderValue,
      vipDistribution,
      brandPreferences,
      availableWatches,
      soldOutWatches,
      incomingWatches,
      totalWaitlist,
      avgWaitTime,
      recentActivity: recentClients.length,
      conversionRate: ((totalClients / (totalClients + totalWaitlist)) * 100) || 0,
      vipPercentage: ((vipDistribution.Platinum + vipDistribution.Gold) / totalClients * 100) || 0
    }
  }, [clients, waitlist, watchModels])

  const metricCards: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: formatCurrency(analytics.totalSales),
      change: '+12.5%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      gradient: 'from-gold-400 to-gold-600',
      description: 'Total lifetime client value'
    },
    {
      title: 'VIP Clients',
      value: `${analytics.vipPercentage.toFixed(1)}%`,
      change: '+3.2%',
      changeType: 'positive',
      icon: TrophyIcon,
      gradient: 'from-purple-400 to-purple-600',
      description: 'Platinum & Gold tier clients'
    },
    {
      title: 'Conversion Rate',
      value: `${analytics.conversionRate.toFixed(1)}%`,
      change: '+5.1%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      gradient: 'from-green-400 to-green-600',
      description: 'Waitlist to purchase conversion'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(analytics.avgOrderValue),
      change: '+8.3%',
      changeType: 'positive',
      icon: ShoppingBagIcon,
      gradient: 'from-blue-400 to-blue-600',
      description: 'Average client lifetime spend'
    },
    {
      title: 'Active Waitlist',
      value: analytics.totalWaitlist,
      change: analytics.avgWaitTime.toFixed(0) + ' days avg',
      changeType: 'neutral',
      icon: ClockIcon,
      gradient: 'from-amber-400 to-amber-600',
      description: 'Clients waiting for allocation'
    },
    {
      title: 'Available Inventory',
      value: analytics.availableWatches,
      change: `${analytics.incomingWatches} incoming`,
      changeType: 'positive',
      icon: EyeIcon,
      gradient: 'from-indigo-400 to-indigo-600',
      description: 'Watches ready for allocation'
    }
  ]

  const vipChartData: ChartData[] = [
    { label: 'Platinum', value: analytics.vipDistribution.Platinum, color: '#8B5CF6' },
    { label: 'Gold', value: analytics.vipDistribution.Gold, color: '#D4AF37' },
    { label: 'Silver', value: analytics.vipDistribution.Silver, color: '#94A3B8' },
    { label: 'Bronze', value: analytics.vipDistribution.Bronze, color: '#FB923C' }
  ]

  const topBrands = Object.entries(analytics.brandPreferences)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([brand, count]) => ({ label: brand, value: count, color: '#D4AF37' }))

  const inventoryData: ChartData[] = [
    { label: 'Available', value: analytics.availableWatches, color: '#22C55E' },
    { label: 'Sold Out', value: analytics.soldOutWatches, color: '#EF4444' },
    { label: 'Incoming', value: analytics.incomingWatches, color: '#3B82F6' }
  ]

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="col-span-1 lg:col-span-1 relative overflow-hidden bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 lg:p-6 hover:bg-white/10 hover:border-white/20 hover:scale-105 transition-all duration-300 cursor-pointer group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 lg:p-3 rounded-xl bg-white/10 backdrop-blur-sm">
                    <Icon className="w-4 h-4 lg:w-5 lg:h-5 text-white" />
                  </div>
                  {metric.change && (
                    <span className={`text-xs lg:text-sm font-medium px-2 py-1 rounded-full ${
                      metric.changeType === 'positive'
                        ? 'text-green-400 bg-green-400/20'
                        : metric.changeType === 'negative'
                        ? 'text-red-400 bg-red-400/20'
                        : 'text-gray-400 bg-gray-400/20'
                    }`}>
                      {metric.change}
                    </span>
                  )}
                </div>
                <div className="text-xl lg:text-2xl font-bold text-white mb-1">{metric.value}</div>
                <div className="text-sm text-gray-400 mb-1">{metric.title}</div>
                {metric.description && (
                  <div className="text-xs text-gray-500">{metric.description}</div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* VIP Tier Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <h4 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <StarIcon className="w-5 h-5 text-gold-400" />
            VIP Tier Distribution
          </h4>
          <div className="space-y-4">
            {vipChartData.map((item, index) => {
              const percentage = analytics.totalClients > 0 ? (item.value / analytics.totalClients * 100) : 0
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm lg:text-base">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{item.value}</span>
                      <span className="text-gray-400 text-sm">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.5 + index * 0.1, duration: 0.8 }}
                      className="h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Top Brands */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <h4 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-gold-400" />
            Popular Brands
          </h4>
          <div className="space-y-4">
            {topBrands.map((brand, index) => {
              const maxValue = Math.max(...topBrands.map(b => b.value))
              const percentage = (brand.value / maxValue * 100)
              return (
                <div key={brand.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300 text-sm lg:text-base">{brand.label}</span>
                    <span className="text-white font-semibold">{brand.value} clients</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.8 }}
                      className="h-2 rounded-full bg-gradient-to-r from-gold-400 to-gold-600"
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* Inventory Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.3 }}
          className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
        >
          <h4 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <ChartBarIcon className="w-5 h-5 text-gold-400" />
            Inventory Status
          </h4>
          <div className="space-y-4">
            {inventoryData.map((item, index) => {
              const total = inventoryData.reduce((sum, i) => sum + i.value, 0)
              const percentage = total > 0 ? (item.value / total * 100) : 0
              return (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-gray-300 text-sm lg:text-base">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{item.value}</span>
                      <span className="text-gray-400 text-sm">({percentage.toFixed(1)}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ delay: 0.7 + index * 0.1, duration: 0.8 }}
                      className="h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
      >
        {/* Key Insights */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <h4 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-400" />
            Key Insights
          </h4>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-400/10 border border-green-400/20 rounded-xl">
              <CheckCircleIcon className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-green-400 font-medium text-sm lg:text-base">High VIP Conversion</div>
                <div className="text-gray-300 text-sm">{analytics.vipPercentage.toFixed(1)}% of clients are VIP tier, indicating strong relationship building</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-400/10 border border-amber-400/20 rounded-xl">
              <ClockIcon className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-amber-400 font-medium text-sm lg:text-base">Waitlist Management</div>
                <div className="text-gray-300 text-sm">Average wait time of {analytics.avgWaitTime.toFixed(0)} days - consider allocation optimization</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-400/10 border border-blue-400/20 rounded-xl">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-blue-400 font-medium text-sm lg:text-base">Strong Performance</div>
                <div className="text-gray-300 text-sm">{analytics.conversionRate.toFixed(1)}% conversion rate shows excellent sales efficiency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 lg:p-8 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
          <h4 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-gold-400" />
            Recent Performance (30 Days)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-2xl lg:text-3xl font-bold text-gold-400 mb-1">{analytics.recentActivity}</div>
              <div className="text-sm lg:text-base text-gray-400">Active Clients</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-2xl lg:text-3xl font-bold text-green-400 mb-1">+127%</div>
              <div className="text-sm lg:text-base text-gray-400">Sales Growth</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-2xl lg:text-3xl font-bold text-purple-400 mb-1">95%</div>
              <div className="text-sm lg:text-base text-gray-400">Allocation Success</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200">
              <div className="text-2xl lg:text-3xl font-bold text-blue-400 mb-1">4.8</div>
              <div className="text-sm lg:text-base text-gray-400">Satisfaction</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
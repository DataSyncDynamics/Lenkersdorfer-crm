'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { createNotificationService } from '@/services/notificationService'
import { motion } from 'framer-motion'
import { formatCurrency } from '@/lib/store'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { getStatusColorClasses, getUrgencyColorClasses } from '@/lib/ui-utils'
import {
  Zap,
  Phone,
  Calendar,
  User,
  Clock,
  DollarSign,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function GreenBoxPage() {
  const {
    clients,
    waitlist,
    watchModels,
    getPerfectMatches,
    getCriticalAlerts,
    getClientById,
    getWatchModelById
  } = useAppStore()

  const [perfectMatches, setPerfectMatches] = useState<any[]>([])
  const [criticalAlerts, setCriticalAlerts] = useState<any[]>([])
  const [selectedMatch, setSelectedMatch] = useState<any>(null)

  useEffect(() => {
    // Get Green Box matches from the store
    const matches = getPerfectMatches()
    const critical = getCriticalAlerts()

    setPerfectMatches(matches)
    setCriticalAlerts(critical)
  }, [clients, waitlist, watchModels])


  const handleCallClient = (match: any) => {
    const client = getClientById(match.clientId)
    if (client) {
      window.open(`tel:${client.phone}`, '_self')
    }
  }

  const handleScheduleMeeting = (match: any) => {
    const client = getClientById(match.clientId)
    if (client) {
      // This would integrate with calendar system
      alert(`📅 Meeting scheduled with ${client.name}`)
    }
  }

  const handleAllocateWatch = (match: any) => {
    const client = getClientById(match.clientId)
    const watch = getWatchModelById(match.watchModelId)
    if (client && watch) {
      alert(`✅ ${watch.brand} ${watch.model} allocated to ${client.name}`)
    }
  }

  return (
    <LenkersdorferSidebar>
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Allocation System</h1>
          </div>
          <p className="text-muted-foreground">
            Perfect client-watch tier matches for maximum revenue opportunity
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-lg p-6 border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                <p className="text-2xl font-bold text-foreground">{perfectMatches.length}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-lg p-6 border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600">{criticalAlerts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-lg p-6 border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Perfect Matches</p>
                <p className="text-2xl font-bold text-green-600">
                  {perfectMatches.filter(m => m.status === 'GREEN').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-lg p-6 border"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Priority Score</p>
                <p className="text-2xl font-bold text-foreground">
                  {perfectMatches.length > 0
                    ? Math.round(perfectMatches.reduce((sum, m) => sum + m.priorityScore, 0) / perfectMatches.length)
                    : 0
                  }
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </motion.div>
        </div>

        {/* Green Box Matches List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-lg border"
        >
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-foreground">Green Box Matches</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Sorted by urgency and priority score
            </p>
          </div>

          <div className="p-6 space-y-4">
            {perfectMatches.length === 0 ? (
              <div className="text-center py-12">
                <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Green Box Matches</h3>
                <p className="text-muted-foreground">
                  No tier-matched allocations available at this time.
                </p>
              </div>
            ) : (
              perfectMatches.map((match, index) => {
                const client = getClientById(match.clientId)
                const watch = getWatchModelById(match.watchModelId)

                if (!client || !watch) return null

                return (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColorClasses(match.status)}`}>
                            {match.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColorClasses(match.urgencyLevel)}`}>
                            {match.urgencyLevel}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm font-medium">{match.priorityScore}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h3 className="font-semibold text-foreground flex items-center gap-2">
                              <User className="h-4 w-4" />
                              {client.name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Tier {client.clientTier} • {formatCurrency(client.lifetimeSpend)} lifetime
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {client.spendPercentile}th percentile
                            </p>
                          </div>

                          <div>
                            <h3 className="font-semibold text-foreground">
                              {watch.brand} {watch.model}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              Tier {watch.watchTier} • {formatCurrency(watch.price)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {watch.rarityDescription}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{match.daysWaiting} days waiting</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>{formatCurrency(match.lifetimeSpend)}</span>
                          </div>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 mb-4">
                          <p className="text-sm font-medium text-foreground mb-1">Action Required:</p>
                          <p className="text-sm text-muted-foreground">{match.callToAction}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4 border-t">
                      <button
                        onClick={() => handleCallClient(match)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                        Call Now
                      </button>
                      <button
                        onClick={() => handleScheduleMeeting(match)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule
                      </button>
                      <button
                        onClick={() => handleAllocateWatch(match)}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Zap className="h-4 w-4" />
                        Allocate
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.div>
        </div>
      </div>
    </LenkersdorferSidebar>
  )
}
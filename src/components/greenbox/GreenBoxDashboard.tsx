'use client'

import React from 'react'
import { useAppStore } from '@/lib/store'
import { GreenBoxMatch } from '@/types'

interface GreenBoxCardProps {
  match: GreenBoxMatch
}

const GreenBoxCard: React.FC<GreenBoxCardProps> = ({ match }) => {
  const { getClientById, getWatchModelById, getClientTierInfo, getWatchTierInfo } = useAppStore()

  const client = getClientById(match.clientId)
  const watch = getWatchModelById(match.watchModelId)
  const clientTierInfo = getClientTierInfo(match.clientTier)
  const watchTierInfo = getWatchTierInfo(match.watchTier)

  if (!client || !watch) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'bg-green-100 border-green-500 text-green-800'
      case 'YELLOW': return 'bg-yellow-100 border-yellow-500 text-yellow-800'
      case 'RED': return 'bg-red-100 border-red-500 text-red-800'
      default: return 'bg-gray-100 border-gray-500 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL': return 'bg-red-600 text-white'
      case 'HIGH': return 'bg-orange-500 text-white'
      case 'MEDIUM': return 'bg-yellow-500 text-white'
      case 'LOW': return 'bg-gray-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className={`border-l-4 p-4 rounded-lg shadow-sm ${getStatusColor(match.status)}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${getUrgencyColor(match.urgencyLevel)}`}>
            {match.urgencyLevel}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-medium ${match.status === 'GREEN' ? 'bg-green-200 text-green-800' : match.status === 'YELLOW' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'}`}>
            {match.status} BOX
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">Score: {match.priorityScore}</div>
          <div className="text-xs text-gray-600">{match.daysWaiting} days waiting</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <h4 className="font-semibold text-gray-900">{client.name}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 rounded text-xs ${clientTierInfo.color}`}>
              Tier {match.clientTier}: {clientTierInfo.name}
            </span>
            <span className="text-xs text-gray-600">
              {match.spendPercentile}th percentile
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            Lifetime: ${match.lifetimeSpend.toLocaleString()}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-gray-900">{watch.brand} {watch.model}</h4>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-2 py-1 rounded text-xs ${watchTierInfo.color}`}>
              Tier {match.watchTier}: {watchTierInfo.name}
            </span>
          </div>
          <div className="text-sm text-gray-700 mt-1">
            {watch.collection}
          </div>
          <div className="text-sm font-medium text-gray-900">
            ${watch.price.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-white bg-opacity-60 p-3 rounded">
        <h5 className="font-medium text-gray-900 mb-1">Action Required:</h5>
        <p className="text-sm text-gray-800">{match.callToAction}</p>
      </div>
    </div>
  )
}

const GreenBoxDashboard: React.FC = () => {
  const { getGreenBoxMatches, getCriticalGreenBoxAlerts } = useAppStore()

  const allMatches = getGreenBoxMatches()
  const criticalAlerts = getCriticalGreenBoxAlerts()
  const greenMatches = allMatches.filter(m => m.status === 'GREEN')
  const yellowMatches = allMatches.filter(m => m.status === 'YELLOW')
  const redMatches = allMatches.filter(m => m.status === 'RED')

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">GREEN BOX Allocation System</h2>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{criticalAlerts.length}</div>
            <div className="text-sm text-gray-600">Critical Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{greenMatches.length}</div>
            <div className="text-sm text-gray-600">Perfect Matches</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{yellowMatches.length}</div>
            <div className="text-sm text-gray-600">Upgrade Opportunities</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500">{redMatches.length}</div>
            <div className="text-sm text-gray-600">Tier Mismatches</div>
          </div>
        </div>
      </div>

      {criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
            🚨 CRITICAL GREEN BOX ALERTS - IMMEDIATE ACTION REQUIRED
          </h3>
          <div className="space-y-4">
            {criticalAlerts.map(match => (
              <GreenBoxCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {greenMatches.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
            ✅ GREEN BOX Perfect Matches
          </h3>
          <div className="space-y-4">
            {greenMatches.map(match => (
              <GreenBoxCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {yellowMatches.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-yellow-900 mb-4 flex items-center">
            ⚡ YELLOW BOX Upgrade Opportunities
          </h3>
          <div className="space-y-4">
            {yellowMatches.map(match => (
              <GreenBoxCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      {redMatches.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            ❌ RED BOX Tier Mismatches
          </h3>
          <div className="space-y-4">
            {redMatches.map(match => (
              <GreenBoxCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">GREEN BOX System Legend</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="font-medium">GREEN BOX</span>
            </div>
            <p className="text-sm text-gray-600">Client tier = Watch tier. Perfect match for immediate allocation.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span className="font-medium">YELLOW BOX</span>
            </div>
            <p className="text-sm text-gray-600">Client tier &gt; Watch tier. Upgrade opportunity to higher tier watch.</p>
          </div>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="font-medium">RED BOX</span>
            </div>
            <p className="text-sm text-gray-600">Client tier &lt; Watch tier. Build relationship before allocation.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GreenBoxDashboard
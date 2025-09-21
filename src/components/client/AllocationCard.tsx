'use client'

import { useState } from 'react'
import { AllocationSuggestion, Client } from '@/types'
import { formatCurrency } from '@/lib/store'
import {
  TrophyIcon,
  StarIcon,
  PhoneIcon,
  CheckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface AllocationCardProps {
  suggestion: AllocationSuggestion & { client: Client }
  rank: number
  onAllocate: (clientId: string) => void
  onCall: (clientId: string) => void
}

export default function AllocationCard({
  suggestion,
  rank,
  onAllocate,
  onCall,
}: AllocationCardProps) {
  const [isAllocating, setIsAllocating] = useState(false)

  const getVipStars = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 5
      case 'Gold': return 4
      case 'Silver': return 3
      case 'Bronze': return 2
      default: return 1
    }
  }

  const getRankColor = (position: number) => {
    if (position === 1) return 'bg-gold-500 text-black border-gold-400'
    if (position === 2) return 'bg-silver-400 text-black border-silver-300'
    if (position === 3) return 'bg-orange-500 text-white border-orange-400'
    return 'bg-gray-600 text-white border-gray-500'
  }

  const getRankIcon = (position: number) => {
    if (position <= 3) return <TrophyIcon className="h-4 w-4" />
    return position
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-gold-400'
    if (score >= 60) return 'text-green-400'
    if (score >= 40) return 'text-yellow-400'
    return 'text-gray-400'
  }

  const handleAllocate = async () => {
    setIsAllocating(true)
    // Add haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Simulate allocation process
    setTimeout(() => {
      onAllocate(suggestion.clientId)
      setIsAllocating(false)
    }, 1000)
  }

  const stars = getVipStars(suggestion.client.vipTier)

  return (
    <div className="luxury-card luxury-card-hover p-4 mb-4">
      <div className="flex items-start space-x-4">
        {/* Rank Badge */}
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-bold text-sm ${getRankColor(rank)}`}>
            {getRankIcon(rank)}
          </div>
        </div>

        {/* Client Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {suggestion.client.name}
            </h3>
            <div className="flex items-center">
              {Array.from({ length: 5 }, (_, i) => (
                <StarIcon
                  key={i}
                  className={`h-4 w-4 ${
                    i < stars ? 'text-gold-400 fill-current' : 'text-gray-600'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* VIP Tier and Score */}
          <div className="flex items-center space-x-3 mb-3">
            <span className={`vip-badge ${
              suggestion.client.vipTier === 'Platinum' ? 'vip-platinum' :
              suggestion.client.vipTier === 'Gold' ? 'vip-gold' :
              suggestion.client.vipTier === 'Silver' ? 'vip-silver' : 'vip-bronze'
            }`}>
              {suggestion.client.vipTier}
            </span>
            <div className={`text-lg font-bold ${getScoreColor(suggestion.score)}`}>
              {suggestion.score} pts
            </div>
          </div>

          {/* Lifetime Spend */}
          <div className="mb-3">
            <div className="text-xl font-bold text-gold-400">
              {formatCurrency(suggestion.client.lifetimeSpend)}
            </div>
            <div className="text-xs text-gray-500">Lifetime Spend</div>
          </div>

          {/* Allocation Reasons */}
          <div className="mb-4">
            <div className="text-sm font-medium text-gray-300 mb-2">
              Why this client?
            </div>
            <div className="space-y-1">
              {suggestion.reasons.slice(0, 3).map((reason, index) => (
                <div key={index} className="flex items-center text-sm text-gray-400">
                  <div className="w-1.5 h-1.5 bg-gold-400 rounded-full mr-2" />
                  {reason}
                </div>
              ))}
              {suggestion.reasons.length > 3 && (
                <div className="text-xs text-gray-500">
                  +{suggestion.reasons.length - 3} more reasons
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => onCall(suggestion.clientId)}
              className="luxury-button-secondary flex-1 flex items-center justify-center"
            >
              <PhoneIcon className="h-4 w-4 mr-2" />
              Call
            </button>
            <button
              onClick={handleAllocate}
              disabled={isAllocating}
              className={`luxury-button-primary flex-1 flex items-center justify-center ${
                isAllocating ? 'opacity-75 cursor-not-allowed' : ''
              }`}
            >
              {isAllocating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2" />
                  Allocating...
                </>
              ) : (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Allocate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Client Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-lg">
            {suggestion.client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Success State */}
      {isAllocating && (
        <div className="mt-4 p-3 bg-success-900/20 border border-success-500/30 rounded-lg">
          <div className="flex items-center text-success-400">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-success-400 mr-2" />
            Processing allocation...
          </div>
        </div>
      )}
    </div>
  )
}
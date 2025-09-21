'use client'

import { useState, useRef } from 'react'
import { WaitlistEntry, Client, WatchModel } from '@/types'
import { formatCurrency } from '@/lib/store'
import {
  ClockIcon,
  StarIcon,
  TrashIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface WaitlistCardProps {
  entry: WaitlistEntry & { client: Client }
  watch: WatchModel
  position: number
  onRemove: (entryId: string) => void
  onSwipeLeft?: (entryId: string) => void
  onSwipeRight?: (entryId: string) => void
}

export default function WaitlistCard({
  entry,
  watch,
  position,
  onRemove,
  onSwipeLeft,
  onSwipeRight
}: WaitlistCardProps) {
  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const startX = useRef<number>(0)
  const currentX = useRef<number>(0)

  const getVipStars = (tier: string) => {
    switch (tier) {
      case 'Platinum': return 5
      case 'Gold': return 4
      case 'Silver': return 3
      case 'Bronze': return 2
      default: return 1
    }
  }

  const getPositionColor = (pos: number) => {
    if (pos === 1) return 'bg-gold-500 text-black'
    if (pos === 2) return 'bg-silver-400 text-black'
    if (pos === 3) return 'bg-orange-500 text-white'
    return 'bg-gray-600 text-white'
  }

  const daysWaiting = Math.floor(
    (new Date().getTime() - new Date(entry.dateAdded).getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startX.current) return

    currentX.current = e.touches[0].clientX
    const diffX = currentX.current - startX.current

    if (diffX > 50) {
      setIsSwipingRight(true)
      setIsSwipingLeft(false)
    } else if (diffX < -50) {
      setIsSwipingLeft(true)
      setIsSwipingRight(false)
    } else {
      setIsSwipingLeft(false)
      setIsSwipingRight(false)
    }
  }

  const handleTouchEnd = () => {
    const diffX = currentX.current - startX.current

    if (diffX > 100 && onSwipeRight) {
      onSwipeRight(entry.id)
    } else if (diffX < -100 && onSwipeLeft) {
      onSwipeLeft(entry.id)
    }

    setIsSwipingLeft(false)
    setIsSwipingRight(false)
    startX.current = 0
    currentX.current = 0
  }

  const stars = getVipStars(entry.client.vipTier)

  return (
    <div
      className={`luxury-card p-4 mb-3 transition-all duration-300 ${
        isSwipingLeft ? 'translate-x-4 bg-red-900/20' : ''
      } ${isSwipingRight ? '-translate-x-4 bg-green-900/20' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-start space-x-4">
        {/* Position Badge */}
        <div className="flex-shrink-0">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${getPositionColor(position)}`}>
            {position}
          </div>
        </div>

        {/* Client Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white truncate">
              {entry.client.name}
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

          {/* VIP Tier and Wait Time */}
          <div className="flex items-center space-x-3 mb-2">
            <span className={`vip-badge ${
              entry.client.vipTier === 'Platinum' ? 'vip-platinum' :
              entry.client.vipTier === 'Gold' ? 'vip-gold' :
              entry.client.vipTier === 'Silver' ? 'vip-silver' : 'vip-bronze'
            }`}>
              {entry.client.vipTier}
            </span>
            <div className="flex items-center text-sm text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              {daysWaiting} day{daysWaiting !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Lifetime Spend */}
          <div className="mb-2">
            <div className="text-lg font-bold text-gold-400">
              {formatCurrency(entry.client.lifetimeSpend)}
            </div>
            <div className="text-xs text-gray-500">Lifetime Spend</div>
          </div>

          {/* Notes */}
          {entry.notes && (
            <div className="mb-3">
              <div className="text-sm text-gray-300 bg-gray-800 rounded-lg px-3 py-2">
                {entry.notes}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex items-center space-x-4">
            <button
              className="touch-target text-gray-400 hover:text-white transition-colors"
              onClick={() => window.location.href = `tel:${entry.client.phone}`}
            >
              <PhoneIcon className="h-5 w-5" />
            </button>
            <button
              className="touch-target text-gray-400 hover:text-red-400 transition-colors"
              onClick={() => onRemove(entry.id)}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Client Avatar */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-sm">
            {entry.client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        </div>
      </div>

      {/* Swipe Indicators */}
      {(isSwipingLeft || isSwipingRight) && (
        <div className="swipe-indicator">
          {isSwipingLeft ? '← Remove' : '→ Call Client'}
        </div>
      )}
    </div>
  )
}
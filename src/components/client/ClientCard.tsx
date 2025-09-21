'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Client } from '@/types'
import {
  PhoneIcon,
  EnvelopeIcon,
  ChevronRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface ClientCardProps {
  client: Client
  onSwipeLeft?: (clientId: string) => void
  onSwipeRight?: (clientId: string) => void
}

export default function ClientCard({ client, onSwipeLeft, onSwipeRight }: ClientCardProps) {
  const [isSwipingLeft, setIsSwipingLeft] = useState(false)
  const [isSwipingRight, setIsSwipingRight] = useState(false)
  const startX = useRef<number>(0)
  const currentX = useRef<number>(0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getVipBadgeClass = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 'vip-badge vip-platinum'
      case 'Gold':
        return 'vip-badge vip-gold'
      case 'Silver':
        return 'vip-badge vip-silver'
      case 'Bronze':
        return 'vip-badge vip-bronze'
      default:
        return 'vip-badge vip-bronze'
    }
  }

  const getVipStars = (tier: string) => {
    switch (tier) {
      case 'Platinum':
        return 5
      case 'Gold':
        return 4
      case 'Silver':
        return 3
      case 'Bronze':
        return 2
      default:
        return 1
    }
  }

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
      onSwipeRight(client.id)
    } else if (diffX < -100 && onSwipeLeft) {
      onSwipeLeft(client.id)
    }

    setIsSwipingLeft(false)
    setIsSwipingRight(false)
    startX.current = 0
    currentX.current = 0
  }

  const lastPurchaseDate = new Date(client.lastPurchase).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  })

  const stars = getVipStars(client.vipTier)

  return (
    <div
      className={`luxury-card luxury-card-hover p-4 mb-4 transition-all duration-300 ${
        isSwipingLeft ? 'translate-x-4 bg-red-900/20' : ''
      } ${isSwipingRight ? '-translate-x-4 bg-green-900/20' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <Link href={`/clients/${client.id}`} className="block">
        <div className="flex items-start justify-between">
          {/* Client Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white truncate mr-2">
                {client.name}
              </h3>
              <div className="flex items-center">
                {Array.from({ length: 5 }, (_, i) => (
                  <StarIcon
                    key={i}
                    className={`h-4 w-4 ${
                      i < stars
                        ? 'text-gold-400 fill-current'
                        : 'text-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center mb-3">
              <span className={getVipBadgeClass(client.vipTier)}>
                {client.vipTier}
              </span>
              <span className="ml-2 text-sm text-gray-400">
                Since {new Date(client.joinDate).getFullYear()}
              </span>
            </div>

            {/* Lifetime Spend - Prominent Display */}
            <div className="mb-3">
              <div className="text-2xl font-bold text-gold-400">
                {formatCurrency(client.lifetimeSpend)}
              </div>
              <div className="text-xs text-gray-500">
                Lifetime Spend
              </div>
            </div>

            {/* Last Purchase */}
            <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
              <span>Last purchase: {lastPurchaseDate}</span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-4">
              <button
                className="touch-target text-gray-400 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `tel:${client.phone}`
                }}
              >
                <PhoneIcon className="h-5 w-5" />
              </button>
              <button
                className="touch-target text-gray-400 hover:text-white transition-colors"
                onClick={(e) => {
                  e.preventDefault()
                  window.location.href = `mailto:${client.email}`
                }}
              >
                <EnvelopeIcon className="h-5 w-5" />
              </button>
              <div className="flex-1" />
              <ChevronRightIcon className="h-5 w-5 text-gray-500" />
            </div>
          </div>

          {/* Client Avatar */}
          <div className="ml-4 flex-shrink-0">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-black font-bold text-lg">
              {client.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
          </div>
        </div>

        {/* Swipe Indicators */}
        {(isSwipingLeft || isSwipingRight) && (
          <div className="swipe-indicator">
            {isSwipingLeft ? '← Archive' : '→ Quick Call'}
          </div>
        )}
      </Link>
    </div>
  )
}
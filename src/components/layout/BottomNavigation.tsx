"use client"

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Users,
  Zap,
  MessageSquare,
  Watch,
  Bell
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { triggerHapticFeedback } from '@/lib/haptic-utils'

interface NavItem {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: number
}

interface BottomNavigationProps {
  messageCount?: number
  alertCount?: number
}

export function BottomNavigation({
  messageCount = 0,
  alertCount = 0
}: BottomNavigationProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [isAtTop, setIsAtTop] = useState(true)

  const navItems: NavItem[] = [
    {
      href: '/',
      icon: Home,
      label: 'Home',
    },
    {
      href: '/clients',
      icon: Users,
      label: 'Clients',
    },
    {
      href: '/allocation',
      icon: Zap,
      label: 'Allocation',
    },
    {
      href: '/messages',
      icon: MessageSquare,
      label: 'Messages',
      badge: messageCount,
    },
    {
      href: '/notifications',
      icon: Bell,
      label: 'Alerts',
      badge: alertCount,
    },
    {
      href: '/waitlist',
      icon: Watch,
      label: 'Waitlist',
    },
  ]

  const handleNavClick = () => {
    triggerHapticFeedback('light')
  }

  // Scroll detection with throttling
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleScroll = () => {
      if (timeoutId) return // Skip if already scheduled

      timeoutId = setTimeout(() => {
        const currentScrollY = window.scrollY
        const scrollThreshold = 10 // Minimum scroll distance to trigger hide/show

        // Check if at top of page
        setIsAtTop(currentScrollY < 50)

        // Determine scroll direction
        if (Math.abs(currentScrollY - lastScrollY) > scrollThreshold) {
          if (currentScrollY > lastScrollY && currentScrollY > 100) {
            // Scrolling down & not at top - hide nav
            setIsVisible(false)
          } else {
            // Scrolling up or at top - show nav
            setIsVisible(true)
          }
          setLastScrollY(currentScrollY)
        }

        timeoutId = null
      }, 50) // Throttle to 50ms
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [lastScrollY])

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-neutral-900/95 backdrop-blur-lg border-t border-neutral-800 safe-area-bottom transition-transform duration-300 ease-in-out"
      style={{
        transform: isVisible ? 'translateY(0)' : 'translateY(100%)'
      }}
    >
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          // Only show badge if count is a number greater than 0
          const showBadge = typeof item.badge === 'number' && item.badge > 0

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={handleNavClick}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full transition-all duration-200",
                "hover:bg-neutral-800/50 rounded-lg",
                isActive && "text-gold-400"
              )}
            >
              {/* Active indicator */}
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gold-400 rounded-full" />
              )}

              {/* Icon with badge */}
              <div className="relative flex items-center justify-center w-6 h-6">
                <Icon
                  className={cn(
                    "h-6 w-6 transition-colors duration-200",
                    isActive ? "text-gold-400" : "text-neutral-400"
                  )}
                />
                {showBadge && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1"
                  >
                    {item.badge! > 99 ? '99+' : item.badge}
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <span
                className={cn(
                  "text-[10px] font-medium mt-1 transition-colors duration-200",
                  isActive ? "text-gold-400" : "text-neutral-400"
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

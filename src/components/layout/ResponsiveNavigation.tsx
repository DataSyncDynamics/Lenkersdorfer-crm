'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  UserGroupIcon,
  ClockIcon,
  PlusIcon,
  BellIcon,
  ChartBarIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  StarIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline'
import {
  UserGroupIcon as UserGroupSolid,
  ClockIcon as ClockSolid,
  PlusIcon as PlusSolid,
  BellIcon as BellSolid,
  ChartBarIcon as ChartBarSolid,
  HomeIcon as HomeSolid,
  StarIcon as StarSolid,
  CloudArrowUpIcon as CloudArrowUpSolid
} from '@heroicons/react/24/solid'
import { useState, useEffect } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { ThemeToggle } from '@/components/ui/theme-toggle'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
}

// Navigation items without badges - badges will be added dynamically
const baseNavigation: Omit<NavItem, 'badge'>[] = [
  {
    name: 'Home',
    href: '/',
    icon: HomeIcon,
    activeIcon: HomeSolid,
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: UserGroupIcon,
    activeIcon: UserGroupSolid,
  },
  {
    name: 'Waitlist',
    href: '/waitlist',
    icon: ClockIcon,
    activeIcon: ClockSolid,
  },
  {
    name: 'Allocation',
    href: '/allocation',
    icon: ChartBarIcon,
    activeIcon: ChartBarSolid,
  },
  {
    name: 'Import',
    href: '/import',
    icon: CloudArrowUpIcon,
    activeIcon: CloudArrowUpSolid,
  },
]

interface ResponsiveNavigationProps {
  className?: string
}

export default function ResponsiveNavigation({ className = '' }: ResponsiveNavigationProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const { getCounts } = useNotifications()

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Get notification counts and create navigation with dynamic badges
  const counts = getCounts()
  const navigation: NavItem[] = baseNavigation.map(item => {
    let badge = 0

    // Assign badges based on page relevance
    switch (item.href) {
      case '/waitlist':
        badge = (counts.byCategory.VIP_WAITING || 0) + (counts.byCategory.FOLLOW_UPS || 0)
        break
      case '/allocation':
        badge = counts.byCategory.NEW_ARRIVALS || 0
        break
      case '/clients':
        badge = (counts.byCategory.HOT_LEADS || 0) + (counts.byCategory.GREEN_BOX || 0)
        break
      default:
        badge = 0
    }

    return { ...item, badge }
  })

  return (
    <>
      {/* Desktop Sidebar - Hidden on mobile */}
      {isDesktop && (
        <aside className={`flex flex-col w-64 fixed inset-y-0 left-0 z-50 ${className}`}>
        <div className="flex flex-col flex-1 min-h-0 bg-black/30 backdrop-blur-xl border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-white/10">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-gold-400 to-gold-600 p-2 rounded-full mr-3">
                <UserGroupIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Lenkersdorfer</h1>
                <p className="text-xs text-gray-400">Luxury Watch CRM</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              const Icon = isActive ? item.activeIcon : item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-black shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <div className="relative">
                    <Icon className={`mr-3 h-6 w-6 ${isActive ? 'text-black' : ''}`} />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-danger-500 text-white text-xs font-medium flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Quick Actions */}
          <div className="p-4 border-t border-white/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-400">Theme</span>
              <ThemeToggle />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-gold-400 to-gold-600 text-black p-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg"
            >
              <PlusIcon className="w-5 h-5 inline mr-2" />
              Add Client
            </motion.button>
          </div>
        </div>
        </aside>
      )}

      {/* Mobile Header with Menu Button - Hidden on desktop */}
      {!isDesktop && (
        <div className="sticky top-0 z-50 bg-black/30 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-gold-400 to-gold-600 p-2 rounded-full mr-3">
              <UserGroupIcon className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Lenkersdorfer</h1>
              <p className="text-xs text-gray-400">Luxury Watch CRM</p>
            </div>
          </div>
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white hover:bg-white/20 transition-all duration-200"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
        </div>
        </div>
      )}

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 w-80 bg-black/30 backdrop-blur-xl border-r border-white/10 z-50"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-gold-400 to-gold-600 p-2 rounded-full mr-3">
                  <UserGroupIcon className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">Lenkersdorfer</h1>
                  <p className="text-xs text-gray-400">Luxury Watch CRM</p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl bg-white/10 text-gray-300 hover:text-white transition-all duration-200"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = isActive ? item.activeIcon : item.icon

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 touch-target ${
                      isActive
                        ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-black shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="relative">
                      <Icon className={`mr-4 h-6 w-6 ${isActive ? 'text-black' : ''}`} />
                      {item.badge && item.badge > 0 && (
                        <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-danger-500 text-white text-xs font-medium flex items-center justify-center">
                          {item.badge > 99 ? '99+' : item.badge}
                        </span>
                      )}
                    </div>
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* Quick Actions */}
            <div className="p-4 border-t border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Theme</span>
                <ThemeToggle />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-gold-400 to-gold-600 text-black p-4 rounded-xl font-semibold transition-all duration-200 touch-target"
                onClick={() => setMobileMenuOpen(false)}
              >
                <PlusIcon className="w-5 h-5 inline mr-2" />
                Add Client
              </motion.button>
            </div>
          </motion.div>
        </>
      )}

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-xl border-t border-white/10 safe-area-pb z-50">
        <div className="max-w-mobile mx-auto">
          <div className="flex justify-around items-center py-2">
            {navigation.slice(0, 5).map((item) => {
              const isActive = pathname === item.href
              const Icon = isActive ? item.activeIcon : item.icon

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`mobile-nav-item touch-target relative ${
                    isActive ? 'mobile-nav-active' : 'mobile-nav-inactive'
                  }`}
                >
                  <div className="relative">
                    <Icon className="h-6 w-6" />
                    {item.badge && item.badge > 0 && (
                      <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-danger-500 text-white text-xs font-medium flex items-center justify-center">
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </div>
                  <span className="mt-1 font-medium text-xs">
                    {item.name}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gold-400 rounded-full" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
        </nav>
      )}
    </>
  )
}
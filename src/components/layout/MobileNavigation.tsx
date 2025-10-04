'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  UserGroupIcon,
  ClockIcon,
  PlusIcon,
  BellIcon,
  ChartBarIcon,
  HomeIcon,
  BoltIcon
} from '@heroicons/react/24/outline'
import {
  UserGroupIcon as UserGroupSolid,
  ClockIcon as ClockSolid,
  PlusIcon as PlusSolid,
  BellIcon as BellSolid,
  ChartBarIcon as ChartBarSolid,
  HomeIcon as HomeSolid,
  BoltIcon as BoltSolid
} from '@heroicons/react/24/solid'

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  activeIcon: React.ComponentType<{ className?: string }>
  badge?: number
}

const navigation: NavItem[] = [
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
    name: 'Add',
    href: '/clients/add',
    icon: PlusIcon,
    activeIcon: PlusSolid,
  },
  {
    name: 'Allocation',
    href: '/allocation',
    icon: BoltIcon,
    activeIcon: BoltSolid,
    badge: 3,
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: BellIcon,
    activeIcon: BellSolid,
    badge: 5,
  },
]

export default function MobileNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 safe-area-pb z-50">
      <div className="max-w-mobile mx-auto">
        <div className="flex justify-around items-center py-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const Icon = isActive ? item.activeIcon : item.icon
            const isAddButton = item.name === 'Add'

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`mobile-nav-item touch-target relative ${
                  isAddButton
                    ? 'transform -translate-y-2'
                    : isActive
                      ? 'mobile-nav-active'
                      : 'mobile-nav-inactive'
                }`}
              >
                <div className={`relative ${
                  isAddButton
                    ? 'bg-gradient-to-r from-gold-400 to-gold-600 p-3 rounded-full shadow-lg'
                    : ''
                }`}>
                  <Icon className={`${isAddButton ? 'h-7 w-7 text-black' : 'h-6 w-6'}`} strokeWidth={isAddButton ? 3 : 2} />
                  {item.badge && item.badge > 0 && !isAddButton && (
                    <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-danger-500 text-white text-xs font-medium flex items-center justify-center">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`mt-1 font-medium ${isAddButton ? 'text-gold-400' : ''}`}>
                  {item.name}
                </span>
                {isActive && !isAddButton && (
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-gold-400 rounded-full" />
                )}
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
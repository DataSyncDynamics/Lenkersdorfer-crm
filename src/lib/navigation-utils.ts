import React from 'react'
import {
  Home,
  Users,
  Clock,
  Upload,
  Bell,
  Zap,
  Crown,
  MessageSquare
} from 'lucide-react'
import { getNavigationIconClasses, formatNotificationCount, getNotificationBadgeClasses } from './ui-utils'

export type NavigationLink = {
  label: string
  href: string
  icon: React.ReactNode
  notificationKey?: string[]
  notificationVariant?: 'green'
}

/**
 * Creates navigation icon with consistent styling and notification badges
 */
export function createNavigationIcon(
  IconComponent: React.ComponentType<any>,
  isActive: boolean,
  notificationCount?: number,
  variant?: 'green'
): React.ReactNode {
  if (notificationCount && notificationCount > 0) {
    return React.createElement(
      'div',
      {
        className: 'relative overflow-visible',
        style: { overflow: 'visible' } // Ensure badges can overflow container
      },
      React.createElement(IconComponent, { className: getNavigationIconClasses(isActive) }),
      React.createElement(
        'span',
        { className: getNotificationBadgeClasses(variant) },
        formatNotificationCount(notificationCount)
      )
    )
  }

  return React.createElement(IconComponent, { className: getNavigationIconClasses(isActive) })
}

/**
 * Calculates notification count for a given set of categories
 */
export function getNotificationCountForCategories(
  counts: any,
  categories: string[]
): number {
  return categories.reduce((total, category) => {
    return total + (counts.byCategory[category] || 0)
  }, 0)
}

/**
 * Creates main navigation links with consolidated logic
 */
export function createMainNavigationLinks(pathname: string, counts: any, messagingUnreadCount?: number): NavigationLink[] {
  return [
    {
      label: "Home",
      href: "/",
      icon: createNavigationIcon(Home, pathname === "/")
    },
    {
      label: "Clients",
      href: "/clients",
      icon: createNavigationIcon(
        Users,
        pathname === "/clients",
        getNotificationCountForCategories(counts, ['OPPORTUNITIES', 'ALLOCATIONS'])
      )
    },
    {
      label: "Messages",
      href: "/messages",
      icon: createNavigationIcon(
        MessageSquare,
        pathname === "/messages",
        messagingUnreadCount || 0
      )
    },
    {
      label: "Waitlist",
      href: "/waitlist",
      icon: createNavigationIcon(
        Clock,
        pathname === "/waitlist",
        getNotificationCountForCategories(counts, ['URGENT', 'FOLLOW_UPS'])
      )
    },
    {
      label: "Allocation",
      href: "/allocation",
      icon: createNavigationIcon(
        Zap,
        pathname === "/allocation",
        getNotificationCountForCategories(counts, ['ALLOCATIONS']),
        'green'
      )
    },
    {
      label: "Import",
      href: "/import",
      icon: createNavigationIcon(Upload, pathname === "/import")
    }
  ]
}

/**
 * Creates bottom navigation items (user profile only)
 * Note: Notifications are now in the header, not sidebar
 */
export function createBottomNavigationItems(pathname: string, counts: any) {
  return [
    {
      label: "Jason Jolly",
      href: "#",
      icon: React.createElement(
        'div',
        { className: 'h-5 w-5 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 flex items-center justify-center flex-shrink-0' },
        React.createElement(Crown, { className: 'h-3 w-3 text-black' })
      )
    }
  ]
}
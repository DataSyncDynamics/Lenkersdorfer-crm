'use client'

import React from 'react'
import {
  Crown,
  Star,
  Users,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/store'
import { getTierColorClasses, getAvatarInitials, formatClientName } from '@/lib/ui-utils'
import { cn } from '@/lib/utils'
import { Client } from '@/types'
import { useNotifications } from '@/contexts/NotificationContext'

interface ClientCardProps {
  client: Client
  onClick: () => void
}

const getTierIcon = (tier: number) => {
  if (tier <= 2) return <Crown className="h-3 w-3" />
  if (tier <= 3) return <Star className="h-3 w-3" />
  return <Users className="h-3 w-3" />
}

const ClientCardComponent: React.FC<ClientCardProps> = ({ client, onClick }) => {
  const { notifications } = useNotifications()

  // Find notifications for this specific client
  const clientNotifications = notifications.filter(n =>
    n.clientId === client.id || n.clientName === client.name
  )

  const hasUrgentNotifications = clientNotifications.some(n =>
    n.category === 'URGENT_CLIENTS' && !n.isRead
  )

  const hasOpportunityNotifications = clientNotifications.some(n =>
    n.category === 'NEW_OPPORTUNITIES' && !n.isRead
  )

  return (
    <div
      className="cursor-pointer transition-transform hover:scale-[1.02] active:scale-[0.98]"
      onClick={onClick}
    >
      <Card className={cn(
        "h-full hover:shadow-lg transition-all duration-200 relative",
        (hasUrgentNotifications || hasOpportunityNotifications) && "ring-2 ring-offset-2",
        hasUrgentNotifications && "ring-red-400",
        hasOpportunityNotifications && !hasUrgentNotifications && "ring-orange-400"
      )}>
        {/* Notification Indicators */}
        {(hasUrgentNotifications || hasOpportunityNotifications) && (
          <div className="absolute -top-2 -right-2 z-10 flex gap-1">
            {hasUrgentNotifications && (
              <div className="bg-red-500 rounded-full p-2 shadow-lg animate-pulse">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            )}
            {hasOpportunityNotifications && (
              <div className="bg-orange-500 rounded-full p-2 shadow-lg">
                <Flame className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        )}

        <CardHeader className="pb-3 pt-4 relative">
          {/* Tier Badge - Positioned in top-right corner */}
          <Badge
            className={cn("absolute top-4 right-4 text-xs font-medium whitespace-nowrap", getTierColorClasses(client.clientTier))}
            style={client.clientTier === 3 ? { backgroundColor: 'rgb(2, 44, 34)', color: 'rgb(110, 231, 183)', borderColor: 'rgb(4, 120, 87)' } : undefined}
          >
            {getTierIcon(client.clientTier)}
            <span className="ml-1">Tier {client.clientTier}</span>
          </Badge>

          {/* Client Info - Below tier badge with full name visible */}
          {(() => {
            const formattedName = formatClientName(client.name);
            const nameParts = formattedName.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ');

            return (
              <div className="flex items-center gap-3 mt-48">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                    {getAvatarInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    <div className="flex flex-col">
                      <span>{firstName}</span>
                      {lastName && <span>{lastName}</span>}
                    </div>
                  </CardTitle>
                </div>
              </div>
            );
          })()}
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lifetime Spend */}
          <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(client.lifetimeSpend)}
            </div>
            <div className="text-sm text-muted-foreground">Lifetime Spend</div>
          </div>

          {/* Contact Info */}
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Mail className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="break-all">{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Phone className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span>Last purchase:</span>
                <span>{client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString() : 'No purchases yet'}</span>
              </div>
            </div>
          </div>

          {/* Preferred Brands */}
          <div>
            <div className="text-sm font-medium mb-2 text-gray-800 dark:text-gray-200">Preferred Brands</div>
            <div className="flex flex-wrap gap-1">
              {client.preferredBrands.slice(0, 3).map((brand: string) => (
                <Badge key={brand} variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                  {brand}
                </Badge>
              ))}
              {client.preferredBrands.length > 3 && (
                <Badge variant="outline" className="text-xs bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600">
                  +{client.preferredBrands.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          {/* Notification Summary */}
          {clientNotifications.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">Needs Attention</span>
              </div>
              <div className="space-y-1">
                {hasUrgentNotifications && (
                  <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Urgent follow-up required</span>
                  </div>
                )}
                {hasOpportunityNotifications && (
                  <div className="flex items-center gap-2 text-xs text-orange-600 dark:text-orange-400">
                    <Flame className="w-3 h-3" />
                    <span>Perfect match available</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export const ClientCard = React.memo(ClientCardComponent, (prevProps, nextProps) => {
  // Only re-render if these specific properties change
  return (
    prevProps.client.id === nextProps.client.id &&
    prevProps.client.name === nextProps.client.name &&
    prevProps.client.lifetimeSpend === nextProps.client.lifetimeSpend &&
    prevProps.client.email === nextProps.client.email &&
    prevProps.client.phone === nextProps.client.phone &&
    prevProps.client.lastPurchase === nextProps.client.lastPurchase
  )
})

ClientCard.displayName = 'ClientCard'

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Crown,
  Star,
  Users,
  Phone,
  Mail,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatCurrency } from '@/lib/store'
import { getTierColorClasses, getAvatarInitials } from '@/lib/ui-utils'
import { cn } from '@/lib/utils'
import { Client } from '@/types'

interface ClientCardProps {
  client: Client
  onClick: () => void
}

const getTierIcon = (tier: number) => {
  if (tier <= 2) return <Crown className="h-3 w-3" />
  if (tier <= 3) return <Star className="h-3 w-3" />
  return <Users className="h-3 w-3" />
}

export const ClientCard: React.FC<ClientCardProps> = ({ client, onClick }) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="cursor-pointer"
      onClick={onClick}
    >
      <Card className="h-full hover:shadow-lg transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold">
                  {getAvatarInitials(client.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-lg font-semibold truncate">{client.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={cn("text-xs font-medium border", getTierColorClasses(client.clientTier))}>
                    {getTierIcon(client.clientTier)}
                    <span className="ml-1">Tier {client.clientTier}</span>
                  </Badge>
                </div>
              </div>
            </div>
          </div>
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
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{client.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Last purchase: {client.lastPurchase ? new Date(client.lastPurchase).toLocaleDateString() : 'No purchases yet'}</span>
            </div>
          </div>

          {/* Preferred Brands */}
          <div>
            <div className="text-sm font-medium mb-2">Preferred Brands</div>
            <div className="flex flex-wrap gap-1">
              {client.preferredBrands.slice(0, 3).map((brand: string) => (
                <Badge key={brand} variant="outline" className="text-xs">
                  {brand}
                </Badge>
              ))}
              {client.preferredBrands.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{client.preferredBrands.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
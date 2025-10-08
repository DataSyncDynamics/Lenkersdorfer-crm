'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Flame, Clock, Phone, MessageSquare, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UrgentNotification } from '@/components/notifications/UrgentNotificationDashboard'

interface PriorityActionsCardProps {
  notifications: UrgentNotification[]
  onTextClient: (notification: UrgentNotification) => void
  onCallClient: (notification: UrgentNotification) => void
  onViewClient: (clientId: string) => void
}

const PriorityActionsCardComponent: React.FC<PriorityActionsCardProps> = ({
  notifications,
  onTextClient,
  onCallClient,
  onViewClient
}) => {
  // Filter to urgent and today's follow-ups
  const urgentActions = notifications.filter(n => n.category === 'URGENT')
  const followUpActions = notifications.filter(n => n.category === 'FOLLOW-UPS')

  // Show all urgent items first, then follow-ups (max 8 total)
  const priorityItems = [
    ...urgentActions,
    ...followUpActions
  ].slice(0, 8)

  const urgentCount = urgentActions.length
  const followUpCount = followUpActions.length

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Today's Priority Actions
          </div>
          <div className="flex items-center gap-2">
            {urgentCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {urgentCount} urgent
              </Badge>
            )}
            {followUpCount > 0 && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                {followUpCount} due
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {priorityItems.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No priority actions for today</p>
            <p className="text-xs mt-1">Great job staying on top of your clients!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 lg:divide-x lg:divide-border/30">
            {priorityItems.map((item, index) => {
              const isUrgent = item.category === 'URGENT'
              const phoneAction = item.actions?.find(a => a.type === 'CALL')
              const textAction = item.actions?.find(a => a.type === 'TEXT_CLIENT')
              const viewAction = item.actions?.find(a => a.type === 'VIEW_CLIENT')

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "p-3 rounded-lg border-l-4 transition-all hover:shadow-md",
                    isUrgent
                      ? "bg-red-50/50 dark:bg-red-950/20 border-red-500"
                      : "bg-amber-50/50 dark:bg-amber-950/20 border-amber-500",
                    index % 2 === 0 ? "lg:pr-4" : "lg:pl-4"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm truncate">
                          {item.clientName}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs shrink-0",
                            isUrgent
                              ? "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-400"
                              : "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-400"
                          )}
                        >
                          {isUrgent ? 'Urgent' : 'Follow-up'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.watchBrand} {item.watchModel}
                        {item.daysWaiting && ` • ${item.daysWaiting} days waiting`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {textAction && (
                      <Button
                        size="sm"
                        variant={isUrgent ? "default" : "outline"}
                        className="text-sm flex-1 min-w-0"
                        onClick={() => onTextClient(item)}
                      >
                        <MessageSquare className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Text</span>
                      </Button>
                    )}
                    {phoneAction && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-sm flex-1 min-w-0"
                        onClick={() => onCallClient(item)}
                      >
                        <Phone className="h-4 w-4 mr-1.5 shrink-0" />
                        <span className="truncate">Call</span>
                      </Button>
                    )}
                    {viewAction && item.clientId && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="px-3 shrink-0"
                        onClick={() => onViewClient(item.clientId!)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {(urgentCount + followUpCount) > 8 && (
          <div className="mt-4 pt-3 border-t">
            <p className="text-xs text-center text-muted-foreground">
              Showing top 8 of {urgentCount + followUpCount} priority actions
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const PriorityActionsCard = React.memo(PriorityActionsCardComponent, (prevProps, nextProps) => {
  // Only re-render if notifications array has actually changed
  return (
    prevProps.notifications === nextProps.notifications &&
    prevProps.onTextClient === nextProps.onTextClient &&
    prevProps.onCallClient === nextProps.onCallClient &&
    prevProps.onViewClient === nextProps.onViewClient
  )
})

PriorityActionsCard.displayName = 'PriorityActionsCard'

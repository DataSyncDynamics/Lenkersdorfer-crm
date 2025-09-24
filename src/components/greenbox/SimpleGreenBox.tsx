'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Target } from 'lucide-react'
import { useAppStore } from '@/lib/store'

const SimpleGreenBox: React.FC = () => {
  const { getGreenBoxMatches, getCriticalGreenBoxAlerts } = useAppStore()

  const allMatches = getGreenBoxMatches()
  const criticalAlerts = getCriticalGreenBoxAlerts()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Critical Alerts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              High-priority allocations needed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Matches
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{allMatches.length}</div>
            <p className="text-xs text-muted-foreground">
              Active GREEN BOX opportunities
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default SimpleGreenBox
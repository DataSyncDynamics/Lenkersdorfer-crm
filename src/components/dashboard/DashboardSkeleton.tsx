'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Bell } from 'lucide-react'

export function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      {/* Header with Alert Bell */}
      <div className="sticky top-0 z-10 bg-background md:static flex flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lenkersdorfer Analytics</h1>
          <p className="text-muted-foreground">Professional luxury watch sales dashboard</p>
        </div>

        {/* Notification Bell */}
        <div className="relative flex-shrink-0">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-full mx-auto px-4 lg:px-8 pb-8">
        {/* Key Metrics Loading */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart Loading */}
        <div className="grid gap-6 mb-6">
          <Card className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>

        {/* Priority Actions Loading */}
        <div className="space-y-6">
          <Card className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/30">
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Secondary Cards Loading */}
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="p-3 rounded-lg bg-muted/30">
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-2/3" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Loading Message */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <p className="text-sm">Loading your CRM data...</p>
          </div>
        </div>
      </main>
    </div>
  )
}

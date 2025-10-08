'use client'

import { useMemo, useState } from 'react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp } from 'lucide-react'
import { Client } from '@/types'
import { cn } from '@/lib/utils'

interface RevenueChartProps {
  clients: Client[]
}

type TimePeriod = 'weekly' | 'monthly' | 'quarterly' | 'yearly'

export const RevenueChart: React.FC<RevenueChartProps> = ({ clients }) => {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('monthly')

  // Helper function to get Monday of the week for a given date
  const getMonday = (date: Date): Date => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
    d.setDate(diff)
    d.setHours(0, 0, 0, 0)
    return d
  }

  // Helper function to format date as YYYY-MM-DD
  const formatDateKey = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Generate revenue data based on selected time period
  const revenueData = useMemo(() => {
    const revenueMap = new Map<string, number>()

    // Aggregate all purchases by date
    clients.forEach(client => {
      if (client.purchases && Array.isArray(client.purchases)) {
        client.purchases.forEach(purchase => {
          const purchaseDate = new Date(purchase.date)
          let key: string

          if (timePeriod === 'weekly') {
            // Get Monday of the week for this purchase
            const monday = getMonday(purchaseDate)
            key = formatDateKey(monday)
          } else if (timePeriod === 'monthly') {
            key = `${purchaseDate.getFullYear()}-${String(purchaseDate.getMonth() + 1).padStart(2, '0')}`
          } else if (timePeriod === 'quarterly') {
            const quarter = Math.floor(purchaseDate.getMonth() / 3) + 1
            key = `${purchaseDate.getFullYear()}-Q${quarter}`
          } else {
            key = `${purchaseDate.getFullYear()}`
          }

          revenueMap.set(key, (revenueMap.get(key) || 0) + purchase.price)
        })
      }
    })

    // Generate time periods and format data
    let periods: string[] = []

    if (timePeriod === 'weekly') {
      // Last 12 weeks
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - (i * 7))
        const monday = getMonday(date)
        const key = formatDateKey(monday)
        periods.push(key)
      }
    } else if (timePeriod === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        periods.push(key)
      }
    } else if (timePeriod === 'quarterly') {
      // Last 8 quarters
      for (let i = 7; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - (i * 3))
        const quarter = Math.floor(date.getMonth() / 3) + 1
        const key = `${date.getFullYear()}-Q${quarter}`
        if (!periods.includes(key)) {
          periods.push(key)
        }
      }
      periods = [...new Set(periods)].sort()
    } else {
      // Last 3 years
      const currentYear = new Date().getFullYear()
      periods = [
        `${currentYear - 2}`,
        `${currentYear - 1}`,
        `${currentYear}`
      ]
    }

    // Format for chart display
    return periods.map(period => {
      let label: string

      if (timePeriod === 'weekly') {
        // Parse the Monday date (format: YYYY-MM-DD)
        const monday = new Date(period)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)

        // Format: "Oct 1-7" or "Dec 30 - Jan 5" (if crossing year boundary)
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        const startMonth = monthNames[monday.getMonth()]
        const endMonth = monthNames[sunday.getMonth()]
        const startDay = monday.getDate()
        const endDay = sunday.getDate()

        if (monday.getMonth() === sunday.getMonth()) {
          // Same month: "Oct 1-7"
          label = `${startMonth} ${startDay}-${endDay}`
        } else {
          // Different months: "Dec 30 - Jan 5"
          label = `${startMonth} ${startDay} - ${endMonth} ${endDay}`
        }
      } else if (timePeriod === 'monthly') {
        const [year, monthNum] = period.split('-')
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        label = `${monthNames[parseInt(monthNum) - 1]} ${year.slice(2)}`
      } else if (timePeriod === 'quarterly') {
        const [year, quarter] = period.split('-')
        label = `${quarter} ${year.slice(2)}`
      } else {
        label = period
      }

      return {
        period: label,
        revenue: revenueMap.get(period) || 0
      }
    })
  }, [clients, timePeriod])

  const totalRevenue = useMemo(() => {
    return revenueData.reduce((sum, data) => sum + data.revenue, 0)
  }, [revenueData])

  const averageRevenue = useMemo(() => {
    const nonZeroData = revenueData.filter(d => d.revenue > 0)
    return nonZeroData.length > 0 ? totalRevenue / nonZeroData.length : 0
  }, [totalRevenue, revenueData])

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-yellow-500" />
              Revenue Trends
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {timePeriod === 'weekly' && 'Last 12 weeks'}
              {timePeriod === 'monthly' && 'Last 12 months'}
              {timePeriod === 'quarterly' && 'Last 8 quarters'}
              {timePeriod === 'yearly' && 'Last 3 years'}
              {averageRevenue > 0 && (
                <span> · Average: ${averageRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
              )}
            </p>
          </div>

          {/* Time Period Selector */}
          <div className="flex gap-2">
            <Button
              variant={timePeriod === 'weekly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('weekly')}
              className={cn(
                timePeriod === 'weekly' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              Weekly
            </Button>
            <Button
              variant={timePeriod === 'monthly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('monthly')}
              className={cn(
                timePeriod === 'monthly' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              Monthly
            </Button>
            <Button
              variant={timePeriod === 'quarterly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('quarterly')}
              className={cn(
                timePeriod === 'quarterly' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              Quarterly
            </Button>
            <Button
              variant={timePeriod === 'yearly' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimePeriod('yearly')}
              className={cn(
                timePeriod === 'yearly' && 'bg-yellow-600 hover:bg-yellow-700'
              )}
            >
              Yearly
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={revenueData} key={timePeriod}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis
              dataKey="period"
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9CA3AF"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#F59E0B"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

import { NextResponse } from 'next/server'

// Mock data for allocation alerts system
// In a real app, this would fetch from Supabase/database
export async function GET() {
  // Simulate database queries for different alert types

  // Perfect matches (tier alignment between client and watch)
  const perfectMatches = [
    {
      client_id: '1',
      client_name: 'Marcus Chen',
      client_tier: 1,
      watch_model: 'Rolex Submariner',
      watch_tier: 1,
      days_waiting: 45,
      allocation_score: 95
    },
    {
      client_id: '2',
      client_name: 'Sarah Williams',
      client_tier: 2,
      watch_model: 'Omega Speedmaster',
      watch_tier: 2,
      days_waiting: 32,
      allocation_score: 89
    }
  ]

  // Clients needing follow-up (90+ days waiting)
  const needsFollowup = [
    {
      id: '3',
      name: 'David Rodriguez',
      tier: 1,
      watch_model: 'Patek Philippe Nautilus',
      days_waiting: 127,
      last_contact: '2024-06-15'
    },
    {
      id: '4',
      name: 'Emily Johnson',
      tier: 2,
      watch_model: 'Cartier Tank',
      days_waiting: 98,
      last_contact: '2024-07-01'
    }
  ]

  // At-risk VIPs (no purchase in 60+ days)
  const atRiskVips = [
    {
      id: '5',
      name: 'James Mitchell',
      tier: 1,
      days_since_purchase: 73,
      lifetime_spend: 95000,
      last_purchase_date: '2024-07-10'
    },
    {
      id: '6',
      name: 'Lisa Thompson',
      tier: 1,
      days_since_purchase: 82,
      lifetime_spend: 67500,
      last_purchase_date: '2024-07-01'
    }
  ]

  // Good matches (compatible but not perfect tier alignment)
  const goodMatches = [
    {
      client_id: '7',
      client_name: 'Michael Brown',
      client_tier: 2,
      watch_model: 'Tudor Black Bay',
      watch_tier: 3,
      days_waiting: 28,
      allocation_score: 76
    }
  ]

  return NextResponse.json({
    perfectMatches,
    needsFollowup,
    atRiskVips,
    goodMatches,
    summary: {
      totalAlerts: perfectMatches.length + needsFollowup.length + atRiskVips.length,
      perfectMatches: perfectMatches.length,
      needsFollowup: needsFollowup.length,
      atRiskVips: atRiskVips.length
    }
  })
}
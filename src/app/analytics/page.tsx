'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function AnalyticsPage() {
  useEffect(() => {
    redirect('/')
  }, [])

  return null
}

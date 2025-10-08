'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

export default function InventoryPage() {
  useEffect(() => {
    redirect('/allocation')
  }, [])

  return null
}

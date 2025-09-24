'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'

export default function AddClientFAB() {
  const pathname = usePathname()

  // Don't show on the add client page itself
  if (pathname === '/clients/add') {
    return null
  }

  return (
    <Link
      href="/clients/add"
      className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-black rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 touch-target"
      style={{
        boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.1)'
      }}
    >
      <PlusIcon className="h-7 w-7 font-bold" strokeWidth={3} />
      <span className="sr-only">Add New Client</span>
    </Link>
  )
}
'use client'

import { useState } from 'react'
import { ClockIcon } from '@heroicons/react/24/outline'
import { AddWaitlistModal } from './AddWaitlistModal'

export function AddWaitlistFAB() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-50 bg-gradient-to-r from-gold-400 to-gold-600 hover:from-gold-500 hover:to-gold-700 text-black rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 touch-target"
        style={{
          boxShadow: '0 8px 32px rgba(212, 175, 55, 0.3), 0 0 0 1px rgba(212, 175, 55, 0.1)'
        }}
      >
        <ClockIcon className="h-7 w-7 font-bold" strokeWidth={3} />
        <span className="sr-only">Add to Waitlist</span>
      </button>

      <AddWaitlistModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}

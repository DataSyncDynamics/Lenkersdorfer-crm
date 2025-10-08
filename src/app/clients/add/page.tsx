'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  XMarkIcon,
  PhoneIcon,
  UserPlusIcon,
  CalendarIcon,
  CheckIcon,
  MicrophoneIcon
} from '@heroicons/react/24/outline'
import { CreateClientRequest, VipTier } from '@/types'
import { useAppStore } from '@/lib/store'

// Quick select options for mobile
const WATCH_BRANDS = ['ROLEX', 'CARTIER', 'OMEGA', 'PATEK PHILIPPE', 'AUDEMARS PIGUET', 'VACHERON CONSTANTIN', 'JAEGER-LECOULTRE', 'IWC', 'BREITLING', 'TAG HEUER']
const BUDGET_OPTIONS = [
  { label: '$5K', value: 5000 },
  { label: '$10K', value: 10000 },
  { label: '$25K', value: 25000 },
  { label: '$50K', value: 50000 },
  { label: '$100K+', value: 100000 }
]
const SOURCE_OPTIONS = ['Referral', 'Walk-in', 'Online', 'Social Media', 'Event', 'Advertisement']

// Tier calculation logic
function calculateTier(budget: number): VipTier {
  if (budget >= 100000) return 'Platinum'
  if (budget >= 50000) return 'Gold'
  if (budget >= 25000) return 'Silver'
  return 'Bronze'
}

// Tier colors
const TIER_COLORS = {
  'Bronze': 'bg-orange-100 text-orange-800 border-orange-200',
  'Silver': 'bg-gray-100 text-gray-800 border-gray-300',
  'Gold': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Platinum': 'bg-purple-100 text-purple-800 border-purple-300'
}

interface FormData {
  name: string
  phone: string
  email: string
  interests: string[]
  budget: number
  source: string
  notes: string
}

export default function AddClientPage() {
  const router = useRouter()
  const { addClient } = useAppStore()
  const [formData, setFormData] = useState<FormData>({
    name: '',
    phone: '',
    email: '',
    interests: [],
    budget: 0,
    source: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)
  const [predictedTier, setPredictedTier] = useState<VipTier>('Bronze')

  // Auto-save functionality
  useEffect(() => {
    if (formData.name || formData.phone) {
      setSaveStatus('saving')
      const timeoutId = setTimeout(() => {
        // Auto-save to localStorage
        localStorage.setItem('draft-client', JSON.stringify(formData))
        setSaveStatus('saved')
        setTimeout(() => setSaveStatus(null), 2000)
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [formData])

  // Load draft on mount
  useEffect(() => {
    const draft = localStorage.getItem('draft-client')
    if (draft) {
      try {
        const parsed = JSON.parse(draft)
        setFormData(parsed)
      } catch (error) {
        console.error('Error loading draft:', error)
      }
    }
  }, [])

  // Update predicted tier when budget changes
  useEffect(() => {
    if (formData.budget > 0) {
      setPredictedTier(calculateTier(formData.budget))
    }
  }, [formData.budget])

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 3) return numbers
    if (numbers.length <= 6) return `(${numbers.slice(0, 3)}) ${numbers.slice(3)}`
    return `(${numbers.slice(0, 3)}) ${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleInputChange('phone', formatted)
  }

  const toggleInterest = (brand: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(brand)
        ? prev.interests.filter(b => b !== brand)
        : [...prev.interests, brand]
    }))
  }

  const handleSubmit = async (action: 'save' | 'call' | 'schedule' | 'continue') => {
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Name and phone are required')
      return
    }

    setIsSubmitting(true)
    try {
      // Create the new client using the store
      const newClientId = addClient({
        name: formData.name.trim(),
        email: formData.email.trim() || 'unknown@example.com',
        phone: formData.phone.trim(),
        preferredBrands: formData.interests,
        notes: [
          formData.notes,
          formData.budget > 0 ? `Estimated Budget: $${formData.budget.toLocaleString()}` : '',
          formData.source ? `Source: ${formData.source}` : ''
        ].filter(Boolean).join('\n'),
        joinDate: new Date().toISOString()
      })

      // Clear draft
      localStorage.removeItem('draft-client')

      // Handle different actions
      switch (action) {
        case 'call':
          // Navigate to client detail with call action
          router.push(`/clients/${newClientId}?action=call`)
          break
        case 'schedule':
          // Navigate to client detail with schedule action
          router.push(`/clients/${newClientId}?action=schedule`)
          break
        case 'continue':
          // Reset form for another client
          setFormData({
            name: '',
            phone: '',
            email: '',
            interests: [],
            budget: 0,
            source: '',
            notes: ''
          })
          setSaveStatus('saved')
          setTimeout(() => setSaveStatus(null), 2000)
          break
        default:
          router.push('/clients')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      setSaveStatus('error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-mobile mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/clients" className="touch-target">
            <XMarkIcon className="h-6 w-6 text-gray-400" />
          </Link>
          <h1 className="text-lg font-semibold">Add Client</h1>
          <div className="w-6 h-6">
            {saveStatus === 'saving' && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-gold-400 border-t-transparent"></div>
            )}
            {saveStatus === 'saved' && (
              <CheckIcon className="h-4 w-4 text-green-400" />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-mobile mx-auto px-4 py-6 pb-32">
        {/* Essential Information */}
        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter full name"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 touch-target focus:outline-none focus:border-gold-400 focus:bg-white/10 transition-all text-lg"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="(555) 123-4567"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 touch-target focus:outline-none focus:border-gold-400 focus:bg-white/10 transition-all text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="client@email.com"
              className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 touch-target focus:outline-none focus:border-gold-400 focus:bg-white/10 transition-all text-lg"
            />
          </div>
        </div>

        {/* Watch Interests */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Watch Interests
          </label>
          <div className="grid grid-cols-2 gap-3">
            {WATCH_BRANDS.map((brand) => (
              <button
                key={brand}
                onClick={() => toggleInterest(brand)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium touch-target transition-all ${
                  formData.interests.includes(brand)
                    ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Range */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Estimated Budget
          </label>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {BUDGET_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleInputChange('budget', option.value)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium touch-target transition-all ${
                  formData.budget === option.value
                    ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Tier Prediction */}
          {formData.budget > 0 && (
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="text-sm text-gray-300">Predicted Tier:</div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium border ${TIER_COLORS[predictedTier]}`}>
                {predictedTier}
              </div>
            </div>
          )}
        </div>

        {/* Source */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            How did they hear about us?
          </label>
          <div className="grid grid-cols-2 gap-3">
            {SOURCE_OPTIONS.map((source) => (
              <button
                key={source}
                onClick={() => handleInputChange('source', source)}
                className={`px-4 py-3 rounded-xl border text-sm font-medium touch-target transition-all ${
                  formData.source === source
                    ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">
              Additional Notes
            </label>
            <button className="touch-target p-2 text-gray-400 hover:text-white transition-colors">
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          </div>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="Any additional context about the client..."
            rows={4}
            className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-400 focus:bg-white/10 transition-all resize-none"
          />
        </div>
      </div>

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-white/10 safe-area-pb">
        <div className="max-w-mobile mx-auto p-4 space-y-3">
          {/* Primary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSubmit('call')}
              disabled={!formData.name.trim() || !formData.phone.trim() || isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-4 bg-green-600 text-white rounded-xl font-medium touch-target disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700 transition-colors"
            >
              <PhoneIcon className="h-5 w-5" />
              Save & Call
            </button>
            <button
              onClick={() => handleSubmit('schedule')}
              disabled={!formData.name.trim() || !formData.phone.trim() || isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-4 bg-blue-600 text-white rounded-xl font-medium touch-target disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
            >
              <CalendarIcon className="h-5 w-5" />
              Save & Schedule
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSubmit('continue')}
              disabled={!formData.name.trim() || !formData.phone.trim() || isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-4 bg-white/10 text-white rounded-xl font-medium touch-target disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/20 transition-colors border border-white/20"
            >
              <UserPlusIcon className="h-5 w-5" />
              Save & Add Another
            </button>
            <button
              onClick={() => handleSubmit('save')}
              disabled={!formData.name.trim() || !formData.phone.trim() || isSubmitting}
              className="flex items-center justify-center gap-2 px-4 py-4 bg-gold-500 text-black rounded-xl font-medium touch-target disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gold-400 transition-colors"
            >
              <CheckIcon className="h-5 w-5" />
              Save Client
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
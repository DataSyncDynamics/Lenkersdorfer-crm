'use client'

import React, { useState } from 'react'
import SimpleGreenBox from '@/components/greenbox/SimpleGreenBox'
import TierCalculator from '@/components/greenbox/TierCalculator'

const GreenBoxPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tiers'>('dashboard')

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">GREEN BOX Allocation System</h1>
              <p className="text-gray-600 mt-1">
                Sophisticated client-to-watch matching preventing lead leakage and maximizing conversions
              </p>
            </div>
            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'dashboard'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('tiers')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'tiers'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tier Management
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && <SimpleGreenBox />}
        {activeTab === 'tiers' && <TierCalculator />}
      </div>
    </div>
  )
}

export default GreenBoxPage
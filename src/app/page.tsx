'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Mobile-first navigation */}
      <nav className="bg-black/50 backdrop-blur-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">Lenkersdorfer</h1>
              <span className="ml-2 text-sm text-gray-400">CRM</span>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/clients"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Clients
              </Link>
              <Link
                href="/waitlist"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Waitlist
              </Link>
              <Link
                href="/allocation"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Allocation
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Luxury Watch
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-600">
              Sales CRM
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Track VIP clients, manage waitlists, and maximize sales with intelligent allocation
          </p>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-white">127</div>
              <div className="text-gray-400">VIP Clients</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-gold-400">$2.4M</div>
              <div className="text-gray-400">Total Sales</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-gray-700">
              <div className="text-3xl font-bold text-primary-400">43</div>
              <div className="text-gray-400">Pending Orders</div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/clients"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
            >
              View Clients
            </Link>
            <Link
              href="/waitlist"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors border border-gray-600"
            >
              Manage Waitlist
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
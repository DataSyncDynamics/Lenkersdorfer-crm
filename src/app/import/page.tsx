'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAppStore } from '@/lib/store'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import {
  CloudArrowUpIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChartBarIcon,
  UsersIcon,
  CurrencyDollarIcon,
  TrophyIcon
} from '@heroicons/react/24/outline'

interface ImportStats {
  totalClients: number
  totalRevenue: number
  averageSpend: number
  topSpender: { name: string; totalSpend: number }
  tierDistribution: {
    tier1: number
    tier2: number
    tier3: number
    tier4: number
    tier5: number
  }
  topBrands: [string, number][]
}

interface ImportResponse {
  success: boolean
  message: string
  clients: any[]
  stats: ImportStats
  processing: {
    recordsProcessed: number
    clientsCreated: number
    duplicatesRemoved: number
  }
  error?: string
  details?: string
}

export default function ImportPage() {
  const router = useRouter()
  const { clients: currentClients, replaceAllClients } = useAppStore()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<ImportResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv') ||
          selectedFile.type === 'text/rtf' || selectedFile.name.endsWith('.rtf')) {
        setFile(selectedFile)
        setError(null)
        setUploadResult(null)
      } else {
        setError('Please select a CSV or RTF file')
        setFile(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a CSV file first')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('csvFile', file)

      const response = await fetch('/api/import/lenkersdorfer', {
        method: 'POST',
        body: formData,
      })

      const result: ImportResponse = await response.json()

      if (result.success) {
        setUploadResult(result)
        // Update store with imported clients
        if (result.clients && result.clients.length > 0) {
          replaceAllClients(result.clients)
        }
      } else {
        setError(result.error || 'Failed to import data')
      }
    } catch (err) {
      setError('Failed to upload file. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv') ||
          droppedFile.type === 'text/rtf' || droppedFile.name.endsWith('.rtf')) {
        setFile(droppedFile)
        setError(null)
        setUploadResult(null)
      } else {
        setError('Please drop a CSV or RTF file')
      }
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <LenkersdorferSidebar>
      <div className="flex-1 p-6 bg-background">
        <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="mb-4 text-gold-400 hover:text-gold-300 transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Import Lenkersdorfer Data
          </h1>
          <p className="text-muted-foreground">
            Upload your sales CSV file to import client data into the CRM system
          </p>
        </div>

        {/* Current Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-gold-400 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Current Clients</p>
                <p className="text-2xl font-bold text-foreground">{currentClients.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-8 w-8 text-gold-400 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(currentClients.reduce((sum, client) => sum + client.lifetimeSpend, 0))}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border">
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-gold-400 mr-3" />
              <div>
                <p className="text-sm text-muted-foreground">Avg. Spend</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(
                    currentClients.length > 0
                      ? currentClients.reduce((sum, client) => sum + client.lifetimeSpend, 0) / currentClients.length
                      : 0
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6">Upload Sales CSV</h2>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              file
                ? 'border-gold-400/50 bg-gold-400/10'
                : 'border-border hover:border-gold-400/50 hover:bg-gold-400/5'
            }`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.rtf"
              onChange={handleFileSelect}
              className="hidden"
            />

            {file ? (
              <div className="flex items-center justify-center space-x-2">
                <DocumentTextIcon className="h-8 w-8 text-gold-400" />
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <CloudArrowUpIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium text-foreground mb-2">
                  Drop your CSV file here or click to browse
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Supports CSV and RTF files with format: Invoice_ID, Date, Description, Retail, Total, Customer, Source
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-gold-500 text-black px-6 py-2 rounded-lg hover:bg-gold-400 transition-colors"
                >
                  Select CSV or RTF File
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-300">{error}</p>
            </div>
          )}

          {/* Upload Button */}
          {file && (
            <div className="mt-6 flex space-x-4">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="bg-gold-500 text-black px-8 py-3 rounded-lg hover:bg-gold-400 disabled:bg-muted disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="h-5 w-5" />
                    <span>Import Data</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setFile(null)
                  setError(null)
                  setUploadResult(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="border border-border text-muted-foreground px-6 py-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Results Section */}
        {uploadResult && (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-8 border border-border">
            <div className="flex items-center mb-6">
              <CheckCircleIcon className="h-8 w-8 text-gold-400 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-foreground">Import Successful</h2>
                <p className="text-muted-foreground">{uploadResult.message}</p>
              </div>
            </div>

            {/* Processing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
                <p className="text-sm text-green-400">Records Processed</p>
                <p className="text-2xl font-bold text-green-300">
                  {uploadResult.processing.recordsProcessed}
                </p>
              </div>
              <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-4">
                <p className="text-sm text-blue-400">Clients Created</p>
                <p className="text-2xl font-bold text-blue-300">
                  {uploadResult.processing.clientsCreated}
                </p>
              </div>
              <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4">
                <p className="text-sm text-yellow-400">Duplicates Removed</p>
                <p className="text-2xl font-bold text-yellow-300">
                  {uploadResult.processing.duplicatesRemoved}
                </p>
              </div>
            </div>

            {/* Business Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-card/80 rounded-lg p-4 border border-border">
                <div className="flex items-center">
                  <UsersIcon className="h-6 w-6 text-gold-400 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Clients</p>
                    <p className="text-xl font-bold text-foreground">{uploadResult.stats.totalClients}</p>
                  </div>
                </div>
              </div>
              <div className="bg-card/80 rounded-lg p-4 border border-border">
                <div className="flex items-center">
                  <CurrencyDollarIcon className="h-6 w-6 text-gold-400 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(uploadResult.stats.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card/80 rounded-lg p-4 border border-border">
                <div className="flex items-center">
                  <ChartBarIcon className="h-6 w-6 text-gold-400 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Average Spend</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatCurrency(uploadResult.stats.averageSpend)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-card/80 rounded-lg p-4 border border-border">
                <div className="flex items-center">
                  <TrophyIcon className="h-6 w-6 text-gold-400 mr-2" />
                  <div>
                    <p className="text-sm text-muted-foreground">Top Spender</p>
                    <p className="text-sm font-medium text-foreground">{uploadResult.stats.topSpender.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(uploadResult.stats.topSpender.totalSpend)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tier Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-card/80 rounded-lg p-4 border border-border">
                <h3 className="font-medium text-foreground mb-3">Client Tier Distribution</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-purple-400">Tier 1 (Platinum Elite)</span>
                    <span className="font-medium text-foreground">{uploadResult.stats.tierDistribution.tier1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gold-400">Tier 2 (Gold Prime)</span>
                    <span className="font-medium text-foreground">{uploadResult.stats.tierDistribution.tier2}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Tier 3 (Silver Select)</span>
                    <span className="font-medium text-foreground">{uploadResult.stats.tierDistribution.tier3}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-orange-400">Tier 4 (Bronze Active)</span>
                    <span className="font-medium text-foreground">{uploadResult.stats.tierDistribution.tier4}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-400">Tier 5 (Standard)</span>
                    <span className="font-medium text-foreground">{uploadResult.stats.tierDistribution.tier5}</span>
                  </div>
                </div>
              </div>

              <div className="bg-card/80 rounded-lg p-4 border border-border">
                <h3 className="font-medium text-foreground mb-3">Top Watch Brands</h3>
                <div className="space-y-2">
                  {uploadResult.stats.topBrands.map(([brand, count], index) => (
                    <div key={brand} className="flex justify-between items-center">
                      <span className="text-sm text-foreground">{brand}</span>
                      <span className="font-medium text-muted-foreground">{count} clients</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => router.push('/clients')}
                className="bg-gold-500 text-black px-6 py-3 rounded-lg hover:bg-gold-400 transition-colors flex items-center justify-center space-x-2"
              >
                <UsersIcon className="h-5 w-5" />
                <span>View Imported Clients</span>
              </button>
              <button
                onClick={() => router.push('/allocation')}
                className="border border-gold-400/30 text-gold-400 px-6 py-3 rounded-lg hover:bg-gold-400/10 transition-colors flex items-center justify-center space-x-2"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span>View Allocation</span>
              </button>
              <button
                onClick={() => {
                  setFile(null)
                  setUploadResult(null)
                  setError(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="border border-border text-muted-foreground px-6 py-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                Import More Data
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </LenkersdorferSidebar>
  )
}
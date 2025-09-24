import { NextRequest, NextResponse } from 'next/server'
import { Client, Purchase, ClientTier } from '@/types'

// CSV data interface based on Lenkersdorfer sales format
interface SalesRecord {
  invoice_id: string
  date: string
  description: string
  retail: number
  total: number
  customer_name: string
  source: string
}

// Watch brand extraction patterns
const WATCH_BRANDS = [
  'ROLEX', 'CARTIER', 'OMEGA', 'PATEK PHILIPPE', 'AUDEMARS PIGUET',
  'VACHERON CONSTANTIN', 'JAEGER-LECOULTRE', 'IWC', 'BREITLING',
  'TAG HEUER', 'TUDOR', 'ZENITH', 'PANERAI', 'HUBLOT', 'RICHARD MILLE'
]

// Calculate client tier based on spend percentile
function calculateClientTier(percentile: number): ClientTier {
  if (percentile >= 80) return 1 // Platinum Elite - Top 20%
  if (percentile >= 60) return 2 // Gold Prime - 60-80th percentile
  if (percentile >= 40) return 3 // Silver Select - 40-60th percentile
  if (percentile >= 20) return 4 // Bronze Active - 20-40th percentile
  return 5 // Standard - Bottom 20%
}

// Calculate VIP tier based on lifetime spend
function calculateVipTier(lifetimeSpend: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' {
  if (lifetimeSpend >= 100000) return 'Platinum'
  if (lifetimeSpend >= 50000) return 'Gold'
  if (lifetimeSpend >= 25000) return 'Silver'
  return 'Bronze'
}

// Extract watch brand from description
function extractWatchBrand(description: string): string {
  const upperDesc = description.toUpperCase()
  for (const brand of WATCH_BRANDS) {
    if (upperDesc.includes(brand)) {
      return brand
    }
  }
  return 'Unknown'
}

// Extract watch model/reference from description
function extractWatchModel(description: string): string {
  // Look for model numbers (M followed by digits)
  const modelMatch = description.match(/M\d+/i)
  if (modelMatch) {
    return modelMatch[0]
  }

  // Fallback to first few words after brand
  const brand = extractWatchBrand(description)
  if (brand !== 'Unknown') {
    const brandIndex = description.toUpperCase().indexOf(brand)
    if (brandIndex !== -1) {
      const afterBrand = description.substring(brandIndex + brand.length).trim()
      const words = afterBrand.split(' ').slice(0, 3).join(' ')
      return words || 'Model Unknown'
    }
  }

  return 'Model Unknown'
}

// Parse CSV content with proper handling of quoted fields
function parseCSV(csvContent: string): SalesRecord[] {
  const lines = csvContent.trim().split('\n')
  if (lines.length < 2) return []

  const records: SalesRecord[] = []

  // Parse CSV properly handling quoted fields and commas inside quotes
  function parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes
          current += '"'
          i++ // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator found outside quotes
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }

    // Add the last field
    result.push(current.trim())
    return result
  }

  // Get headers
  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z_]/g, ''))
  console.log('CSV Headers detected:', headers)

  // Find column indices dynamically
  const columnMap = {
    invoice_id: headers.findIndex(h => h.includes('invoice') || h.includes('id')),
    date: headers.findIndex(h => h.includes('date')),
    description: headers.findIndex(h => h.includes('description') || h.includes('item') || h.includes('product')),
    retail: headers.findIndex(h => h.includes('retail') || h.includes('list')),
    total: headers.findIndex(h => h.includes('total') || h.includes('amount') || h.includes('price')),
    customer_name: headers.findIndex(h => h.includes('customer') || h.includes('name') || h.includes('client')),
    source: headers.findIndex(h => h.includes('source') || h.includes('store'))
  }

  console.log('Column mapping result:', columnMap)

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const values = parseCSVLine(line)

    // Clean and extract values using column mapping
    const getField = (key: keyof typeof columnMap, defaultValue = '') => {
      const index = columnMap[key]
      return index >= 0 && index < values.length ? values[index].replace(/['"]/g, '').trim() : defaultValue
    }

    const totalStr = getField('total')
    const retailStr = getField('retail')

    // Clean currency values - remove $, commas, and extract numbers
    const cleanCurrency = (str: string): number => {
      const cleaned = str.replace(/[$,\s]/g, '')
      const num = parseFloat(cleaned)
      return isNaN(num) ? 0 : num
    }

    const record: SalesRecord = {
      invoice_id: getField('invoice_id'),
      date: getField('date'),
      description: getField('description'),
      retail: cleanCurrency(retailStr),
      total: cleanCurrency(totalStr),
      customer_name: getField('customer_name'),
      source: getField('source', 'LENKERSDORFER')
    }

    // More lenient validation - accept any record with a name and positive total
    if (record.customer_name && record.customer_name.length > 1 && record.total > 0) {
      records.push(record)
      console.log(`Parsed record: ${record.customer_name} - $${record.total}`)
    } else {
      console.log(`Skipped record: name="${record.customer_name}", total=${record.total}`)
    }
  }

  console.log(`Successfully parsed ${records.length} records from ${lines.length - 1} lines`)
  return records
}

// Convert various date formats to YYYY-MM-DD
function convertDate(dateStr: string): string {
  if (!dateStr || dateStr.trim() === '') {
    return new Date().toISOString().split('T')[0]
  }

  try {
    // Handle MM/DD/YYYY format
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) {
        const month = parts[0].padStart(2, '0')
        const day = parts[1].padStart(2, '0')
        const year = parts[2]
        return `${year}-${month}-${day}`
      }
    }

    // Handle MM-DD-YYYY format
    if (dateStr.includes('-') && dateStr.split('-').length === 3) {
      const parts = dateStr.split('-')
      // Check if it's already YYYY-MM-DD
      if (parts[0].length === 4) {
        return dateStr
      }
      // Otherwise treat as MM-DD-YYYY
      const month = parts[0].padStart(2, '0')
      const day = parts[1].padStart(2, '0')
      const year = parts[2]
      return `${year}-${month}-${day}`
    }

    // Try parsing as a general date
    const parsed = new Date(dateStr)
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]
    }
  } catch (e) {
    console.log(`Failed to parse date: ${dateStr}`)
  }

  // Fallback to current date
  return new Date().toISOString().split('T')[0]
}

// Generate email from name
function generateEmail(name: string): string {
  const cleanName = name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .split(' ')
    .filter(part => part.length > 0)

  if (cleanName.length >= 2) {
    return `${cleanName[0]}.${cleanName[cleanName.length - 1]}@example.com`
  } else if (cleanName.length === 1) {
    return `${cleanName[0]}@example.com`
  }

  return 'unknown@example.com'
}

// Generate phone number (mock)
function generatePhone(): string {
  const areaCode = Math.floor(Math.random() * 800) + 200
  const exchange = Math.floor(Math.random() * 800) + 200
  const number = Math.floor(Math.random() * 9000) + 1000
  return `(${areaCode}) ${exchange}-${number}`
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('csvFile') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No CSV file provided' },
        { status: 400 }
      )
    }

    let csvContent = await file.text()

    // Handle RTF files - extract CSV data from RTF formatting
    if (csvContent.includes('\\rtf1') || csvContent.includes('{\\fonttbl')) {
      console.log('RTF file detected, extracting CSV data...')

      // Find the actual CSV data within the RTF
      const lines = csvContent.split('\n')
      const csvLines = []

      for (const line of lines) {
        // Look for lines that contain CSV-like data (commas and quotes)
        if (line.includes(',') && (line.includes('Invoice') || line.includes('ROLEX') || line.includes('CARTIER') || line.match(/\d+,/))) {
          // Clean RTF formatting from the line
          const cleanLine = line
            .replace(/\\[a-z]+\d*/g, '') // Remove RTF commands
            .replace(/[{}]/g, '') // Remove RTF braces
            .replace(/\\\\/g, '') // Remove RTF escapes
            .trim()

          if (cleanLine && cleanLine.includes(',')) {
            csvLines.push(cleanLine)
          }
        }
      }

      csvContent = csvLines.join('\n')
      console.log('Extracted CSV content:', csvContent.substring(0, 500) + '...')
    }

    const salesRecords = parseCSV(csvContent)

    if (salesRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid sales records found in CSV' },
        { status: 400 }
      )
    }

    // Group sales by customer
    const customerSales = new Map<string, SalesRecord[]>()

    salesRecords.forEach(record => {
      const customerKey = record.customer_name.trim().toUpperCase()
      if (!customerSales.has(customerKey)) {
        customerSales.set(customerKey, [])
      }
      customerSales.get(customerKey)!.push(record)
    })

    // Calculate lifetime spends for percentile ranking
    const lifetimeSpends = Array.from(customerSales.entries()).map(([name, sales]) => {
      const totalSpend = sales.reduce((sum, sale) => sum + sale.total, 0)
      return { name, totalSpend }
    }).sort((a, b) => b.totalSpend - a.totalSpend)

    // Convert to clients
    const clients: Client[] = []

    lifetimeSpends.forEach((customer, index) => {
      const sales = customerSales.get(customer.name)!
      const percentile = Math.round(((lifetimeSpends.length - index) / lifetimeSpends.length) * 100)

      // Extract preferred brands from purchases
      const brands = new Set<string>()
      const purchases: Purchase[] = []

      sales.forEach(sale => {
        const brand = extractWatchBrand(sale.description)
        if (brand !== 'Unknown') {
          brands.add(brand)
        }

        purchases.push({
          id: `purchase_${sale.invoice_id}`,
          watchModel: extractWatchModel(sale.description),
          brand: brand,
          price: sale.total,
          date: convertDate(sale.date),
          serialNumber: sale.invoice_id
        })
      })

      // Get last purchase date
      const lastPurchaseDate = purchases.length > 0
        ? purchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date
        : new Date().toISOString().split('T')[0]

      const client: Client = {
        id: `client_${customer.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`,
        name: customer.name,
        email: generateEmail(customer.name),
        phone: generatePhone(),
        lifetimeSpend: customer.totalSpend,
        vipTier: calculateVipTier(customer.totalSpend),
        clientTier: calculateClientTier(percentile),
        spendPercentile: percentile,
        lastPurchase: lastPurchaseDate,
        preferredBrands: Array.from(brands),
        notes: `Imported from Lenkersdorfer sales data. ${purchases.length} total purchases.`,
        joinDate: purchases.length > 0
          ? purchases.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0].date
          : new Date().toISOString().split('T')[0],
        purchases: purchases
      }

      clients.push(client)
    })

    // Generate statistics
    const stats = {
      totalClients: clients.length,
      totalRevenue: lifetimeSpends.reduce((sum, customer) => sum + customer.totalSpend, 0),
      averageSpend: lifetimeSpends.reduce((sum, customer) => sum + customer.totalSpend, 0) / lifetimeSpends.length,
      topSpender: lifetimeSpends[0],
      tierDistribution: {
        tier1: clients.filter(c => c.clientTier === 1).length,
        tier2: clients.filter(c => c.clientTier === 2).length,
        tier3: clients.filter(c => c.clientTier === 3).length,
        tier4: clients.filter(c => c.clientTier === 4).length,
        tier5: clients.filter(c => c.clientTier === 5).length,
      },
      topBrands: Array.from(
        clients.reduce((brandCount, client) => {
          client.preferredBrands.forEach(brand => {
            brandCount.set(brand, (brandCount.get(brand) || 0) + 1)
          })
          return brandCount
        }, new Map<string, number>())
      ).sort(([,a], [,b]) => b - a).slice(0, 5)
    }

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${salesRecords.length} sales records into ${clients.length} clients`,
      clients,
      stats,
      processing: {
        recordsProcessed: salesRecords.length,
        clientsCreated: clients.length,
        duplicatesRemoved: salesRecords.length - lifetimeSpends.length
      }
    })

  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'Lenkersdorfer CSV Import',
    description: 'Import client data from Lenkersdorfer sales CSV files',
    expectedFormat: {
      columns: ['invoice_id', 'date', 'description', 'retail', 'total', 'customer_name', 'source'],
      dateFormat: 'MM/DD/YYYY',
      example: 'INV001,12/15/2023,"ROLEX SUBMARINER M126610LN",15000,14500,"MICHAEL SYKES",LENKERSDORFER'
    },
    features: [
      'Automatic tier calculation based on spend percentiles',
      'Watch brand extraction from descriptions',
      'Purchase history aggregation',
      'VIP tier assignment',
      'Preferred brand analysis'
    ]
  })
}
import { NextRequest, NextResponse } from 'next/server'
import { Client, Purchase, ClientTier } from '@/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'

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
    invoice_id: headers.findIndex(h => h.includes('invoice') || h.includes('number')),
    date: headers.findIndex(h => h.includes('date')),
    description: headers.findIndex(h => h.includes('description') || h.includes('watch') || h.includes('item') || h.includes('product')),
    retail: headers.findIndex(h => h.includes('retail') && !h.includes('sale')),
    total: (() => {
      // Look for 'total' or 'sale price', but prefer the last occurrence of 'total'
      const indices = headers.reduce((acc: number[], h, i) => {
        if (h.includes('total') || h.includes('saleprice') || h.includes('amount')) {
          acc.push(i)
        }
        return acc
      }, [])
      return indices.length > 0 ? indices[0] : -1 // Use first 'total' for the sale price
    })(),
    customer_name: (() => {
      // Look for customer/client name - prefer 'client name' specifically
      const clientNameIdx = headers.findIndex(h => h.includes('clientname') || h.includes('customername'))
      if (clientNameIdx !== -1) return clientNameIdx

      // Fallback: look for standalone 'name' but not 'invoice' or 'product'
      return headers.findIndex((h, idx) =>
        h.includes('name') && !h.includes('invoice') && !h.includes('product')
      )
    })(),
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

    // Save clients to Supabase database directly
    console.log('Saving clients to Supabase database...')

    try {
      const supabase = await createServerSupabaseClient()

      const importResults = {
        totalClients: clients.length,
        clientsCreated: 0,
        purchasesCreated: 0,
        errors: [] as string[],
        createdClientIds: [] as string[]
      }

      // Process each client
      for (const client of clients) {
        try {
          // Prepare client data for Supabase
          const clientData = {
            name: client.name,
            email: client.email,
            phone: client.phone || null,
            vip_tier: client.vipTier,
            lifetime_spend: 0, // Database trigger will calculate from purchases
            notes: client.notes || null,
            preferred_brands: client.preferredBrands || []
          }

          // Check if client already exists
          const { data: existingClients, error: checkError } = await supabase
            .from('clients')
            .select('id')
            .or(`name.eq.${client.name},email.eq.${client.email}`)
            .limit(1)

          if (checkError) {
            console.error(`Error checking for existing client ${client.name}:`, checkError)
            importResults.errors.push(`Failed to check existing client: ${client.name}`)
            continue
          }

          let clientId: string

          if (existingClients && existingClients.length > 0) {
            clientId = existingClients[0].id
            console.log(`Client ${client.name} already exists with ID ${clientId}`)
          } else {
            // Create new client
            const { data: newClient, error: clientError } = await supabase
              .from('clients')
              .insert([clientData])
              .select()
              .single()

            if (clientError) {
              console.error(`Error creating client ${client.name}:`, clientError)
              importResults.errors.push(`Failed to create client: ${client.name}`)
              continue
            }

            clientId = newClient.id
            importResults.clientsCreated++
            importResults.createdClientIds.push(clientId)
            console.log(`Created client ${client.name} with ID ${clientId}`)
          }

          // Insert purchases for this client
          if (client.purchases && client.purchases.length > 0) {
            const purchasesData = client.purchases.map(purchase => ({
              client_id: clientId,
              brand: purchase.brand,
              model: purchase.watchModel,
              price: purchase.price,
              purchase_date: purchase.date,
              commission_rate: 15,
              commission_amount: purchase.price * 0.15
            }))

            // Check for existing purchases to avoid duplicates
            const { data: existingPurchases } = await supabase
              .from('purchases')
              .select('brand, model, price, purchase_date')
              .eq('client_id', clientId)

            const existingKeys = new Set(
              existingPurchases?.map(p => `${p.brand}-${p.model}-${p.price}-${p.purchase_date}`) || []
            )

            const newPurchases = purchasesData.filter(p => {
              const key = `${p.brand}-${p.model}-${p.price}-${p.purchase_date}`
              return !existingKeys.has(key)
            })

            if (newPurchases.length > 0) {
              const { error: purchasesError } = await supabase
                .from('purchases')
                .insert(newPurchases)

              if (purchasesError) {
                console.error(`Error creating purchases for ${client.name}:`, purchasesError)
                importResults.errors.push(`Failed to create purchases for: ${client.name}`)
              } else {
                importResults.purchasesCreated += newPurchases.length
                console.log(`Created ${newPurchases.length} purchases for ${client.name}`)
              }
            }
          }
        } catch (error) {
          console.error(`Error processing client ${client.name}:`, error)
          importResults.errors.push(`Error processing client: ${client.name}`)
        }
      }

      console.log('Successfully saved to database:', importResults)

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${salesRecords.length} sales records and saved ${importResults.clientsCreated} clients to database`,
        clients,
        stats,
        processing: {
          recordsProcessed: salesRecords.length,
          clientsCreated: clients.length,
          duplicatesRemoved: salesRecords.length - lifetimeSpends.length
        },
        database: importResults
      })
    } catch (dbError) {
      console.error('Error saving to database:', dbError)
      // Return the parsed data anyway, but indicate database save failed
      return NextResponse.json({
        success: true, // Parsing succeeded
        warning: 'Data parsed successfully but failed to save to database',
        message: `Processed ${salesRecords.length} sales records into ${clients.length} clients (not persisted)`,
        clients,
        stats,
        processing: {
          recordsProcessed: salesRecords.length,
          clientsCreated: clients.length,
          duplicatesRemoved: salesRecords.length - lifetimeSpends.length
        },
        databaseError: dbError instanceof Error ? dbError.message : 'Unknown database error'
      })
    }

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
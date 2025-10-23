import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { Client } from '@/types'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { BusinessConfig } from '@/config/business'

/**
 * POST /api/clients/batch-import
 * Batch import multiple clients with their purchases into Supabase
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check
    const authSupabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await authSupabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized - Authentication required' }, { status: 401 })
    }

    // Role-based access control - only managers and admins can import
    const { data: profile } = await authSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['manager', 'admin'].includes(profile.role)) {
      return NextResponse.json({
        error: 'Forbidden - Manager or Admin role required for batch import'
      }, { status: 403 })
    }

    const { clients }: { clients: Client[] } = await request.json()

    if (!clients || !Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { error: 'No clients provided for import' },
        { status: 400 }
      )
    }

    console.log(`Starting batch import of ${clients.length} clients...`)

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
        // Prepare client data for Supabase (remove purchases array, it goes in separate table)
        const clientData = {
          name: client.name,
          email: client.email,
          phone: client.phone || null,
          vip_tier: client.vipTier,
          lifetime_spend: 0, // IMPORTANT: Set to 0 - database trigger will calculate from purchases
          notes: client.notes || null,
          preferred_brands: client.preferredBrands || []
          // Note: last_contact_date will be added via reminders migration
        }

        // Check if client already exists (by name or email)
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
          // Client exists, use existing ID
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
            importResults.errors.push(`Failed to create client: ${client.name} - ${clientError.message}`)
            continue
          }

          clientId = newClient.id
          importResults.clientsCreated++
          importResults.createdClientIds.push(clientId)
          console.log(`Created client ${client.name} with ID ${clientId}`)
        }

        // Now insert purchases for this client
        if (client.purchases && client.purchases.length > 0) {
          const purchasesData = client.purchases.map(purchase => ({
            client_id: clientId,
            brand: purchase.brand,
            model: purchase.watchModel,
            price: purchase.price,
            purchase_date: purchase.date,
            commission_rate: BusinessConfig.getDefaultCommissionRate(),
            commission_amount: purchase.price * (BusinessConfig.getDefaultCommissionRate() / 100)
          }))

          // Check for existing purchases to avoid duplicates (by brand, model, price, date)
          const { data: existingPurchases } = await supabase
            .from('purchases')
            .select('brand, model, price, purchase_date')
            .eq('client_id', clientId)

          const existingKeys = new Set(
            existingPurchases?.map(p => `${p.brand}-${p.model}-${p.price}-${p.purchase_date}`) || []
          )

          // Filter out purchases that already exist
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

              // Set last_contact_date to the most recent purchase date
              const mostRecentPurchaseDate = newPurchases.reduce((latest, purchase) => {
                const purchaseDate = new Date(purchase.purchase_date)
                return purchaseDate > new Date(latest) ? purchase.purchase_date : latest
              }, newPurchases[0].purchase_date)

              await supabase
                .from('clients')
                .update({ last_contact_date: mostRecentPurchaseDate })
                .eq('id', clientId)
            }
          }
        }

      } catch (error) {
        console.error(`Error processing client ${client.name}:`, error)
        importResults.errors.push(`Error processing client: ${client.name}`)
      }
    }

    console.log('Batch import completed:', importResults)

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${importResults.clientsCreated} clients and ${importResults.purchasesCreated} purchases`,
      results: importResults
    })

  } catch (error) {
    console.error('Batch import error:', error)
    return NextResponse.json(
      {
        error: 'Failed to import clients',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

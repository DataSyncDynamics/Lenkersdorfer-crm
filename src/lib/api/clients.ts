'use client'

import { Client } from '@/types'

export async function fetchClients(search?: string): Promise<Client[]> {
  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const response = await fetch(`/api/clients?${params}`)
  if (!response.ok) {
    throw new Error('Failed to fetch clients')
  }

  const data = await response.json()
  return data.clients || []
}

export async function fetchClientById(id: string): Promise<Client> {
  const response = await fetch(`/api/clients/${id}`)
  if (!response.ok) {
    throw new Error('Failed to fetch client')
  }
  return response.json()
}

export async function createClient(client: Partial<Client>): Promise<Client> {
  const response = await fetch('/api/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  })

  if (!response.ok) {
    throw new Error('Failed to create client')
  }

  return response.json()
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  })

  if (!response.ok) {
    throw new Error('Failed to update client')
  }

  return response.json()
}

export async function deleteClient(id: string): Promise<void> {
  const response = await fetch(`/api/clients/${id}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('Failed to delete client')
  }
}

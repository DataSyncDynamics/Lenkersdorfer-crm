'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAppStore } from '@/lib/store'

interface Message {
  id: string
  clientId: string
  content: string
  timestamp: Date
  isFromClient: boolean
  status: 'sent' | 'delivered' | 'read'
}

interface Conversation {
  clientId: string
  messages: Message[]
  lastMessage: Message
  unreadCount: number
}

interface MessagingContextType {
  conversations: Conversation[]
  getTotalUnreadCount: () => number
  getUnreadCountForClient: (clientId: string) => number
  markConversationAsRead: (clientId: string) => void
  generateMockConversations: () => void
  setConversations: (conversations: Conversation[]) => void
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined)

export function useMessaging() {
  const context = useContext(MessagingContext)
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider')
  }
  return context
}

interface MessagingProviderProps {
  children: ReactNode
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const { clients } = useAppStore()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [readConversations, setReadConversations] = useState<Set<string>>(() => {
    // Load read conversations from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readConversations')
      return stored ? new Set(JSON.parse(stored)) : new Set()
    }
    return new Set()
  })

  const generateMockConversations = () => {
    if (clients.length === 0) return

    const mockConversations: Conversation[] = []

    // Create conversations for top clients from different tiers
    const sortedClients = [...clients]
      .sort((a, b) => {
        if (a.clientTier !== b.clientTier) {
          return a.clientTier - b.clientTier
        }
        return b.lifetimeSpend - a.lifetimeSpend
      })
      .slice(0, 8) // Limit to 8 conversations for demo

    sortedClients.forEach((client, index) => {
      const messages: Message[] = []
      const baseTime = new Date()
      baseTime.setHours(baseTime.getHours() - (index * 2))

      // Create realistic message threads based on client tier
      if (client.clientTier <= 2) {
        // VIP client - ongoing watch search conversation
        messages.push({
          id: `msg-${client.id}-1`,
          clientId: client.id,
          content: `Hi ${client.name}, I found a beautiful Rolex Submariner that might interest you. It's a 2024 model in excellent condition. Would you like to see photos?`,
          timestamp: new Date(baseTime.getTime() - 24 * 60 * 60 * 1000),
          isFromClient: false,
          status: 'read'
        })

        messages.push({
          id: `msg-${client.id}-2`,
          clientId: client.id,
          content: "Yes, I'd love to see it! What's the asking price?",
          timestamp: new Date(baseTime.getTime() - 23 * 60 * 60 * 1000),
          isFromClient: true,
          status: 'read'
        })

        messages.push({
          id: `msg-${client.id}-3`,
          clientId: client.id,
          content: `It's priced at $12,800. Given your history with us, I can offer it at $12,200. I'll send photos now.`,
          timestamp: new Date(baseTime.getTime() - 2 * 60 * 60 * 1000),
          isFromClient: false,
          status: 'delivered'
        })
      } else if (client.clientTier === 3) {
        // Mid-tier client - follow-up conversation
        messages.push({
          id: `msg-${client.id}-1`,
          clientId: client.id,
          content: `Hi ${client.name}, checking in on your Omega Speedmaster search. Any updates on your timeline?`,
          timestamp: new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000),
          isFromClient: false,
          status: 'read'
        })

        messages.push({
          id: `msg-${client.id}-2`,
          clientId: client.id,
          content: "Still looking! My budget is around $4,000. Let me know if anything comes up.",
          timestamp: new Date(baseTime.getTime() - 2 * 24 * 60 * 60 * 1000),
          isFromClient: true,
          status: 'read'
        })
      } else {
        // Standard client - initial contact
        messages.push({
          id: `msg-${client.id}-1`,
          clientId: client.id,
          content: `Hi ${client.name}, thanks for your interest in luxury timepieces. What type of watch are you looking for?`,
          timestamp: new Date(baseTime.getTime() - 5 * 24 * 60 * 60 * 1000),
          isFromClient: false,
          status: 'read'
        })
      }

      const lastMessage = messages[messages.length - 1]
      // Start with all messages read (unreadCount = 0)
      // In a real app, this would come from the backend
      const unreadCount = 0

      mockConversations.push({
        clientId: client.id,
        messages,
        lastMessage,
        unreadCount
      })
    })

    setConversations(mockConversations)
  }

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conversation) => total + conversation.unreadCount, 0)
  }

  const getUnreadCountForClient = (clientId: string) => {
    const conversation = conversations.find(c => c.clientId === clientId)
    return conversation ? conversation.unreadCount : 0
  }

  const markConversationAsRead = (clientId: string) => {
    setConversations(prevConversations =>
      prevConversations.map(conversation =>
        conversation.clientId === clientId
          ? { ...conversation, unreadCount: 0 }
          : conversation
      )
    )

    // Persist to localStorage
    setReadConversations(prev => {
      const newSet = new Set(prev)
      newSet.add(clientId)
      if (typeof window !== 'undefined') {
        localStorage.setItem('readConversations', JSON.stringify(Array.from(newSet)))
      }
      return newSet
    })
  }

  // Generate conversations when clients are loaded
  useEffect(() => {
    if (clients.length > 0 && conversations.length === 0) {
      generateMockConversations()
    }
  }, [clients, readConversations])

  // Update conversations when read status changes
  useEffect(() => {
    if (conversations.length > 0) {
      setConversations(prevConversations =>
        prevConversations.map(conversation =>
          readConversations.has(conversation.clientId)
            ? { ...conversation, unreadCount: 0 }
            : conversation
        )
      )
    }
  }, [readConversations])

  const value: MessagingContextType = {
    conversations,
    getTotalUnreadCount,
    getUnreadCountForClient,
    markConversationAsRead,
    generateMockConversations,
    setConversations
  }

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  )
}
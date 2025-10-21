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

    // Create 1-2 example conversations only
    const sortedClients = [...clients]
      .sort((a, b) => {
        if (a.clientTier !== b.clientTier) {
          return a.clientTier - b.clientTier
        }
        return b.lifetimeSpend - a.lifetimeSpend
      })
      .slice(0, 2) // Only 2 example conversations

    sortedClients.forEach((client, index) => {
      const messages: Message[] = []
      const baseTime = new Date()
      baseTime.setHours(baseTime.getHours() - (index * 2))

      // Create example message thread
      if (index === 0) {
        // First example - VIP client conversation
        messages.push({
          id: `msg-${client.id}-1`,
          clientId: client.id,
          content: `Hi ${client.name}, I found a beautiful Rolex Submariner that might interest you. Would you like to see photos?`,
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
      } else {
        // Second example - simple follow-up
        messages.push({
          id: `msg-${client.id}-1`,
          clientId: client.id,
          content: `Hi ${client.name}, checking in on your watch search. Let me know if I can help!`,
          timestamp: new Date(baseTime.getTime() - 3 * 24 * 60 * 60 * 1000),
          isFromClient: false,
          status: 'read'
        })
      }

      const lastMessage = messages[messages.length - 1]
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
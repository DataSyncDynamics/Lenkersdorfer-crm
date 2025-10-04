'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Search, Plus, Phone, User, Crown, FileText } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LenkersdorferSidebar } from '@/components/layout/LenkersdorferSidebar'
import { MessageTemplates } from '@/components/messaging/MessageTemplates'
import { useAppStore, formatCurrency, getVipTierColor } from '@/lib/store'
import { useMessaging } from '@/contexts/MessagingContext'
import { cn } from '@/lib/utils'
import type { Client } from '@/types'

// Mock message data structure
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

export default function MessagesPage() {
  const { clients } = useAppStore()
  const { conversations, markConversationAsRead } = useMessaging()
  const searchParams = useSearchParams()
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)

  const handleConversationSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    // Mark conversation as read when selected
    markConversationAsRead(clientId)
  }

  // Handle client selection from URL parameter (e.g., from notifications)
  useEffect(() => {
    const clientParam = searchParams.get('client')
    if (clientParam && clients.length > 0) {
      const clientExists = clients.find(c => c.id === clientParam)
      if (clientExists) {
        handleConversationSelect(clientParam)
      }
    }
  }, [searchParams, clients])

  // Auto-select first conversation if none is selected
  useEffect(() => {
    if (conversations.length > 0 && !selectedClientId) {
      handleConversationSelect(conversations[0].clientId)
    }
  }, [conversations, selectedClientId])

  const getClientById = (clientId: string): Client | undefined => {
    return clients.find(c => c.id === clientId)
  }

  const selectedConversation = conversations.find(c => c.clientId === selectedClientId)
  const selectedClient = selectedClientId ? getClientById(selectedClientId) : null

  const filteredConversations = conversations.filter(conversation => {
    const client = getClientById(conversation.clientId)
    if (!client) return false
    return client.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const formatMessageTime = (timestamp: Date): string => {
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60 * 60))

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`

    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`

    return timestamp.toLocaleDateString()
  }

  const handleTemplateSelect = (templateContent: string) => {
    setMessageInput(templateContent)
    setShowTemplates(false)
  }

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedClient) return

    // In a real implementation, this would send the message via SMS API
    alert(`📱 Message would be sent to ${selectedClient.name}:\n\n"${messageInput}"\n\n✅ This is a demo - message not actually sent.`)

    // Clear the input
    setMessageInput('')
  }

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background h-screen">
        {/* Header */}
        <div className="flex flex-col gap-4 p-4 md:p-6 border-b">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
            <p className="text-muted-foreground">Centralized client communication</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 min-h-0">
          {/* Conversation List - Left Panel */}
          <div className="w-full md:w-80 lg:w-96 border-r bg-muted/30 flex flex-col">
            {/* Search */}
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                <div className="space-y-1">
                  {filteredConversations.map((conversation) => {
                    const client = getClientById(conversation.clientId)
                    if (!client) return null

                    const isSelected = selectedClientId === conversation.clientId

                    return (
                      <div
                        key={conversation.clientId}
                        onClick={() => handleConversationSelect(conversation.clientId)}
                        className={cn(
                          "p-4 cursor-pointer hover:bg-background/80 transition-colors border-l-4",
                          isSelected
                            ? "bg-background border-l-gold-500 shadow-sm"
                            : "border-l-transparent"
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12 flex-shrink-0">
                            <AvatarFallback className={cn("text-white font-semibold", getVipTierColor(client.clientTier.toString()))}>
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold truncate">{client.name}</p>
                              <Badge
                                className={cn(
                                  "text-xs",
                                  client.clientTier <= 2
                                    ? "bg-gold-100 text-gold-800 border-gold-300"
                                    : "bg-gray-100 text-gray-700 border-gray-300"
                                )}
                                variant="outline"
                              >
                                T{client.clientTier}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.isFromClient ? '' : 'You: '}
                              {conversation.lastMessage.content}
                            </p>

                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conversation.lastMessage.timestamp)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatCurrency(client.lifetimeSpend)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No conversations found</p>
                </div>
              )}
            </div>
          </div>

          {/* Message Thread - Right Panel */}
          <div className="hidden md:flex flex-1 flex-col">
            {selectedConversation && selectedClient ? (
              <>
                {/* Client Header */}
                <div className="p-4 border-b bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className={cn("text-white font-semibold", getVipTierColor(selectedClient.clientTier.toString()))}>
                          {selectedClient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{selectedClient.name}</h3>
                          <Badge
                            className={cn(
                              "text-xs",
                              selectedClient.clientTier <= 2
                                ? "bg-gold-100 text-gold-800 border-gold-300"
                                : "bg-gray-100 text-gray-700 border-gray-300"
                            )}
                            variant="outline"
                          >
                            Tier {selectedClient.clientTier}
                          </Badge>
                          {selectedClient.clientTier <= 2 && (
                            <Crown className="h-4 w-4 text-gold-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(selectedClient.lifetimeSpend)} lifetime spend
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedConversation.messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.isFromClient ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-lg p-3",
                          message.isFromClient
                            ? "bg-messageGray-light dark:bg-messageGray-dark text-gray-900 dark:text-white"
                            : "bg-messageBlue-light dark:bg-messageBlue-dark text-white"
                        )}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {!message.isFromClient && (
                            <span className="text-xs opacity-70 ml-2">
                              {message.status === 'sent' && '✓'}
                              {message.status === 'delivered' && '✓✓'}
                              {message.status === 'read' && '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Composer */}
                <div className="border-t bg-background">
                  {/* Templates Panel */}
                  {showTemplates && selectedClient && (
                    <div className="p-4 border-b bg-muted/30">
                      <MessageTemplates
                        clientTier={selectedClient.clientTier}
                        clientName={selectedClient.name}
                        onSelectTemplate={handleTemplateSelect}
                      />
                    </div>
                  )}

                  {/* Composer */}
                  <div className="p-4">
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={cn(
                          "flex-shrink-0",
                          showTemplates && "bg-gold-50 border-gold-300 text-gold-700"
                        )}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Templates
                      </Button>
                      {selectedClient && (
                        <Badge
                          className={cn(
                            "ml-auto",
                            selectedClient.clientTier <= 2
                              ? "bg-gold-100 text-gold-800 border-gold-300"
                              : "bg-gray-100 text-gray-700 border-gray-300"
                          )}
                          variant="outline"
                        >
                          Tier {selectedClient.clientTier} Templates Available
                        </Badge>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Input
                        placeholder="Type a message..."
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSendMessage()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-messageBlue-light hover:bg-messageBlue-dark dark:bg-messageBlue-dark dark:hover:bg-messageBlue-light disabled:opacity-50 text-white"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        💡 Demo interface - messages would be sent via SMS
                      </p>
                      {messageInput && (
                        <p className="text-xs text-muted-foreground">
                          {messageInput.length} characters
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                  <p>Choose a client from the list to view your conversation</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </LenkersdorferSidebar>
  )
}
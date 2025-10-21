'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageSquare, Search, Plus, Phone, User, Crown, FileText, ArrowLeft, Send } from 'lucide-react'
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
import { triggerHapticFeedback } from '@/lib/haptic-utils'

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
  const [showNewMessageModal, setShowNewMessageModal] = useState(false)
  const [clientSearchQuery, setClientSearchQuery] = useState('')

  const handleConversationSelect = (clientId: string) => {
    setSelectedClientId(clientId)
    // Mark conversation as read when selected
    markConversationAsRead(clientId)
  }

  const handleStartNewMessage = (clientId: string) => {
    setSelectedClientId(clientId)
    setShowNewMessageModal(false)
    setClientSearchQuery('')
  }

  // Filter clients for new message modal
  const availableClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    client.phone.includes(clientSearchQuery)
  )

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

  // Auto-select first conversation if none is selected (desktop only)
  useEffect(() => {
    // Only auto-select on desktop (md breakpoint and above)
    const isDesktop = window.innerWidth >= 768
    if (conversations.length > 0 && !selectedClientId && isDesktop) {
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

    // Trigger haptic feedback
    triggerHapticFeedback()

    // In a real implementation, this would send the message via SMS API
    alert(`📱 Message would be sent to ${selectedClient.name}:\n\n"${messageInput}"\n\n✅ This is a demo - message not actually sent.`)

    // Clear the input
    setMessageInput('')
  }

  return (
    <LenkersdorferSidebar>
      <div className="flex flex-1 flex-col bg-background h-[calc(100vh-4rem)] md:h-screen overflow-hidden touch-pan-y">
        {/* Header - Sticky on Mobile, only show on conversation list */}
        {!selectedClientId && (
          <div className="sticky top-0 z-20 flex flex-col gap-4 p-4 md:p-6 border-b bg-background">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
              <p className="text-muted-foreground">Centralized client communication</p>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Conversation List - Left Panel */}
          <div className={cn(
            "w-full md:w-80 lg:w-96 border-r border-border/10 bg-card/30 backdrop-blur-sm flex flex-col overflow-hidden",
            selectedClientId && "hidden md:flex"
          )}>
            {/* Search and New Message */}
            <div className="p-4 bg-card/30 border-b border-border/20 space-y-3">
              <Button
                onClick={() => setShowNewMessageModal(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Message
              </Button>
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden" style={{ WebkitOverflowScrolling: 'touch' }}>
              {filteredConversations.length > 0 ? (
                <div className="space-y-1 pb-4">
                  {filteredConversations.map((conversation) => {
                    const client = getClientById(conversation.clientId)
                    if (!client) return null

                    const isSelected = selectedClientId === conversation.clientId

                    return (
                      <div
                        key={conversation.clientId}
                        onClick={() => handleConversationSelect(conversation.clientId)}
                        className={cn(
                          "p-3 md:p-4 cursor-pointer hover:bg-background/80 transition-colors border-l-4 border-b border-border/10",
                          isSelected
                            ? "bg-background border-l-gold-500 shadow-sm"
                            : "border-l-transparent"
                        )}
                      >
                        <div className="flex items-start gap-2 md:gap-3">
                          <Avatar className="h-10 w-10 md:h-12 md:w-12 flex-shrink-0">
                            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                              {client.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1 flex-wrap">
                              <p className="font-semibold text-sm md:text-base break-words">{client.name}</p>
                              <Badge
                                className={cn(
                                  "text-xs font-semibold flex-shrink-0",
                                  client.clientTier === 1 && "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
                                  client.clientTier === 2 && "bg-gold-100 text-gold-800 border-gold-300 dark:bg-gold-900/30 dark:text-gold-400 dark:border-gold-700",
                                  client.clientTier === 3 && "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
                                  client.clientTier === 4 && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
                                  client.clientTier === 5 && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                                )}
                                variant="outline"
                              >
                                Tier {client.clientTier}
                              </Badge>
                              {conversation.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white text-xs h-5 w-5 flex items-center justify-center rounded-full p-0 flex-shrink-0">
                                  {conversation.unreadCount}
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs md:text-sm text-muted-foreground break-words line-clamp-2">
                              {conversation.lastMessage.isFromClient ? '' : 'You: '}
                              {conversation.lastMessage.content}
                            </p>

                            <div className="flex items-center justify-between mt-1.5 md:mt-2 gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatMessageTime(conversation.lastMessage.timestamp)}
                              </span>
                              <span className="text-xs text-muted-foreground flex-shrink-0">
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
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden w-full",
            !selectedClientId && "hidden md:flex"
          )}>
            {selectedConversation && selectedClient ? (
              <>
                {/* Client Header */}
                <div className="p-1.5 md:p-4 border-b border-border/40 bg-card/50">
                  <div className="flex items-center justify-between">
                    {/* Back button for mobile */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="md:hidden mr-1"
                      onClick={() => setSelectedClientId(null)}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                      <Avatar className="h-8 w-8 md:h-10 md:w-10">
                        <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold text-xs md:text-sm">
                          {selectedClient.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5 md:gap-2">
                          <h3 className="font-semibold text-sm md:text-base">{selectedClient.name}</h3>
                          <Badge
                            className={cn(
                              "text-xs font-semibold",
                              selectedClient.clientTier === 1 && "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
                              selectedClient.clientTier === 2 && "bg-gold-100 text-gold-800 border-gold-300 dark:bg-gold-900/30 dark:text-gold-400 dark:border-gold-700",
                              selectedClient.clientTier === 3 && "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
                              selectedClient.clientTier === 4 && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
                              selectedClient.clientTier === 5 && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            )}
                            variant="outline"
                          >
                            Tier {selectedClient.clientTier}
                          </Badge>
                          {selectedClient.clientTier <= 2 && (
                            <Crown className="h-4 w-4 text-gold-500" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground hidden md:block">
                          {formatCurrency(selectedClient.lifetimeSpend)} lifetime spend
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="hidden md:flex">
                        <Phone className="h-4 w-4 mr-2" />
                        Call
                      </Button>
                      <Button variant="outline" size="sm" className="md:hidden p-2">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-2 md:p-4 space-y-3 md:space-y-4">
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
                          "max-w-[85%] md:max-w-[70%] rounded-lg p-2 md:p-3",
                          message.isFromClient
                            ? "bg-messageGray-light dark:bg-messageGray-dark text-gray-900 dark:text-white shadow-sm"
                            : "bg-messageBlue-light dark:bg-messageBlue-dark text-white shadow-sm border border-white/5 dark:border-white/10"
                        )}
                      >
                        <p className="text-sm md:text-base break-words">{message.content}</p>
                        <div className="flex items-center justify-between mt-1 md:mt-2 gap-2">
                          <span className="text-xs opacity-70">
                            {formatMessageTime(message.timestamp)}
                          </span>
                          {!message.isFromClient && (
                            <span className="text-xs opacity-70">
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
                <div className="border-t border-border/30 bg-card/20 backdrop-blur-sm">
                  {/* Templates Panel */}
                  {showTemplates && selectedClient && (
                    <div className="p-2 md:p-4 border-b border-border/30 bg-card/40 backdrop-blur-sm">
                      <MessageTemplates
                        clientTier={selectedClient.clientTier}
                        clientName={selectedClient.name}
                        onSelectTemplate={handleTemplateSelect}
                      />
                    </div>
                  )}

                  {/* Composer */}
                  <div className="p-1 md:p-4">
                    <div className="flex gap-2 mb-0.5 md:mb-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowTemplates(!showTemplates)}
                        className={cn(
                          "flex-shrink-0 text-xs md:text-sm",
                          showTemplates && "bg-gold-50 border-gold-300 text-gold-700"
                        )}
                      >
                        <FileText className="h-4 w-4 md:mr-2" />
                        <span className="hidden md:inline">Templates</span>
                      </Button>
                      {selectedClient && (
                        <Badge
                          className={cn(
                            "ml-auto font-semibold text-xs hidden md:flex",
                            selectedClient.clientTier === 1 && "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
                            selectedClient.clientTier === 2 && "bg-gold-100 text-gold-800 border-gold-300 dark:bg-gold-900/30 dark:text-gold-400 dark:border-gold-700",
                            selectedClient.clientTier === 3 && "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
                            selectedClient.clientTier === 4 && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
                            selectedClient.clientTier === 5 && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
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
                        className="flex-1 h-9 md:h-10"
                      />
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim()}
                        className="bg-messageBlue-light hover:bg-messageBlue-dark dark:bg-messageBlue-dark dark:hover:bg-messageBlue-light disabled:opacity-50 text-white flex-shrink-0 h-9 md:h-10"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                      <p className="hidden md:block">
                        💡 Demo interface - messages would be sent via SMS
                      </p>
                      <p className="md:hidden">💡 Demo - SMS</p>
                      {messageInput && (
                        <p>
                          {messageInput.length} chars
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

        {/* New Message Modal */}
        {showNewMessageModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-card border border-border rounded-lg w-full max-w-md max-h-[80vh] flex flex-col shadow-xl">
              {/* Modal Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold">New Message</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowNewMessageModal(false)
                      setClientSearchQuery('')
                    }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients..."
                    value={clientSearchQuery}
                    onChange={(e) => setClientSearchQuery(e.target.value)}
                    className="pl-10"
                    autoFocus
                  />
                </div>
              </div>

              {/* Client List */}
              <div className="flex-1 overflow-y-auto p-2">
                {availableClients.length > 0 ? (
                  availableClients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleStartNewMessage(client.id)}
                      className="w-full p-3 hover:bg-accent rounded-lg transition-colors text-left flex items-center gap-3"
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className={cn(
                          "text-sm font-semibold",
                          getVipTierColor(client.clientTier.toString())
                        )}>
                          {client.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{client.name}</span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs flex-shrink-0",
                              client.clientTier === 1 && "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700",
                              client.clientTier === 2 && "bg-gold-100 text-gold-800 border-gold-300 dark:bg-gold-900/30 dark:text-gold-400 dark:border-gold-700",
                              client.clientTier === 3 && "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700",
                              client.clientTier === 4 && "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400 dark:border-green-700",
                              client.clientTier === 5 && "bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
                            )}
                          >
                            Tier {client.clientTier}
                          </Badge>
                          {client.clientTier <= 2 && (
                            <Crown className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No clients found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </LenkersdorferSidebar>
  )
}
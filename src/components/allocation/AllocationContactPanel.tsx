'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Phone,
  MessageSquare,
  Mail,
  User,
  Crown,
  Clock,
  Star,
  CheckCircle2,
  X,
  Trophy,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore, formatCurrency } from '@/lib/store'
import { AllocationContact } from '@/types'
import { cn } from '@/lib/utils'

interface AllocationContactPanelProps {
  isOpen: boolean
  onClose: () => void
  watchId: string
  onContactInitiated?: (clientId: string, method: 'SMS' | 'CALL' | 'EMAIL') => void
}

export const AllocationContactPanel: React.FC<AllocationContactPanelProps> = ({
  isOpen,
  onClose,
  watchId,
  onContactInitiated
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState('priority_match')
  const [showSaleConfirmation, setShowSaleConfirmation] = useState<string | null>(null)

  const {
    generateAllocationContacts,
    getWatchModelById,
    getClientById,
    getSMSTemplates,
    generateSMSMessage,
    markContactAttempt,
    completeSale,
    removeFromWaitlist,
    waitlist
  } = useAppStore()

  const watch = getWatchModelById(watchId)
  const allocationContacts = generateAllocationContacts(watchId)
  const smsTemplates = getSMSTemplates('ALLOCATION')

  // Lock body scroll when panel is open - ALL HOOKS MUST BE BEFORE EARLY RETURNS
  useEffect(() => {
    // Only lock scroll if panel is open AND we have valid data
    if (!watch || !isOpen) return

    const originalStyle = window.getComputedStyle(document.body).overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = originalStyle
    }
  }, [isOpen, watch])

  if (!watch) return null

  const handleContact = (contact: AllocationContact, method: 'SMS' | 'CALL' | 'EMAIL') => {
    const client = getClientById(contact.clientId)
    if (!client) return

    let message = ''
    if (method === 'SMS') {
      message = generateSMSMessage(selectedTemplate, client.name, watch.brand, watch.model)
    }

    // Mark contact attempt
    markContactAttempt(
      contact.clientId,
      contact.watchModelId,
      method,
      message,
      true,
      `Priority allocation contact - Rank ${contact.rank}`
    )

    // Remove from waitlist (allocation complete) - find the correct waitlist entry
    const waitlistEntry = waitlist.find(
      entry => entry.clientId === contact.clientId && entry.watchModelId === contact.watchModelId
    )
    if (waitlistEntry) {
      removeFromWaitlist(waitlistEntry.id)
    }

    // Callback for parent component
    onContactInitiated?.(contact.clientId, method)

    // For SMS, open the messaging app
    if (method === 'SMS') {
      window.open(`sms:${client.phone}?body=${encodeURIComponent(message)}`)
    } else if (method === 'CALL') {
      window.open(`tel:${client.phone}`)
    } else if (method === 'EMAIL') {
      window.open(`mailto:${client.email}?subject=Your ${watch.brand} ${watch.model} is Available`)
    }
  }

  const handleSaleComplete = (contact: AllocationContact) => {
    completeSale(contact.clientId, contact.watchModelId)
    setShowSaleConfirmation(contact.clientId)
    setTimeout(() => setShowSaleConfirmation(null), 3000)
  }

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-purple-100 text-purple-800 border-purple-200'
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 3: return 'bg-gray-100 text-gray-800 border-gray-200'
      case 4: return 'bg-orange-100 text-orange-800 border-orange-200'
      case 5: return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black'
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-black'
    if (rank === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600 text-black'
    return 'bg-muted text-muted-foreground border'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel - Fixed positioning with vh units */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-[100vh] w-[600px] max-w-[90vw] bg-background border-l shadow-xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Allocation Contacts</h2>
                  <p className="text-muted-foreground text-sm">
                    {watch.brand} {watch.model} - {formatCurrency(watch.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* SMS Template Selection */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-sm">SMS Template</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {smsTemplates.map(template => (
                    <div
                      key={template.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors",
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {generateSMSMessage(template.id, 'Client Name', watch.brand, watch.model)}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Contact List */}
              <div className="space-y-4">
                <h3 className="font-semibold">Prioritized Contacts</h3>

                {allocationContacts.map((contact) => {
                  const client = getClientById(contact.clientId)
                  if (!client) return null

                  return (
                    <motion.div
                      key={contact.id}
                      layout
                      className="space-y-4"
                    >
                      <Card className={cn(
                        "transition-all duration-200",
                        contact.rank === 1 ? "border-yellow-200 bg-yellow-50" : ""
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            {/* Rank Badge */}
                            <div className={cn(
                              "flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold flex-shrink-0",
                              getRankStyle(contact.rank)
                            )}>
                              {contact.rank === 1 && <Trophy className="h-4 w-4" />}
                              {contact.rank !== 1 && contact.rank}
                            </div>

                            {/* Client Info */}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold">
                                    {client.name.split(' ').map((n: string) => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h4 className="font-semibold">{client.name}</h4>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Badge className={cn("text-xs border", getTierColor(client.clientTier))}>
                                      <Crown className="h-3 w-3 mr-1" />
                                      Tier {client.clientTier}
                                    </Badge>
                                    <span>{formatCurrency(client.lifetimeSpend)} lifetime</span>
                                  </div>
                                </div>
                              </div>

                              {/* Score & Reasons */}
                              <div className="mb-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <Star className="h-4 w-4 text-green-600" />
                                  <span className="font-medium text-green-600">Score: {contact.score}</span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {contact.reasons.slice(0, 3).map((reason, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {reason}
                                    </Badge>
                                  ))}
                                </div>
                              </div>

                              {/* Contact Buttons */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleContact(contact, 'SMS')}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  SMS
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleContact(contact, 'CALL')}
                                  className="flex-1"
                                >
                                  <Phone className="h-4 w-4 mr-2" />
                                  Call
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleSaleComplete(contact)}
                                  className="flex-1"
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Sale Complete
                                </Button>
                              </div>

                              {/* Phone Number Display */}
                              <div className="text-xs text-muted-foreground mt-2">
                                📱 {client.phone}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sale Confirmation */}
                      <AnimatePresence>
                        {showSaleConfirmation === contact.clientId && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-green-50 border border-green-200 p-4 rounded-lg"
                          >
                            <div className="flex items-center gap-2 text-green-800">
                              <CheckCircle2 className="h-5 w-5" />
                              <span className="font-medium">Sale completed for {client.name}!</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )
                })}

                {allocationContacts.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No waitlist entries</h3>
                      <p className="text-muted-foreground text-center">
                        No clients are currently waiting for this watch model.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
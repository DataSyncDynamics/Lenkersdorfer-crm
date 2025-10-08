'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Phone,
  MessageSquare,
  Calendar,
  Clock,
  User,
  ArrowRight,
  Send,
  CalendarDays
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface FollowUpModalProps {
  isOpen: boolean
  onClose: () => void
  client: {
    name: string
    phone: string
    tier: number
    preferredBrands?: string[]
    lastContact?: string
  }
  context: {
    alertType: string
    reason: string
    watchBrand?: string
    watchModel?: string
    daysWaiting?: number
  }
  onFollowUpAction: (action: string, details: any) => void
}

const QUICK_ACTIONS = [
  {
    id: 'call',
    label: 'Call Client',
    icon: Phone,
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
    description: 'Start phone call immediately'
  },
  {
    id: 'sms',
    label: 'Send SMS',
    icon: MessageSquare,
    color: 'bg-green-500 hover:bg-green-600 text-white',
    description: 'Send text message update'
  },
  {
    id: 'schedule',
    label: 'Schedule Viewing',
    icon: Calendar,
    color: 'bg-purple-500 hover:bg-purple-600 text-white',
    description: 'Book in-person appointment'
  }
]

const SMS_TEMPLATES = {
  VIP_WAITING: [
    "Hi {name}, I have an update on your {watch} waitlist status. When's a good time to call?",
    "Good news {name}! We may have movement on your {watch}. Call me when you can.",
    "{name}, checking in on your {watch} request. Any changes to your preferences?"
  ],
  HOT_LEADS: [
    "Hi {name}, following up on your interest in luxury timepieces. Any specific brands catching your eye?",
    "{name}, I have some exclusive pieces that might interest you. Available for a quick call?",
    "Hello {name}, new arrivals came in that match your style. Want to see them?"
  ],
  ALLOCATION: [
    "Exciting news {name}! I found a perfect match for you. Can we schedule a viewing?",
    "{name}, we have a {watch} available that's exactly what you're looking for!",
    "Hi {name}, your tier gives you first access to this new {watch}. Interested?"
  ],
  NEW_ARRIVALS: [
    "{name}, just got in a stunning {watch}. You were first on my list to see it.",
    "New arrival alert for {name}! This {watch} has your name on it.",
    "Hi {name}, fresh inventory includes a piece perfect for your collection."
  ]
}

// Removed SCHEDULE_SLOTS - now using only the custom calendar picker

// Generate available time slots for a given date
const generateTimeSlots = (date: Date) => {
  const slots = []
  const startHour = 9 // 9 AM
  const endHour = 17 // 5 PM

  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute of [0, 30]) {
      const timeSlot = new Date(date)
      timeSlot.setHours(hour, minute, 0, 0)

      // Skip past time slots for today
      if (timeSlot > new Date()) {
        slots.push({
          time: timeSlot.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          }),
          value: timeSlot.toISOString()
        })
      }
    }
  }

  return slots
}

// Generate next 14 days for calendar
const generateCalendarDays = () => {
  const days = []
  const today = new Date()

  for (let i = 0; i < 14; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    // Skip weekends for business appointments
    if (date.getDay() !== 0 && date.getDay() !== 6) {
      days.push({
        date,
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        slots: generateTimeSlots(date)
      })
    }
  }

  return days
}

export function FollowUpModal({
  isOpen,
  onClose,
  client,
  context,
  onFollowUpAction
}: FollowUpModalProps) {
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [smsMessage, setSmsMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  const getTierBadgeColor = (tier: number) => {
    const colors = {
      1: 'bg-purple-100 text-purple-800 border-purple-200',
      2: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      3: 'bg-blue-100 text-blue-800 border-blue-200',
      4: 'bg-green-100 text-green-800 border-green-200',
      5: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[tier as keyof typeof colors] || colors[5]
  }

  const formatTemplate = (template: string) => {
    return template
      .replace('{name}', client.name)
      .replace('{watch}', context.watchModel || context.watchBrand || 'your requested timepiece')
  }

  const handleQuickAction = (actionId: string) => {
    if (actionId === 'call') {
      // Immediate call action
      onFollowUpAction('call', {
        phone: client.phone,
        note: customNote,
        context: context.reason
      })
      onClose()
    } else {
      setSelectedAction(actionId)
    }
  }

  const handleSendSMS = () => {
    onFollowUpAction('sms', {
      phone: client.phone,
      message: smsMessage,
      context: context.reason
    })
    onClose()
  }

  const handleScheduleViewing = () => {
    const appointmentDetails = {
      clientId: client.name,
      note: customNote,
      context: context.reason,
      customDateTime: selectedTimeSlot,
      customDate: selectedDate?.toLocaleDateString()
    }

    onFollowUpAction('schedule', appointmentDetails)
    onClose()
  }

  const calendarDays = generateCalendarDays()

  const getTemplatesForContext = () => {
    const contextKey = context.alertType.toUpperCase().replace(/\s+/g, '_')
    return SMS_TEMPLATES[contextKey as keyof typeof SMS_TEMPLATES] || SMS_TEMPLATES.HOT_LEADS
  }

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Follow Up Action</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{context.reason}</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="dark:hover:bg-white/10">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Client Info */}
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="font-medium text-gray-900 dark:text-white">{client.name}</span>
                </div>
                <Badge className={getTierBadgeColor(client.tier)}>
                  Tier {client.tier}
                </Badge>
                {context.daysWaiting && (
                  <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                    <Clock className="w-4 h-4" />
                    {context.daysWaiting} days waiting
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)] bg-white dark:bg-gray-900">
              {!selectedAction ? (
                /* Quick Action Selection */
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 dark:text-white">Choose your next action:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {QUICK_ACTIONS.map((action) => (
                      <motion.button
                        key={action.id}
                        onClick={() => handleQuickAction(action.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "p-4 rounded-lg border-2 border-transparent transition-all text-left",
                          action.color
                        )}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <action.icon className="w-5 h-5" />
                          <span className="font-medium">{action.label}</span>
                        </div>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </motion.button>
                    ))}
                  </div>

                  {/* Custom Note */}
                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Add a note (optional)
                    </label>
                    <Textarea
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="Any additional context or notes..."
                      className="resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      rows={2}
                    />
                  </div>
                </div>
              ) : selectedAction === 'sms' ? (
                /* SMS Composition */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Send SMS to {client.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAction(null)}
                      className="dark:hover:bg-white/10"
                    >
                      Back
                    </Button>
                  </div>

                  {/* Quick Templates */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quick Templates
                    </label>
                    <div className="space-y-2">
                      {getTemplatesForContext().map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setSmsMessage(formatTemplate(template))}
                          className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-900 dark:text-white"
                        >
                          <p className="text-sm">{formatTemplate(template)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Message to {client.name}
                    </label>
                    <Textarea
                      value={smsMessage}
                      onChange={(e) => setSmsMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      rows={4}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {smsMessage.length}/160 characters
                    </p>
                  </div>

                  <Button
                    onClick={handleSendSMS}
                    disabled={!smsMessage.trim()}
                    className="w-full"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send SMS
                  </Button>
                </div>
              ) : selectedAction === 'schedule' ? (
                /* Schedule Viewing */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 dark:text-white">Schedule Viewing with {client.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAction(null)}
                      className="dark:hover:bg-white/10"
                    >
                      Back
                    </Button>
                  </div>

                  {/* Calendar Picker */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Select Date & Time</h4>

                    {/* Calendar Days */}
                    <div className="space-y-4">
                      {calendarDays.map((day) => (
                        <div key={day.date.toISOString()} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
                          <div
                            className={cn(
                              "font-medium mb-2 cursor-pointer p-2 rounded",
                              selectedDate?.toDateString() === day.date.toDateString()
                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300"
                                : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                            )}
                            onClick={() => {
                              setSelectedDate(day.date)
                              setSelectedTimeSlot('')
                            }}
                          >
                            {day.label}
                          </div>

                          {/* Time Slots */}
                          {selectedDate?.toDateString() === day.date.toDateString() && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="grid grid-cols-3 gap-2 mt-2"
                            >
                              {day.slots.map((slot) => (
                                <button
                                  key={slot.value}
                                  onClick={() => setSelectedTimeSlot(slot.value)}
                                  className={cn(
                                    "px-3 py-2 text-sm rounded border transition-colors",
                                    selectedTimeSlot === slot.value
                                      ? "bg-blue-500 text-white border-blue-500"
                                      : "bg-white dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-gray-600 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white"
                                  )}
                                >
                                  {slot.time}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Selected DateTime Summary */}
                    {selectedDate && selectedTimeSlot && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-900 dark:text-blue-300">
                            {selectedDate.toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })} at {new Date(selectedTimeSlot).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Appointment Note */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Appointment Notes
                    </label>
                    <Textarea
                      value={customNote}
                      onChange={(e) => setCustomNote(e.target.value)}
                      placeholder="Watch viewing, discussion topics, preparation notes..."
                      className="resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                      rows={3}
                    />
                  </div>

                  <Button
                    onClick={handleScheduleViewing}
                    disabled={!selectedDate || !selectedTimeSlot}
                    className="w-full"
                  >
                    <CalendarDays className="w-4 h-4 mr-2" />
                    Schedule Appointment
                  </Button>
                </div>
              ) : null}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
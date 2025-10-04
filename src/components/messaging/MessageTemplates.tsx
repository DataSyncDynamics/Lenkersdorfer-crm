'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MessageSquare, Clock, Star, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MessageTemplate {
  id: string
  title: string
  content: string
  category: 'greeting' | 'follow-up' | 'availability' | 'closing'
  tiers: number[] // Which client tiers this template is appropriate for
  icon: React.ReactNode
}

interface MessageTemplatesProps {
  clientTier: number
  clientName: string
  onSelectTemplate: (content: string) => void
  className?: string
}

const templates: MessageTemplate[] = [
  // Tier 1-2 VIP Templates
  {
    id: 'vip-personal-update',
    title: 'VIP Personal Update',
    content: 'Hi {clientName}, as one of our most valued clients, I wanted to personally update you on your timepiece search. I\'m actively working to find the perfect piece for your collection.',
    category: 'follow-up',
    tiers: [1, 2],
    icon: <Star className="h-4 w-4" />
  },
  {
    id: 'vip-exclusive-offering',
    title: 'VIP Exclusive Offering',
    content: 'Hi {clientName}, I have an exceptional piece that just became available. Given your discerning taste and history with us, I wanted to offer it to you first before it goes to market.',
    category: 'availability',
    tiers: [1, 2],
    icon: <Star className="h-4 w-4" />
  },

  // Tier 2-3 Templates
  {
    id: 'priority-check-in',
    title: 'Priority Check-in',
    content: 'Hi {clientName}, checking in on your timepiece request. I have some updates to share and wanted to see if your timeline has changed.',
    category: 'follow-up',
    tiers: [2, 3],
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: 'watch-found',
    title: 'Watch Found',
    content: 'Hi {clientName}, great news! I found a {watchModel} that matches your criteria. Would you like me to send photos and details?',
    category: 'availability',
    tiers: [2, 3, 4],
    icon: <Zap className="h-4 w-4" />
  },

  // General Templates (All Tiers)
  {
    id: 'initial-greeting',
    title: 'Initial Greeting',
    content: 'Hi {clientName}, thanks for your interest in luxury timepieces. I\'m here to help you find the perfect watch. What are you looking for?',
    category: 'greeting',
    tiers: [1, 2, 3, 4, 5],
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    id: 'timeline-inquiry',
    title: 'Timeline Inquiry',
    content: 'Hi {clientName}, following up on your interest in {watchModel}. Any updates on your timeline or budget?',
    category: 'follow-up',
    tiers: [3, 4, 5],
    icon: <Clock className="h-4 w-4" />
  },
  {
    id: 'general-availability',
    title: 'General Availability',
    content: 'Hi {clientName}, I wanted to check in about your watch search. Are you still interested in {watchModel}? Let me know if anything has changed.',
    category: 'follow-up',
    tiers: [4, 5],
    icon: <MessageSquare className="h-4 w-4" />
  },
  {
    id: 'price-update',
    title: 'Price Update',
    content: 'Hi {clientName}, I have a price update on the {watchModel} you were interested in. The market has shifted and I wanted to keep you informed.',
    category: 'availability',
    tiers: [1, 2, 3, 4, 5],
    icon: <Zap className="h-4 w-4" />
  },
  {
    id: 'thank-you-closing',
    title: 'Thank You & Keep Searching',
    content: 'Hi {clientName}, thank you for your patience. I\'m continuing to search for the perfect {watchModel} for you. I\'ll be in touch as soon as I find something.',
    category: 'closing',
    tiers: [1, 2, 3, 4, 5],
    icon: <MessageSquare className="h-4 w-4" />
  }
]

export function MessageTemplates({ clientTier, clientName, onSelectTemplate, className }: MessageTemplatesProps) {
  // Filter templates appropriate for the client's tier
  const relevantTemplates = templates.filter(template =>
    template.tiers.includes(clientTier)
  )

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'greeting': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'follow-up': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'availability': return 'bg-green-100 text-green-800 border-green-300'
      case 'closing': return 'bg-gray-100 text-gray-800 border-gray-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const processTemplate = (content: string): string => {
    return content
      .replace(/{clientName}/g, clientName)
      .replace(/{watchModel}/g, '[Watch Model]') // Placeholder for now
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
        <h4 className="font-medium text-sm">Message Templates</h4>
        <Badge variant="outline" className="text-xs">
          Tier {clientTier}
        </Badge>
      </div>

      <div className="h-64 overflow-y-auto">
        <div className="space-y-2 pr-3">
          {relevantTemplates.map((template) => (
            <div
              key={template.id}
              className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => onSelectTemplate(processTemplate(template.content))}
            >
              <div className="flex items-center gap-2 mb-2">
                {template.icon}
                <span className="font-medium text-sm">{template.title}</span>
                <Badge
                  variant="outline"
                  className={cn("text-xs ml-auto", getCategoryColor(template.category))}
                >
                  {template.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {processTemplate(template.content)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {relevantTemplates.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No templates available for this tier</p>
        </div>
      )}
    </div>
  )
}
'use client'

import React from 'react'
import { HelpCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface InfoTooltipProps {
  title: string
  description: string
  variant?: 'green' | 'red' | 'default'
  className?: string
}

export function InfoTooltip({ title, description, variant = 'default', className }: InfoTooltipProps) {
  const variantStyles = {
    green: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
    red: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800',
    default: 'bg-background border-border'
  }

  const iconStyles = {
    green: 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300',
    red: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300',
    default: 'text-muted-foreground hover:text-foreground'
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center transition-all duration-200 hover:scale-110",
              className
            )}
          >
            <HelpCircle className={cn("h-4 w-4", iconStyles[variant])} />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className={cn(
            "max-w-xs p-4 shadow-lg",
            variantStyles[variant]
          )}
        >
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

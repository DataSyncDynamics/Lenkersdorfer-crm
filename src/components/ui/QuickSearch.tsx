'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MagnifyingGlassIcon,
  MicrophoneIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

interface QuickSearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  onClear?: () => void
  value?: string
  showVoiceSearch?: boolean
  autoFocus?: boolean
}

export default function QuickSearch({
  placeholder = "Search clients...",
  onSearch,
  onClear,
  value = "",
  showVoiceSearch = true,
  autoFocus = false,
}: QuickSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value)
  const [isListening, setIsListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const recognition = useRef<any>(null)

  useEffect(() => {
    setSearchQuery(value)
  }, [value])

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  useEffect(() => {
    // Initialize speech recognition if available
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition()
      recognition.current.continuous = false
      recognition.current.interimResults = false
      recognition.current.lang = 'de-DE'

      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript
        setSearchQuery(transcript)
        onSearch(transcript)
        setIsListening(false)
      }

      recognition.current.onerror = () => {
        setIsListening(false)
      }

      recognition.current.onend = () => {
        setIsListening(false)
      }
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop()
      }
    }
  }, [onSearch])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    onSearch(query)
  }

  const handleClear = () => {
    setSearchQuery('')
    onSearch('')
    onClear?.()
    inputRef.current?.focus()
  }

  const handleVoiceSearch = () => {
    if (!recognition.current || isListening) return

    setIsListening(true)
    try {
      recognition.current.start()
    } catch (error) {
      setIsListening(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
    inputRef.current?.blur()
  }

  return (
    <form onSubmit={handleSubmit} className="relative mb-6">
      <div className="relative">
        {/* Search Icon */}
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="luxury-input w-full pl-12 pr-20 text-lg"
          autoComplete="off"
          autoCapitalize="words"
          spellCheck="false"
        />

        {/* Right Side Actions */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2">
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="touch-target p-2 text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}

          {showVoiceSearch && recognition.current && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              disabled={isListening}
              className={`touch-target p-2 ml-1 transition-colors ${
                isListening
                  ? 'text-red-400 animate-pulse'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Voice Search Indicator */}
      {isListening && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">Listening...</span>
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
          </div>
        </div>
      )}

      {/* Quick Filters */}
      <div className="flex space-x-2 mt-3 overflow-x-auto pb-2">
        {[
          { label: 'VIP', filter: 'vip:true' },
          { label: 'Gold+', filter: 'tier:gold,platinum' },
          { label: 'Recent', filter: 'recent:30' },
          { label: 'High Value', filter: 'spend:>100000' },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => {
              setSearchQuery(item.filter)
              onSearch(item.filter)
            }}
            className="flex-shrink-0 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-medium rounded-full border border-gray-600 transition-colors"
          >
            {item.label}
          </button>
        ))}
      </div>
    </form>
  )
}
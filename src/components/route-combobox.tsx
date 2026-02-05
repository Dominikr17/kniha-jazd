'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { MapPin } from 'lucide-react'
import { CITIES, type City } from '@/lib/cities'

interface RouteComboboxProps {
  value: string
  onChange: (value: string) => void
  id?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export default function RouteCombobox({
  value,
  onChange,
  id,
  placeholder,
  disabled,
  required,
}: RouteComboboxProps) {
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Click-outside detection
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const stripDiacritics = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const matchesQuery = (city: City, query: string): boolean => {
    if (stripDiacritics(city.name.toLowerCase()).startsWith(query)) return true
    if (city.alt && stripDiacritics(city.alt.toLowerCase()).startsWith(query)) return true
    return false
  }

  const getSuggestions = (query: string): string[] => {
    if (!query) return []
    const lower = stripDiacritics(query.toLowerCase())
    const results: string[] = []

    for (const city of CITIES) {
      if (matchesQuery(city, lower)) {
        results.push(city.name)
      }
      if (results.length >= 7) return results
    }

    return results
  }

  const suggestions = getSuggestions(value)

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setFocused(true)
          if (value) setOpen(true)
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete="off"
      />
      {open && focused && suggestions.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left transition-colors first:rounded-t-md last:rounded-b-md"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(suggestion)
                setOpen(false)
              }}
            >
              <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

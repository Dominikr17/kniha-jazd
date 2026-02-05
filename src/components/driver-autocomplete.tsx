'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { User } from 'lucide-react'

interface DriverOption {
  id: string
  name: string
}

interface DriverAutocompleteProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  excludeDriverId?: string
}

export default function DriverAutocomplete({
  value, onChange, placeholder = 'Mená spolucestujúcich',
  excludeDriverId,
}: DriverAutocompleteProps) {
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [open, setOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchDrivers = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('drivers')
        .select('id, first_name, last_name')
        .order('last_name')

      if (data) {
        setDrivers(data.map((driver) => ({
          id: driver.id,
          name: `${driver.last_name} ${driver.first_name}`,
        })))
      }
    }
    fetchDrivers()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrovať podľa posledného segmentu (za poslednou čiarkou)
  const getLastSegment = () => {
    const parts = value.split(',')
    return parts[parts.length - 1].trim()
  }

  const filtered = (() => {
    const search = getLastSegment().toLowerCase()
    if (!search) return []
    return drivers
      .filter((driver) => driver.id !== excludeDriverId)
      .filter((driver) => driver.name.toLowerCase().includes(search))
      .slice(0, 5)
  })()

  const handleSelect = (driverName: string) => {
    const parts = value.split(',').map((p) => p.trim()).filter(Boolean)
    // Nahradiť posledný segment vybraným menom
    if (parts.length > 0) {
      parts[parts.length - 1] = driverName
    } else {
      parts.push(driverName)
    }
    onChange(parts.join(', '))
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => {
          setFocused(true)
          if (getLastSegment()) setOpen(true)
        }}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && focused && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border bg-popover shadow-md">
          {filtered.map((driver) => (
            <button
              key={driver.id}
              type="button"
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left transition-colors first:rounded-t-md last:rounded-b-md"
              onMouseDown={(e) => {
                e.preventDefault()
                handleSelect(driver.name)
              }}
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              {driver.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

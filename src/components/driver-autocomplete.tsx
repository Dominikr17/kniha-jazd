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
  onDriverIdsChange?: (ids: string[]) => void
  placeholder?: string
  excludeDriverId?: string
}

export default function DriverAutocomplete({
  value, onChange, onDriverIdsChange, placeholder = 'Mená spolucestujúcich',
  excludeDriverId,
}: DriverAutocompleteProps) {
  const [drivers, setDrivers] = useState<DriverOption[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
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

  // Odvodiť IDs z aktuálneho textu — zachovať ID len pre mená vybrané z dropdownu
  const resolveDriverIds = (text: string, newlySelectedId?: string, replacedIndex?: number) => {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean)
    const ids: string[] = []
    for (let i = 0; i < parts.length; i++) {
      if (i === replacedIndex && newlySelectedId) {
        ids.push(newlySelectedId)
      } else {
        // Skúsiť nájsť existujúce ID pre toto meno
        const existingIdx = selectedIds.findIndex((id, si) => {
          const oldParts = value.split(',').map((p) => p.trim()).filter(Boolean)
          return oldParts[si] === parts[i] && id
        })
        if (existingIdx >= 0 && selectedIds[existingIdx]) {
          ids.push(selectedIds[existingIdx])
        }
      }
    }
    return ids
  }

  const handleSelect = (driverId: string, driverName: string) => {
    const parts = value.split(',').map((p) => p.trim()).filter(Boolean)
    const replacedIndex = parts.length > 0 ? parts.length - 1 : 0
    if (parts.length > 0) {
      parts[parts.length - 1] = driverName
    } else {
      parts.push(driverName)
    }
    const newValue = parts.join(', ')
    const newIds = resolveDriverIds(newValue, driverId, replacedIndex)
    setSelectedIds(newIds)
    onChange(newValue)
    onDriverIdsChange?.(newIds)
    setOpen(false)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        value={value}
        onChange={(e) => {
          const newValue = e.target.value
          onChange(newValue)
          // Pri voľnom písaní prepočítať IDs (zachovať len pre nezmenené mená)
          const newIds = resolveDriverIds(newValue)
          setSelectedIds(newIds)
          onDriverIdsChange?.(newIds)
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
                handleSelect(driver.id, driver.name)
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

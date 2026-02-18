'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TimeInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  disabled?: boolean
  className?: string
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))

function TimeInput({ id, value, onChange, required, disabled, className }: TimeInputProps) {
  const [hours, minutes] = value ? value.split(':') : ['', '']

  const handleChange = (h: string, m: string) => {
    if (h && m) {
      onChange(`${h}:${m}`)
    } else if (h) {
      onChange(`${h}:00`)
    } else if (m) {
      onChange(`00:${m}`)
    }
  }

  const selectClass = cn(
    'bg-transparent outline-none cursor-pointer text-base md:text-sm',
    'appearance-none [-webkit-appearance:none] [-moz-appearance:none]',
  )

  return (
    <div
      className={cn(
        'border-input flex h-9 items-center gap-0.5 rounded-md border bg-transparent px-3 shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      <select
        id={id}
        value={hours}
        onChange={(e) => handleChange(e.target.value, minutes || '00')}
        required={required}
        disabled={disabled}
        className={selectClass}
        aria-label="Hodiny"
      >
        <option value="">--</option>
        {HOURS.map((h) => (
          <option key={h} value={h}>
            {h}
          </option>
        ))}
      </select>
      <span className="text-muted-foreground select-none">:</span>
      <select
        value={minutes}
        onChange={(e) => handleChange(hours || '00', e.target.value)}
        required={required}
        disabled={disabled}
        className={selectClass}
        aria-label="Minúty"
      >
        <option value="">--</option>
        {MINUTES.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </select>
    </div>
  )
}

export { TimeInput }

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

function TimeInput({ id, value, onChange, required, disabled, className }: TimeInputProps) {
  const hoursRef = React.useRef<HTMLInputElement>(null)
  const minutesRef = React.useRef<HTMLInputElement>(null)

  const [hours, minutes] = value ? value.split(':') : ['', '']

  const clamp = (val: string, max: number) => {
    const num = parseInt(val, 10)
    if (isNaN(num)) return ''
    return String(Math.min(Math.max(num, 0), max)).padStart(2, '0')
  }

  const emitChange = (h: string, m: string) => {
    if (h && m) {
      onChange(`${h}:${m}`)
    }
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(-2)
    if (raw === '') {
      onChange('')
      return
    }
    const clamped = clamp(raw, 23)
    emitChange(clamped, minutes || '00')
    if (raw.length >= 2 || parseInt(raw, 10) > 2) {
      minutesRef.current?.focus()
      minutesRef.current?.select()
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(-2)
    if (raw === '') {
      emitChange(hours || '00', '00')
      return
    }
    const clamped = clamp(raw, 59)
    emitChange(hours || '00', clamped)
  }

  const handleHoursKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowRight' || e.key === ':') {
      e.preventDefault()
      minutesRef.current?.focus()
      minutesRef.current?.select()
    }
  }

  const handleMinutesKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      hoursRef.current?.focus()
      hoursRef.current?.select()
    }
    if (e.key === 'Backspace' && (minutesRef.current?.value === '' || minutesRef.current?.value === '00')) {
      e.preventDefault()
      hoursRef.current?.focus()
      hoursRef.current?.select()
    }
  }

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select()
  }

  const inputClass = cn(
    'w-7 bg-transparent text-center text-base outline-none md:text-sm',
    'placeholder:text-muted-foreground',
  )

  return (
    <div
      className={cn(
        'border-input flex h-9 w-full items-center justify-center gap-0.5 rounded-md border bg-transparent shadow-xs transition-[color,box-shadow]',
        'focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
        disabled && 'pointer-events-none cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        ref={hoursRef}
        id={id}
        type="text"
        inputMode="numeric"
        value={hours}
        onChange={handleHoursChange}
        onKeyDown={handleHoursKeyDown}
        onFocus={handleFocus}
        placeholder="--"
        maxLength={2}
        required={required}
        disabled={disabled}
        className={inputClass}
        aria-label="Hodiny"
      />
      <span className="text-muted-foreground select-none">:</span>
      <input
        ref={minutesRef}
        type="text"
        inputMode="numeric"
        value={minutes}
        onChange={handleMinutesChange}
        onKeyDown={handleMinutesKeyDown}
        onFocus={handleFocus}
        placeholder="--"
        maxLength={2}
        required={required}
        disabled={disabled}
        className={inputClass}
        aria-label="Minúty"
      />
    </div>
  )
}

export { TimeInput }

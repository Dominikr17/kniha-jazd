'use client'

import { useState } from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from '@/components/ui/command'
import {
  Popover, PopoverContent, PopoverTrigger
} from '@/components/ui/popover'
import { FOREIGN_ALLOWANCE_RATES } from '@/types'

interface CountryComboboxProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

const countries = Object.entries(FOREIGN_ALLOWANCE_RATES).map(([code, info]) => ({
  value: code,
  label: info.name,
  rate: info.rate,
  currency: info.currency,
}))

export default function CountryCombobox({
  value, onValueChange, placeholder = 'Vyberte krajinu',
}: CountryComboboxProps) {
  const [open, setOpen] = useState(false)

  const selected = countries.find((c) => c.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {selected ? (
            <span>{selected.label} ({selected.rate} {selected.currency}/deň)</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Hľadať krajinu..." />
          <CommandList>
            <CommandEmpty>Krajina sa nenašla.</CommandEmpty>
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.value}
                  value={`${country.label} ${country.value}`}
                  onSelect={() => {
                    onValueChange(country.value)
                    setOpen(false)
                  }}
                >
                  <Check className={cn(
                    'mr-2 h-4 w-4',
                    value === country.value ? 'opacity-100' : 'opacity-0'
                  )} />
                  <span className="flex-1">{country.label}</span>
                  <span className="text-muted-foreground text-xs">{country.rate} {country.currency}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

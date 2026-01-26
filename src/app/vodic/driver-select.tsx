'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Check, ChevronsUpDown, Loader2, User } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Driver {
  id: string
  first_name: string
  last_name: string
}

interface DriverSelectProps {
  drivers: Driver[]
}

export function DriverSelect({ drivers }: DriverSelectProps) {
  const [open, setOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSelect = (driver: Driver) => {
    setSelectedDriver(driver)
    setOpen(false)
  }

  const handleSubmit = async () => {
    if (!selectedDriver) return

    setIsSubmitting(true)

    const formData = new FormData()
    formData.append('driverId', selectedDriver.id)
    formData.append('driverName', `${selectedDriver.first_name} ${selectedDriver.last_name}`)

    const response = await fetch('/api/driver/login', {
      method: 'POST',
      body: formData,
    })

    if (response.redirected) {
      router.push(response.url)
    } else {
      router.push('/vodic/jazdy')
    }
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-12 text-base"
            disabled={isSubmitting}
          >
            {selectedDriver ? (
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                {selectedDriver.first_name} {selectedDriver.last_name}
              </span>
            ) : (
              <span className="text-muted-foreground">Vyberte vodiča...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command
            filter={(value, search) => {
              if (value.toLowerCase().includes(search.toLowerCase())) return 1
              return 0
            }}
          >
            <CommandInput placeholder="Hľadať vodiča..." />
            <CommandList>
              <CommandEmpty>Vodič nenájdený.</CommandEmpty>
              <CommandGroup>
                {drivers.map((driver) => (
                  <CommandItem
                    key={driver.id}
                    value={`${driver.first_name} ${driver.last_name}`}
                    onSelect={() => handleSelect(driver)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedDriver?.id === driver.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <User className="mr-2 h-4 w-4 text-muted-foreground" />
                    {driver.first_name} {driver.last_name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        onClick={handleSubmit}
        disabled={!selectedDriver || isSubmitting}
        className="w-full h-12 text-base"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Prihlasujem...
          </>
        ) : (
          'Pokračovať'
        )}
      </Button>
    </div>
  )
}

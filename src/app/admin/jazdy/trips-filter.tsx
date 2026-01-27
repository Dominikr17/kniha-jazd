'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { TRIP_TYPES } from '@/types'

interface TripsFilterProps {
  vehicles: { id: string; name: string; license_plate: string }[]
  drivers: { id: string; first_name: string; last_name: string }[]
  currentFilters: {
    vehicle?: string
    driver?: string
    tripType?: string
    from?: string
    to?: string
  }
}

export function TripsFilter({ vehicles, drivers, currentFilters }: TripsFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/jazdy?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/admin/jazdy')
  }

  const hasFilters = currentFilters.vehicle || currentFilters.driver || currentFilters.tripType || currentFilters.from || currentFilters.to

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="space-y-2">
            <Label htmlFor="vehicle">Vozidlo</Label>
            <Select
              value={currentFilters.vehicle || 'all'}
              onValueChange={(v) => updateFilter('vehicle', v)}
            >
              <SelectTrigger id="vehicle">
                <SelectValue placeholder="Všetky vozidlá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky vozidlá</SelectItem>
                {vehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} ({v.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver">Vodič</Label>
            <Select
              value={currentFilters.driver || 'all'}
              onValueChange={(v) => updateFilter('driver', v)}
            >
              <SelectTrigger id="driver">
                <SelectValue placeholder="Všetci vodiči" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetci vodiči</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.first_name} {d.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tripType">Typ jazdy</Label>
            <Select
              value={currentFilters.tripType || 'all'}
              onValueChange={(v) => updateFilter('tripType', v)}
            >
              <SelectTrigger id="tripType">
                <SelectValue placeholder="Všetky typy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky typy</SelectItem>
                {Object.entries(TRIP_TYPES).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="from">Od dátumu</Label>
            <Input
              id="from"
              type="date"
              value={currentFilters.from || ''}
              onChange={(e) => updateFilter('from', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="to">Do dátumu</Label>
            <Input
              id="to"
              type="date"
              value={currentFilters.to || ''}
              onChange={(e) => updateFilter('to', e.target.value)}
            />
          </div>

          {hasFilters && (
            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} className="w-full">
                <X className="mr-2 h-4 w-4" />
                Zrušiť filtre
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

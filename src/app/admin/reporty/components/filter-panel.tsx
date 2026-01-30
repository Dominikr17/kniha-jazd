'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Filter, X, Calendar } from 'lucide-react'
import { PERIOD_OPTIONS, isValidPeriod, type PeriodType } from '@/lib/report-utils'
import { Vehicle, Driver } from '@/types'

interface FilterPanelProps {
  vehicles: Vehicle[]
  drivers: Driver[]
}

export function FilterPanel({ vehicles, drivers }: FilterPanelProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Inicializácia z URL parametrov s validáciou
  const urlPeriod = searchParams.get('period')
  const [period, setPeriod] = useState<PeriodType>(
    urlPeriod && isValidPeriod(urlPeriod) ? urlPeriod : 'all'
  )
  const [vehicleId, setVehicleId] = useState(searchParams.get('vehicle') || 'all')
  const [driverId, setDriverId] = useState(searchParams.get('driver') || 'all')
  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || '')
  const [dateTo, setDateTo] = useState(searchParams.get('to') || '')

  const showCustomDates = period === 'custom'

  // Aktualizácia URL pri zmene filtrov
  const applyFilters = () => {
    const params = new URLSearchParams()

    if (period !== 'all') params.set('period', period)
    if (vehicleId !== 'all') params.set('vehicle', vehicleId)
    if (driverId !== 'all') params.set('driver', driverId)
    if (period === 'custom') {
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)
    }

    const queryString = params.toString()
    router.push(`/admin/reporty${queryString ? `?${queryString}` : ''}`)
  }

  // Reset filtrov
  const resetFilters = () => {
    setPeriod('all')
    setVehicleId('all')
    setDriverId('all')
    setDateFrom('')
    setDateTo('')
    router.push('/admin/reporty')
  }

  // Zistenie či sú aktívne filtre
  const hasActiveFilters =
    period !== 'all' || vehicleId !== 'all' || driverId !== 'all'

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Filter className="h-4 w-4" />
            Filtre
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Obdobie */}
            <div className="space-y-2">
              <Label htmlFor="period">Obdobie</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
                <SelectTrigger id="period">
                  <SelectValue placeholder="Vyberte obdobie" />
                </SelectTrigger>
                <SelectContent>
                  {PERIOD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vozidlo */}
            <div className="space-y-2">
              <Label htmlFor="vehicle">Vozidlo</Label>
              <Select value={vehicleId} onValueChange={setVehicleId}>
                <SelectTrigger id="vehicle">
                  <SelectValue placeholder="Všetky vozidlá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetky vozidlá</SelectItem>
                  {vehicles.map((vehicle) => (
                    <SelectItem key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.license_plate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vodič */}
            <div className="space-y-2">
              <Label htmlFor="driver">Vodič</Label>
              <Select value={driverId} onValueChange={setDriverId}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder="Všetci vodiči" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všetci vodiči</SelectItem>
                  {drivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.first_name} {driver.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tlačidlá */}
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="flex-1">
                Použiť
              </Button>
              {hasActiveFilters && (
                <Button variant="outline" size="icon" onClick={resetFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Vlastné obdobie */}
          {showCustomDates && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pt-2 border-t">
              <div className="space-y-2">
                <Label htmlFor="dateFrom">Od</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dateFrom"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateTo">Do</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="dateTo"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

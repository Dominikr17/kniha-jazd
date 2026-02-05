'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Trip, TRIP_PURPOSES } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import RouteCombobox from '@/components/route-combobox'

interface EditTripFormProps {
  trip: Trip
  vehicles: { id: string; name: string; license_plate: string }[]
  drivers: { id: string; first_name: string; last_name: string }[]
}

export function EditTripForm({ trip, vehicles, drivers }: EditTripFormProps) {
  const isPredefinedPurpose = TRIP_PURPOSES.includes(trip.purpose as typeof TRIP_PURPOSES[number])

  const [vehicleId, setVehicleId] = useState(trip.vehicle_id)
  const [driverId, setDriverId] = useState(trip.driver_id)
  const [date, setDate] = useState(trip.date)
  const [timeStart, setTimeStart] = useState(trip.time_start.slice(0, 5))
  const [timeEnd, setTimeEnd] = useState(trip.time_end?.slice(0, 5) || '')
  const [routeFrom, setRouteFrom] = useState(trip.route_from)
  const [routeTo, setRouteTo] = useState(trip.route_to)
  const [purpose, setPurpose] = useState(isPredefinedPurpose ? trip.purpose : 'Iné')
  const [customPurpose, setCustomPurpose] = useState(isPredefinedPurpose ? '' : trip.purpose)
  const [odometerStart, setOdometerStart] = useState(trip.odometer_start.toString())
  const [odometerEnd, setOdometerEnd] = useState(trip.odometer_end?.toString() || '')
  const [notes, setNotes] = useState(trip.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const finalPurpose = purpose === 'Iné' ? customPurpose : purpose

    if (!finalPurpose.trim()) {
      toast.error('Zadajte účel cesty')
      return
    }

    setIsSubmitting(true)

    const oldData = {
      vehicle_id: trip.vehicle_id,
      driver_id: trip.driver_id,
      date: trip.date,
      time_start: trip.time_start,
      time_end: trip.time_end,
      route_from: trip.route_from,
      route_to: trip.route_to,
      purpose: trip.purpose,
      odometer_start: trip.odometer_start,
      odometer_end: trip.odometer_end,
      notes: trip.notes,
    }

    const newData = {
      vehicle_id: vehicleId,
      driver_id: driverId,
      date,
      time_start: timeStart,
      time_end: timeEnd || null,
      route_from: routeFrom.trim(),
      route_to: routeTo.trim(),
      purpose: finalPurpose.trim(),
      odometer_start: parseInt(odometerStart),
      odometer_end: odometerEnd ? parseInt(odometerEnd) : null,
      notes: notes.trim() || null,
    }

    const { error } = await supabase
      .from('trips')
      .update(newData)
      .eq('id', trip.id)

    if (error) {
      toast.error('Nepodarilo sa uložiť zmeny')
      console.error(error)
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'trips',
      recordId: trip.id,
      operation: 'UPDATE',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      oldData,
      newData,
    })

    toast.success('Zmeny boli uložené')
    router.push('/admin/jazdy')
    router.refresh()
  }

  const distance = odometerStart && odometerEnd
    ? parseInt(odometerEnd) - parseInt(odometerStart)
    : null

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Vozidlo a vodič */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vozidlo *</Label>
          <Select value={vehicleId} onValueChange={setVehicleId} disabled={isSubmitting}>
            <SelectTrigger id="vehicle">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicles.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.name} ({vehicle.license_plate})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="driver">Vodič *</Label>
          <Select value={driverId} onValueChange={setDriverId} disabled={isSubmitting}>
            <SelectTrigger id="driver">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Dátum a čas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Dátum *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeStart">Čas odchodu *</Label>
          <Input
            id="timeStart"
            type="time"
            value={timeStart}
            onChange={(e) => setTimeStart(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeEnd">Čas príchodu</Label>
          <Input
            id="timeEnd"
            type="time"
            value={timeEnd}
            onChange={(e) => setTimeEnd(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Trasa */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="routeFrom">Odkiaľ *</Label>
          <RouteCombobox
            id="routeFrom"
            value={routeFrom}
            onChange={setRouteFrom}
            required
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="routeTo">Kam *</Label>
          <RouteCombobox
            id="routeTo"
            value={routeTo}
            onChange={setRouteTo}
            required
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Účel cesty */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Účel cesty *</Label>
        <Select value={purpose} onValueChange={setPurpose} disabled={isSubmitting}>
          <SelectTrigger id="purpose">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TRIP_PURPOSES.map((purposeOption) => (
              <SelectItem key={purposeOption} value={purposeOption}>
                {purposeOption}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {purpose === 'Iné' && (
          <Input
            className="mt-2"
            placeholder="Zadajte vlastný účel cesty"
            value={customPurpose}
            onChange={(e) => setCustomPurpose(e.target.value)}
            disabled={isSubmitting}
          />
        )}
      </div>

      {/* Tachometer */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="odometerStart">Tachometer začiatok (km) *</Label>
          <Input
            id="odometerStart"
            type="number"
            value={odometerStart}
            onChange={(e) => setOdometerStart(e.target.value)}
            required
            disabled={isSubmitting}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="odometerEnd">Tachometer koniec (km) *</Label>
          <Input
            id="odometerEnd"
            type="number"
            value={odometerEnd}
            onChange={(e) => setOdometerEnd(e.target.value)}
            required
            disabled={isSubmitting}
            min={odometerStart ? parseInt(odometerStart) : 0}
          />
        </div>
        <div className="space-y-2">
          <Label>Najazdené km</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
            {distance !== null && distance >= 0 ? `${distance} km` : '-'}
          </div>
        </div>
      </div>

      {/* Poznámky */}
      <div className="space-y-2">
        <Label htmlFor="notes">Poznámky</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          rows={3}
        />
      </div>

      {/* Tlačidlá */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ukladám...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Uložiť zmeny
            </>
          )}
        </Button>
        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
          <Link href="/admin/jazdy">Zrušiť</Link>
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState, useEffect } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Save, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { TRIP_PURPOSES, TRIP_TYPES, TripType } from '@/types'
import { logAudit } from '@/lib/audit-logger'

interface NewTripFormProps {
  vehicles: { id: string; name: string; license_plate: string }[]
  drivers: { id: string; first_name: string; last_name: string }[]
}

export function NewTripForm({ vehicles, drivers }: NewTripFormProps) {
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [tripType, setTripType] = useState<TripType>('sluzobna')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [routeFrom, setRouteFrom] = useState('ZVL')
  const [routeTo, setRouteTo] = useState('')
  const [purpose, setPurpose] = useState('')
  const [customPurpose, setCustomPurpose] = useState('')
  const [odometerStart, setOdometerStart] = useState('')
  const [odometerEnd, setOdometerEnd] = useState('')
  const [roundTrip, setRoundTrip] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastOdometer, setLastOdometer] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  // Načítanie posledného stavu tachometra pre vybrané vozidlo
  useEffect(() => {
    if (!vehicleId) {
      return
    }

    const fetchLastOdometer = async () => {
      // Najprv skúsime poslednú jazdu
      const { data: lastTrip } = await supabase
        .from('trips')
        .select('odometer_end')
        .eq('vehicle_id', vehicleId)
        .not('odometer_end', 'is', null)
        .order('date', { ascending: false })
        .order('time_start', { ascending: false })
        .limit(1)
        .single()

      if (lastTrip?.odometer_end) {
        setLastOdometer(lastTrip.odometer_end)
        setOdometerStart(lastTrip.odometer_end.toString())
      } else {
        // Ak nie je jazda, použijeme počiatočný stav z vozidla
        const { data: vehicle } = await supabase
          .from('vehicles')
          .select('initial_odometer')
          .eq('id', vehicleId)
          .single()

        if (vehicle) {
          setLastOdometer(vehicle.initial_odometer)
          setOdometerStart(vehicle.initial_odometer.toString())
        } else {
          setLastOdometer(null)
          setOdometerStart('')
        }
      }
    }

    fetchLastOdometer()
  }, [vehicleId, supabase])

  // Validácia tachometra - použitie useMemo namiesto useEffect
  const odometerWarning = (() => {
    if (!odometerStart || lastOdometer === null) {
      return null
    }
    const start = parseInt(odometerStart)
    if (start < lastOdometer) {
      return `Hodnota je nižšia ako posledný stav (${lastOdometer} km)`
    } else if (start > lastOdometer + 10) {
      return `Hodnota je vyššia o viac ako 10 km od posledného stavu (${lastOdometer} km)`
    }
    return null
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleId || !driverId) {
      toast.error('Vyberte vozidlo a vodiča')
      return
    }

    const finalPurpose = purpose === 'Iné' ? customPurpose : purpose

    if (!finalPurpose.trim()) {
      toast.error('Zadajte účel cesty')
      return
    }

    setIsSubmitting(true)

    const tripData = {
      vehicle_id: vehicleId,
      driver_id: driverId,
      trip_type: tripType,
      date,
      time_start: timeStart,
      time_end: timeEnd || null,
      route_from: routeFrom.trim(),
      route_to: routeTo.trim(),
      purpose: finalPurpose.trim(),
      odometer_start: parseInt(odometerStart),
      odometer_end: odometerEnd ? parseInt(odometerEnd) : null,
      round_trip: roundTrip,
      notes: notes.trim() || null,
    }

    const { data, error } = await supabase.from('trips').insert(tripData).select().single()

    if (error) {
      toast.error('Nepodarilo sa uložiť jazdu')
      console.error(error)
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'trips',
      recordId: data.id,
      operation: 'INSERT',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      newData: tripData,
    })

    toast.success('Jazda bola uložená')
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
              <SelectValue placeholder="Vyberte vozidlo" />
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
              <SelectValue placeholder="Vyberte vodiča" />
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

      {/* Typ jazdy */}
      <div className="space-y-2">
        <Label htmlFor="tripType">Typ jazdy *</Label>
        <Select value={tripType} onValueChange={(v) => setTripType(v as TripType)} disabled={isSubmitting}>
          <SelectTrigger id="tripType">
            <SelectValue placeholder="Vyberte typ jazdy" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRIP_TYPES).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <Input
            id="routeFrom"
            value={routeFrom}
            onChange={(e) => setRouteFrom(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Miesto odchodu"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="routeTo">Kam *</Label>
          <Input
            id="routeTo"
            value={routeTo}
            onChange={(e) => setRouteTo(e.target.value)}
            required
            disabled={isSubmitting}
            placeholder="Cieľové miesto"
          />
        </div>
      </div>

      {/* Spiatočná jazda */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="roundTrip"
          checked={roundTrip}
          onCheckedChange={(checked) => setRoundTrip(checked === true)}
          disabled={isSubmitting}
        />
        <Label htmlFor="roundTrip" className="font-normal cursor-pointer">
          Aj cesta späť (spiatočná jazda)
        </Label>
      </div>

      {/* Účel cesty */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Účel cesty *</Label>
        <Select value={purpose} onValueChange={setPurpose} disabled={isSubmitting}>
          <SelectTrigger id="purpose">
            <SelectValue placeholder="Vyberte účel cesty" />
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
      <div className="space-y-4">
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
            <Label htmlFor="odometerEnd">Tachometer koniec (km)</Label>
            <Input
              id="odometerEnd"
              type="number"
              value={odometerEnd}
              onChange={(e) => setOdometerEnd(e.target.value)}
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

        {odometerWarning && (
          <Alert variant="destructive" className="bg-yellow-50 border-yellow-200 text-yellow-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{odometerWarning}</AlertDescription>
          </Alert>
        )}
      </div>

      {/* Poznámky */}
      <div className="space-y-2">
        <Label htmlFor="notes">Poznámky</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isSubmitting}
          placeholder="Voliteľné poznámky k jazde"
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
              Uložiť jazdu
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

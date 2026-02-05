'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { TripType } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import { TripFormFields } from '@/components/trip-form-fields'

interface NewTripFormProps {
  vehicles: { id: string; name: string; license_plate: string }[]
  drivers: { id: string; first_name: string; last_name: string }[]
}

export function NewTripForm({ vehicles, drivers }: NewTripFormProps) {
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [tripType, setTripType] = useState<TripType>('sluzobna')
  const [date, setDate] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [routeFrom, setRouteFrom] = useState('ZVL')
  const [routeTo, setRouteTo] = useState('')
  const [purpose, setPurpose] = useState('')
  const [customPurpose, setCustomPurpose] = useState('')
  const [odometerStart, setOdometerStart] = useState('')
  const [odometerEnd, setOdometerEnd] = useState('')
  const [visitPlace, setVisitPlace] = useState('')
  const [roundTrip, setRoundTrip] = useState(true)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [lastOdometer, setLastOdometer] = useState<number | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!vehicleId) return

    const fetchLastOdometer = async () => {
      const { data: lastTrip } = await supabase
        .from('trips')
        .select('odometer_end')
        .eq('vehicle_id', vehicleId)
        .not('odometer_end', 'is', null)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (lastTrip?.odometer_end) {
        setLastOdometer(lastTrip.odometer_end)
        setOdometerStart(lastTrip.odometer_end.toString())
      } else {
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

  const odometerWarning = (() => {
    if (!odometerStart || lastOdometer === null) return null
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

    const resolvedPurpose = purpose === 'Iné' ? customPurpose : purpose

    if (!resolvedPurpose.trim()) {
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
      visit_place: visitPlace.trim(),
      purpose: resolvedPurpose.trim(),
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
      <TripFormFields
        vehicles={vehicles}
        vehicleId={vehicleId}
        onVehicleChange={setVehicleId}
        drivers={drivers}
        driverId={driverId}
        onDriverChange={setDriverId}
        tripType={tripType}
        onTripTypeChange={setTripType}
        date={date}
        onDateChange={setDate}
        timeStart={timeStart}
        onTimeStartChange={setTimeStart}
        timeEnd={timeEnd}
        onTimeEndChange={setTimeEnd}
        routeFrom={routeFrom}
        onRouteFromChange={setRouteFrom}
        routeTo={routeTo}
        onRouteToChange={setRouteTo}
        roundTrip={roundTrip}
        onRoundTripChange={setRoundTrip}
        visitPlace={visitPlace}
        onVisitPlaceChange={setVisitPlace}
        purpose={purpose}
        onPurposeChange={setPurpose}
        customPurpose={customPurpose}
        onCustomPurposeChange={setCustomPurpose}
        odometerStart={odometerStart}
        onOdometerStartChange={setOdometerStart}
        odometerEnd={odometerEnd}
        onOdometerEndChange={setOdometerEnd}
        distance={distance}
        odometerWarning={odometerWarning}
        notes={notes}
        onNotesChange={setNotes}
        disabled={isSubmitting}
        isSubmitting={isSubmitting}
        submitLabel="Uložiť jazdu"
        cancelHref="/admin/jazdy"
      />
    </form>
  )
}

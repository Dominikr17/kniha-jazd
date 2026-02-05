'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Trip, TRIP_PURPOSES } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import { TripFormFields } from '@/components/trip-form-fields'

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
  const [visitPlace, setVisitPlace] = useState(trip.visit_place || '')
  const [roundTrip, setRoundTrip] = useState(trip.round_trip)
  const [notes, setNotes] = useState(trip.notes || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const resolvedPurpose = purpose === 'Iné' ? customPurpose : purpose

    if (!resolvedPurpose.trim()) {
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
      visit_place: trip.visit_place,
      purpose: trip.purpose,
      odometer_start: trip.odometer_start,
      odometer_end: trip.odometer_end,
      round_trip: trip.round_trip,
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
      visit_place: visitPlace.trim(),
      purpose: resolvedPurpose.trim(),
      odometer_start: parseInt(odometerStart),
      odometer_end: odometerEnd ? parseInt(odometerEnd) : null,
      round_trip: roundTrip,
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
      <TripFormFields
        vehicles={vehicles}
        vehicleId={vehicleId}
        onVehicleChange={setVehicleId}
        drivers={drivers}
        driverId={driverId}
        onDriverChange={setDriverId}
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
        notes={notes}
        onNotesChange={setNotes}
        disabled={isSubmitting}
        isSubmitting={isSubmitting}
        submitLabel="Uložiť zmeny"
        cancelHref="/admin/jazdy"
      />
    </form>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import CountryCombobox from '@/components/country-combobox'
import { Loader2, Route, MapPin, Clock, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import type { Trip } from '@/types'

interface StepTripsAndTypeProps {
  driverId: string
  tripType: 'tuzemska' | 'zahranicna'
  setTripType: (v: 'tuzemska' | 'zahranicna') => void
  destinationCountry: string
  setDestinationCountry: (v: string) => void
  selectedTripIds: string[]
  setSelectedTripIds: (ids: string[]) => void
  selectedTrips: Trip[]
  setSelectedTrips: (trips: Trip[]) => void
  onAutoFill: (data: {
    departureDate: string
    returnDate: string
    destinationCity: string
    visitPlace: string
    purpose: string
    transportType: string
  }) => void
  editingBusinessTripId?: string
}

function deriveAutoFillData(trips: Trip[]) {
  if (trips.length === 0) return null

  const sorted = [...trips].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date)
    if (dateCompare !== 0) return dateCompare
    return (a.time_start || '').localeCompare(b.time_start || '')
  })

  const earliest = sorted[0]
  const latest = sorted[sorted.length - 1]

  // departure_date: najskoršia jazda date + time_start
  const departureDate = earliest.time_start
    ? `${earliest.date}T${earliest.time_start}`
    : `${earliest.date}T07:00`

  // return_date: najneskoršia jazda date + time_end
  const returnDate = latest.time_end
    ? `${latest.date}T${latest.time_end}`
    : `${latest.date}T17:00`

  // destination_city: najčastejší route_to (vylúčiac "ZVL" a route_from hodnoty)
  const routeToCounts: Record<string, number> = {}
  for (const trip of trips) {
    const to = trip.route_to?.trim()
    if (to && !to.toUpperCase().includes('ZVL')) {
      routeToCounts[to] = (routeToCounts[to] || 0) + 1
    }
  }
  let destinationCity = ''
  if (Object.keys(routeToCounts).length > 0) {
    destinationCity = Object.entries(routeToCounts)
      .sort((a, b) => b[1] - a[1])[0][0]
  } else {
    // Fallback: posledný route_to
    destinationCity = latest.route_to || ''
  }

  // visit_place: najčastejšie visit_place z vybraných jázd (vylúčiť null/prázdne)
  const visitPlaceCounts: Record<string, number> = {}
  for (const trip of trips) {
    const vp = trip.visit_place?.trim()
    if (vp) {
      visitPlaceCounts[vp] = (visitPlaceCounts[vp] || 0) + 1
    }
  }
  let visitPlace = ''
  if (Object.keys(visitPlaceCounts).length > 0) {
    visitPlace = Object.entries(visitPlaceCounts)
      .sort((a, b) => b[1] - a[1])[0][0]
  }

  // purpose: z prvej jazdy
  const purpose = earliest.purpose || ''

  // transport_type: ak jazda má vozidlo → služobné auto
  const transportType = earliest.vehicle_id ? 'AUS_sluzobne' : 'AUS_sluzobne'

  return { departureDate, returnDate, destinationCity, visitPlace, purpose, transportType }
}

export default function StepTripsAndType({
  driverId, tripType, setTripType,
  destinationCountry, setDestinationCountry,
  selectedTripIds, setSelectedTripIds,
  selectedTrips, setSelectedTrips,
  onAutoFill, editingBusinessTripId,
}: StepTripsAndTypeProps) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('trips')
        .select('*, vehicle:vehicles(name, license_plate)')
        .eq('driver_id', driverId)
        .in('trip_type', ['sluzobna', 'sluzobna_n'])
        .order('date', { ascending: false })
        .limit(100)

      if (error) console.error('Error fetching trips:', error)

      if (data) {
        // Vyfiltrovať jazdy priradené k inej SC (okrem editovanej)
        const { data: assigned } = await supabase
          .from('business_trip_trips')
          .select('trip_id, business_trip_id')

        const assignedIds = new Set(
          (assigned || [])
            .filter((a) => a.business_trip_id !== editingBusinessTripId)
            .map((a) => a.trip_id)
        )
        const available = data.filter((trip) => !assignedIds.has(trip.id))
        setTrips(available)
      }

      setLoading(false)
    }

    fetchTrips()
  }, [driverId, editingBusinessTripId])

  const handleToggle = (tripId: string, checked: boolean) => {
    let newIds: string[]
    if (checked) {
      newIds = [...selectedTripIds, tripId]
    } else {
      newIds = selectedTripIds.filter((id) => id !== tripId)
    }
    setSelectedTripIds(newIds)

    const newSelectedTrips = trips.filter((trip) => newIds.includes(trip.id))
    setSelectedTrips(newSelectedTrips)

    // Auto-fill z vybraných jázd
    const autoFill = deriveAutoFillData(newSelectedTrips)
    if (autoFill) {
      onAutoFill(autoFill)
    }
  }

  const totalKm = selectedTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
  const autoFill = selectedTrips.length > 0 ? deriveAutoFillData(selectedTrips) : null

  return (
    <div className="space-y-5">
      {/* Typ cesty */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Typ cesty</Label>
        <RadioGroup
          value={tripType}
          onValueChange={(v) => setTripType(v as 'tuzemska' | 'zahranicna')}
          className="flex gap-4"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="tuzemska" id="tuzemska" />
            <Label htmlFor="tuzemska">Tuzemská</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="zahranicna" id="zahranicna" />
            <Label htmlFor="zahranicna">Zahraničná</Label>
          </div>
        </RadioGroup>
      </div>

      {tripType === 'zahranicna' && (
        <div>
          <Label>Krajina</Label>
          <CountryCombobox value={destinationCountry} onValueChange={setDestinationCountry} />
        </div>
      )}

      {/* Výber jázd */}
      <div>
        <h3 className="font-medium">Vyberte služobné jazdy</h3>
        <p className="text-sm text-muted-foreground">
          Vyberte jazdy patriace k tejto služobnej ceste. Údaje sa automaticky predvyplnia.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : trips.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Route className="h-8 w-8 mx-auto mb-2" />
          <p>Žiadne dostupné služobné jazdy.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <label
              key={trip.id}
              className="flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-gray-50 transition-colors"
            >
              <Checkbox
                checked={selectedTripIds.includes(trip.id)}
                onCheckedChange={(checked) => handleToggle(trip.id, !!checked)}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">
                    {trip.route_from} &rarr; {trip.route_to}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {trip.distance || 0} km
                  </span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {format(new Date(trip.date), 'd.M.yyyy', { locale: sk })}
                  {trip.time_start && ` ${trip.time_start.slice(0, 5)}`}
                  {trip.time_end && `–${trip.time_end.slice(0, 5)}`}
                  {' · '}
                  {trip.vehicle?.name || ''} ({trip.vehicle?.license_plate || ''})
                </div>
              </div>
            </label>
          ))}
        </div>
      )}

      {/* Súhrn vybraných jázd */}
      {selectedTripIds.length > 0 && (
        <div className="rounded-lg bg-[#004B87]/5 border border-[#004B87]/20 p-4 space-y-2">
          <p className="text-sm font-medium">
            Vybraných: {selectedTripIds.length} jázd, celkom {totalKm} km
          </p>

          {autoFill && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Odchod: {format(new Date(autoFill.departureDate), 'd.M.yyyy HH:mm', { locale: sk })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>Návrat: {format(new Date(autoFill.returnDate), 'd.M.yyyy HH:mm', { locale: sk })}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                <span>Cieľ: {autoFill.destinationCity}</span>
              </div>
              {autoFill.purpose && (
                <div className="flex items-center gap-1.5">
                  <Route className="h-3.5 w-3.5" />
                  <span>Účel: {autoFill.purpose}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

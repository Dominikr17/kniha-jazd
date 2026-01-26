'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { FUEL_TYPES, Vehicle, Driver } from '@/types'

export default function NewFuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [odometer, setOdometer] = useState('')
  const [liters, setLiters] = useState('')
  const [pricePerLiter, setPricePerLiter] = useState('')
  const [fuelType, setFuelType] = useState('')
  const [gasStation, setGasStation] = useState('')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: vehiclesData }, { data: driversData }] = await Promise.all([
        supabase.from('vehicles').select('*').order('name'),
        supabase.from('drivers').select('*').order('last_name'),
      ])

      setVehicles(vehiclesData || [])
      setDrivers(driversData || [])
      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  // Nastavenie typu paliva podľa vozidla
  useEffect(() => {
    if (vehicleId) {
      const vehicle = vehicles.find((v) => v.id === vehicleId)
      if (vehicle) {
        setFuelType(vehicle.fuel_type)
      }
    }
  }, [vehicleId, vehicles])

  const totalPrice = liters && pricePerLiter
    ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2)
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleId) {
      toast.error('Vyberte vozidlo')
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.from('fuel_records').insert({
      vehicle_id: vehicleId,
      driver_id: driverId || null,
      date,
      odometer: parseInt(odometer),
      liters: parseFloat(liters),
      price_per_liter: parseFloat(pricePerLiter),
      total_price: parseFloat(totalPrice),
      fuel_type: fuelType,
      gas_station: gasStation.trim() || null,
      notes: notes.trim() || null,
    })

    if (error) {
      toast.error('Nepodarilo sa uložiť tankovanie')
      console.error(error)
      setIsSubmitting(false)
      return
    }

    toast.success('Tankovanie bolo uložené')
    router.push('/phm')
    router.refresh()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/phm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nové tankovanie</h1>
          <p className="text-muted-foreground">Zaznamenanie tankovania PHM</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Údaje o tankovaní</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Vozidlo *</Label>
                <Select value={vehicleId} onValueChange={setVehicleId} disabled={isSubmitting}>
                  <SelectTrigger id="vehicle">
                    <SelectValue placeholder="Vyberte vozidlo" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select value={driverId} onValueChange={setDriverId} disabled={isSubmitting}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Vyberte vodiča (voliteľné)" />
                  </SelectTrigger>
                  <SelectContent>
                    {drivers.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.first_name} {d.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
                <Label htmlFor="odometer">Stav tachometra (km) *</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  required
                  disabled={isSubmitting}
                  min={0}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="liters">Množstvo (litre) *</Label>
                <Input
                  id="liters"
                  type="number"
                  step="0.01"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  required
                  disabled={isSubmitting}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pricePerLiter">Cena za liter (EUR) *</Label>
                <Input
                  id="pricePerLiter"
                  type="number"
                  step="0.001"
                  value={pricePerLiter}
                  onChange={(e) => setPricePerLiter(e.target.value)}
                  required
                  disabled={isSubmitting}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Celková suma (EUR)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                  {totalPrice ? `${totalPrice} EUR` : '-'}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fuelType">Typ paliva *</Label>
                <Select value={fuelType} onValueChange={setFuelType} disabled={isSubmitting}>
                  <SelectTrigger id="fuelType">
                    <SelectValue placeholder="Vyberte typ paliva" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUEL_TYPES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gasStation">Čerpacia stanica</Label>
                <Input
                  id="gasStation"
                  value={gasStation}
                  onChange={(e) => setGasStation(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="napr. Shell, OMV..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Poznámky</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={isSubmitting}
                rows={2}
              />
            </div>

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
                    Uložiť
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <Link href="/phm">Zrušiť</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

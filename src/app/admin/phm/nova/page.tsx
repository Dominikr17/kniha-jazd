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
import { Checkbox } from '@/components/ui/checkbox'
import { FUEL_TYPES, FUEL_COUNTRIES, PAYMENT_METHODS, Vehicle, Driver, FuelCountry, PaymentMethod } from '@/types'
import { logAudit } from '@/lib/audit-logger'

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
  const [country, setCountry] = useState<FuelCountry>('SK')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('company_card')
  const [notes, setNotes] = useState('')
  const [fullTank, setFullTank] = useState(false)
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
  const handleVehicleChange = (newVehicleId: string) => {
    setVehicleId(newVehicleId)
    const vehicle = vehicles.find((v) => v.id === newVehicleId)
    if (vehicle) {
      setFuelType(vehicle.fuel_type)
    }
  }

  const totalPrice = liters && pricePerLiter
    ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2)
    : ''

  const priceWithoutVat = totalPrice
    ? (parseFloat(totalPrice) / (1 + FUEL_COUNTRIES[country].vatRate)).toFixed(2)
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleId) {
      toast.error('Vyberte vozidlo')
      return
    }

    setIsSubmitting(true)

    const fuelData = {
      vehicle_id: vehicleId,
      driver_id: driverId || null,
      date,
      odometer: odometer ? parseInt(odometer) : null,
      liters: parseFloat(liters),
      price_per_liter: parseFloat(pricePerLiter),
      total_price: parseFloat(totalPrice),
      price_without_vat: priceWithoutVat ? parseFloat(priceWithoutVat) : null,
      country,
      payment_method: paymentMethod,
      fuel_type: fuelType,
      gas_station: gasStation.trim() || null,
      notes: notes.trim() || null,
      full_tank: fullTank,
    }

    const { data, error } = await supabase.from('fuel_records').insert(fuelData).select().single()

    if (error) {
      toast.error('Nepodarilo sa uložiť tankovanie')
      console.error(error)
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'fuel_records',
      recordId: data.id,
      operation: 'INSERT',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      newData: fuelData,
    })

    // Ak je full_tank, vytvoríme záznam v fuel_inventory
    if (fullTank) {
      const vehicle = vehicles.find(v => v.id === vehicleId)
      if (vehicle?.tank_capacity) {
        const { error: invError } = await supabase
          .from('fuel_inventory')
          .insert({
            vehicle_id: vehicleId,
            date,
            fuel_amount: vehicle.tank_capacity,
            source: 'full_tank',
            fuel_record_id: data.id
          })
        if (invError) {
          toast.warning(`Tankovanie uložené, ale nepodarilo sa vytvoriť referenčný bod`)
          console.error(invError)
        }
      } else {
        toast.warning('Tankovanie uložené, ale vozidlo nemá nastavenú kapacitu nádrže')
      }
    }

    toast.success('Tankovanie bolo uložené')
    router.push('/admin/phm')
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
          <Link href="/admin/phm">
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
                <Select value={vehicleId} onValueChange={handleVehicleChange} disabled={isSubmitting}>
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
                <Label htmlFor="driver">Vodič</Label>
                <Select value={driverId} onValueChange={setDriverId} disabled={isSubmitting}>
                  <SelectTrigger id="driver">
                    <SelectValue placeholder="Vyberte vodiča (voliteľné)" />
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
                <Label htmlFor="odometer">Stav tachometra (km)</Label>
                <Input
                  id="odometer"
                  type="number"
                  value={odometer}
                  onChange={(e) => setOdometer(e.target.value)}
                  disabled={isSubmitting}
                  min={0}
                  placeholder="voliteľné"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              <div className="space-y-2">
                <Label>Bez DPH (EUR)</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                  {priceWithoutVat ? `${priceWithoutVat} EUR` : '-'}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="fullTank"
                checked={fullTank}
                onCheckedChange={(checked) => setFullTank(checked === true)}
                disabled={isSubmitting}
              />
              <Label htmlFor="fullTank" className="text-sm font-normal cursor-pointer">
                Plná nádrž (tankovanie do plna)
              </Label>
            </div>

            <div className="grid gap-4 grid-cols-2">
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
                  placeholder="Shell, OMV..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Krajina *</Label>
                <Select value={country} onValueChange={(v) => setCountry(v as FuelCountry)} disabled={isSubmitting}>
                  <SelectTrigger id="country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FUEL_COUNTRIES).map(([code, data]) => (
                      <SelectItem key={code} value={code}>
                        {data.flag} {data.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Spôsob platby *</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} disabled={isSubmitting}>
                  <SelectTrigger id="paymentMethod">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAYMENT_METHODS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Link href="/admin/phm">Zrušiť</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

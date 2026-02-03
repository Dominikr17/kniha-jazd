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
import { ArrowLeft, Loader2, Save, Info } from 'lucide-react'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { FUEL_TYPES, FUEL_COUNTRIES, PAYMENT_METHODS, FUEL_CURRENCIES, COUNTRY_CURRENCY_MAP, Vehicle, Driver, FuelCountry, PaymentMethod, FuelCurrency } from '@/types'
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
  // Podpora cudzej meny
  const [currency, setCurrency] = useState<FuelCurrency>('EUR')
  const [confirmEurNow, setConfirmEurNow] = useState(false) // Admin môže potvrdiť EUR hneď
  const [eurTotalPrice, setEurTotalPrice] = useState('') // EUR suma ak admin potvrdzuje hneď
  const [exchangeRate, setExchangeRate] = useState('') // Kurz ak admin potvrdzuje hneď
  const router = useRouter()
  const supabase = createClient()

  // Detekcia cudzej meny podľa krajiny
  const isForeignCurrency = currency !== 'EUR'
  const currencySymbol = FUEL_CURRENCIES[currency].symbol

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

  // Nastavenie meny podľa krajiny
  const handleCountryChange = (newCountry: FuelCountry) => {
    setCountry(newCountry)
    const newCurrency = COUNTRY_CURRENCY_MAP[newCountry]
    setCurrency(newCurrency)
    // Reset EUR potvrdenia pri zmene krajiny
    setConfirmEurNow(false)
    setEurTotalPrice('')
    setExchangeRate('')
  }

  // Pre cudziu menu: toto je suma v pôvodnej mene
  const totalPrice = liters && pricePerLiter
    ? (parseFloat(liters) * parseFloat(pricePerLiter)).toFixed(2)
    : ''

  // Ak admin zadáva EUR sumu priamo, použijeme ju, inak počítame z totalPrice
  const effectiveEurTotal = isForeignCurrency && confirmEurNow && eurTotalPrice
    ? eurTotalPrice
    : (isForeignCurrency ? '' : totalPrice)

  // Cena bez DPH sa počíta len ak máme EUR sumu
  const priceWithoutVat = effectiveEurTotal
    ? (parseFloat(effectiveEurTotal) / (1 + FUEL_COUNTRIES[country].vatRate)).toFixed(2)
    : ''

  // EUR cena za liter (ak admin potvrdzuje hneď)
  const eurPricePerLiter = effectiveEurTotal && liters
    ? (parseFloat(effectiveEurTotal) / parseFloat(liters)).toFixed(3)
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!vehicleId) {
      toast.error('Vyberte vozidlo')
      return
    }

    setIsSubmitting(true)

    // Určíme či je EUR potvrdené
    const isEurConfirmed = !isForeignCurrency || confirmEurNow

    const fuelData = {
      vehicle_id: vehicleId,
      driver_id: driverId || null,
      date,
      odometer: odometer ? parseInt(odometer) : null,
      liters: parseFloat(liters),
      // EUR hodnoty: buď priamo zadané alebo z potvrdenia
      price_per_liter: isEurConfirmed ? parseFloat(eurPricePerLiter || pricePerLiter) : 0,
      total_price: isEurConfirmed ? parseFloat(effectiveEurTotal || totalPrice) : 0,
      price_without_vat: priceWithoutVat ? parseFloat(priceWithoutVat) : null,
      country,
      payment_method: paymentMethod,
      fuel_type: fuelType,
      gas_station: gasStation.trim() || null,
      notes: notes.trim() || null,
      full_tank: fullTank,
      // Nové stĺpce pre cudziu menu
      original_currency: currency,
      original_total_price: isForeignCurrency ? parseFloat(totalPrice) : null,
      original_price_per_liter: isForeignCurrency ? parseFloat(pricePerLiter) : null,
      eur_confirmed: isEurConfirmed,
      exchange_rate: isForeignCurrency && confirmEurNow && exchangeRate ? parseFloat(exchangeRate) : null,
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
                <Label htmlFor="country">Krajina tankovania *</Label>
                <Select value={country} onValueChange={(v) => handleCountryChange(v as FuelCountry)} disabled={isSubmitting}>
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
              {country === 'other' ? (
                <div className="space-y-2">
                  <Label htmlFor="currency">Mena *</Label>
                  <Select value={currency} onValueChange={(v) => setCurrency(v as FuelCurrency)} disabled={isSubmitting}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FUEL_CURRENCIES).map(([code, data]) => (
                        <SelectItem key={code} value={code}>
                          {data.symbol} {data.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
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
              )}
            </div>

            {country === 'other' && (
              <div className="space-y-2 max-w-[200px]">
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
            )}

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
                <Label htmlFor="pricePerLiter">Cena za liter ({currencySymbol}) *</Label>
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
                <Label>Celková suma ({currencySymbol})</Label>
                <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                  {totalPrice ? `${totalPrice} ${currencySymbol}` : '-'}
                </div>
              </div>
              {(!isForeignCurrency || confirmEurNow) && (
                <div className="space-y-2">
                  <Label>Bez DPH (EUR)</Label>
                  <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                    {priceWithoutVat ? `${priceWithoutVat} EUR` : '-'}
                  </div>
                </div>
              )}
            </div>

            {isForeignCurrency && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Tankovanie v cudzej mene ({currency})</AlertTitle>
                <AlertDescription>
                  Môžete zadať EUR sumu hneď (ak máte bankový výpis), alebo nechať na doplnenie neskôr.
                </AlertDescription>
              </Alert>
            )}

            {isForeignCurrency && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="confirmEurNow"
                    checked={confirmEurNow}
                    onCheckedChange={(checked) => setConfirmEurNow(checked === true)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="confirmEurNow" className="text-sm font-medium cursor-pointer">
                    Zadať EUR sumu teraz
                  </Label>
                </div>

                {confirmEurNow && (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="eurTotalPrice">Celková suma v EUR *</Label>
                      <Input
                        id="eurTotalPrice"
                        type="number"
                        step="0.01"
                        value={eurTotalPrice}
                        onChange={(e) => setEurTotalPrice(e.target.value)}
                        required={confirmEurNow}
                        disabled={isSubmitting}
                        min={0}
                        placeholder="napr. 85.50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exchangeRate">Kurz ({currency}/EUR)</Label>
                      <Input
                        id="exchangeRate"
                        type="number"
                        step="0.0001"
                        value={exchangeRate}
                        onChange={(e) => setExchangeRate(e.target.value)}
                        disabled={isSubmitting}
                        min={0}
                        placeholder="napr. 25.45"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Cena za liter (EUR)</Label>
                      <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
                        {eurPricePerLiter ? `${eurPricePerLiter} EUR` : '-'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

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

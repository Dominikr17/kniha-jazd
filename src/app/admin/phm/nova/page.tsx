'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { FUEL_COUNTRIES, COUNTRY_CURRENCY_MAP, FUEL_CURRENCIES, Vehicle, Driver, FuelCountry, PaymentMethod, FuelCurrency } from '@/types'
import { logAudit } from '@/lib/audit-logger'
import { getLocalDateString } from '@/lib/utils'
import { FuelFormFields } from '@/components/fuel-form-fields'

export default function NewFuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [vehicleId, setVehicleId] = useState('')
  const [driverId, setDriverId] = useState('')
  const [date, setDate] = useState(getLocalDateString())
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
  const [confirmEurNow, setConfirmEurNow] = useState(false)
  const [eurTotalPrice, setEurTotalPrice] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  // Detekcia cudzej meny podľa krajiny
  const isForeignCurrency = currency !== 'EUR'
  const currencySymbol = FUEL_CURRENCIES[currency].symbol

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [{ data: vehiclesData, error: vehiclesError }, { data: driversData, error: driversError }] = await Promise.all([
          supabase.from('vehicles').select('*').order('name'),
          supabase.from('drivers').select('*').order('last_name'),
        ])

        if (vehiclesError || driversError) {
          console.error('Error fetching data:', vehiclesError || driversError)
          toast.error('Chyba pri načítaní údajov')
        }

        setVehicles(vehiclesData || [])
        setDrivers(driversData || [])
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Chyba pri načítaní údajov')
      } finally {
        setIsLoading(false)
      }
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
        <Button variant="ghost" size="icon" asChild aria-label="Späť">
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
          <form onSubmit={handleSubmit}>
            <FuelFormFields
              vehicles={vehicles}
              vehicleId={vehicleId}
              onVehicleChange={handleVehicleChange}
              drivers={drivers}
              driverId={driverId}
              onDriverChange={setDriverId}
              date={date}
              onDateChange={setDate}
              country={country}
              onCountryChange={handleCountryChange}
              currency={currency}
              onCurrencyChange={setCurrency}
              gasStation={gasStation}
              onGasStationChange={setGasStation}
              liters={liters}
              onLitersChange={setLiters}
              pricePerLiter={pricePerLiter}
              onPricePerLiterChange={setPricePerLiter}
              totalPrice={totalPrice}
              priceWithoutVat={priceWithoutVat}
              isForeignCurrency={isForeignCurrency}
              currencySymbol={currencySymbol}
              fullTank={fullTank}
              onFullTankChange={setFullTank}
              odometer={odometer}
              onOdometerChange={setOdometer}
              fuelType={fuelType}
              onFuelTypeChange={setFuelType}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={setPaymentMethod}
              notes={notes}
              onNotesChange={setNotes}
              showEurConfirmation={true}
              confirmEurNow={confirmEurNow}
              onConfirmEurNowChange={setConfirmEurNow}
              eurTotalPrice={eurTotalPrice}
              onEurTotalPriceChange={setEurTotalPrice}
              exchangeRate={exchangeRate}
              onExchangeRateChange={setExchangeRate}
              eurPricePerLiter={eurPricePerLiter}
              disabled={isSubmitting}
              isSubmitting={isSubmitting}
              cancelHref="/admin/phm"
            />
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

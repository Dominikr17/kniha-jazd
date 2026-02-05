'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save, Info } from 'lucide-react'
import { FUEL_TYPES, FUEL_COUNTRIES, PAYMENT_METHODS, FUEL_CURRENCIES, Vehicle, Driver, FuelCountry, PaymentMethod, FuelCurrency } from '@/types'

interface FuelFormFieldsProps {
  // Vozidlo
  vehicles: Vehicle[]
  vehicleId: string
  onVehicleChange: (vehicleId: string) => void

  // Vodič (len admin)
  drivers?: Driver[]
  driverId?: string
  onDriverChange?: (driverId: string) => void

  // Základné údaje
  date: string
  onDateChange: (date: string) => void
  country: FuelCountry
  onCountryChange: (country: FuelCountry) => void
  currency: FuelCurrency
  onCurrencyChange: (currency: FuelCurrency) => void
  gasStation: string
  onGasStationChange: (station: string) => void

  // Množstvo a cena
  liters: string
  onLitersChange: (liters: string) => void
  pricePerLiter: string
  onPricePerLiterChange: (price: string) => void

  // Vypočítané hodnoty
  totalPrice: string
  priceWithoutVat: string
  isForeignCurrency: boolean
  currencySymbol: string

  // Plná nádrž a tachometer
  fullTank: boolean
  onFullTankChange: (fullTank: boolean) => void
  odometer: string
  onOdometerChange: (odometer: string) => void

  // Typ paliva a platba
  fuelType: string
  onFuelTypeChange: (fuelType: string) => void
  paymentMethod: PaymentMethod
  onPaymentMethodChange: (method: PaymentMethod) => void

  // Poznámky
  notes: string
  onNotesChange: (notes: string) => void

  // EUR potvrdenie (len admin)
  showEurConfirmation?: boolean
  confirmEurNow?: boolean
  onConfirmEurNowChange?: (confirm: boolean) => void
  eurTotalPrice?: string
  onEurTotalPriceChange?: (price: string) => void
  exchangeRate?: string
  onExchangeRateChange?: (rate: string) => void
  eurPricePerLiter?: string

  // Stav formulára
  disabled: boolean
  isSubmitting: boolean
  cancelHref: string
}

export function FuelFormFields({
  vehicles,
  vehicleId,
  onVehicleChange,
  drivers,
  driverId,
  onDriverChange,
  date,
  onDateChange,
  country,
  onCountryChange,
  currency,
  onCurrencyChange,
  gasStation,
  onGasStationChange,
  liters,
  onLitersChange,
  pricePerLiter,
  onPricePerLiterChange,
  totalPrice,
  priceWithoutVat,
  isForeignCurrency,
  currencySymbol,
  fullTank,
  onFullTankChange,
  odometer,
  onOdometerChange,
  fuelType,
  onFuelTypeChange,
  paymentMethod,
  onPaymentMethodChange,
  notes,
  onNotesChange,
  showEurConfirmation = false,
  confirmEurNow = false,
  onConfirmEurNowChange,
  eurTotalPrice = '',
  onEurTotalPriceChange,
  exchangeRate = '',
  onExchangeRateChange,
  eurPricePerLiter = '',
  disabled,
  isSubmitting,
  cancelHref,
}: FuelFormFieldsProps) {
  const showDriverSelect = drivers && onDriverChange
  const showPriceWithoutVat = !isForeignCurrency || (showEurConfirmation && confirmEurNow)

  return (
    <div className="space-y-4">
      {/* Vozidlo a vodič */}
      <div className={`grid gap-4 ${showDriverSelect ? 'sm:grid-cols-2' : ''}`}>
        <div className="space-y-2">
          <Label htmlFor="vehicle">Vozidlo *</Label>
          <Select value={vehicleId} onValueChange={onVehicleChange} disabled={disabled}>
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
        {showDriverSelect && (
          <div className="space-y-2">
            <Label htmlFor="driver">Vodič</Label>
            <Select value={driverId || ''} onValueChange={onDriverChange} disabled={disabled}>
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
        )}
      </div>

      {/* Dátum, krajina, mena/tachometer */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="date">Dátum *</Label>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            required
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Krajina tankovania *</Label>
          <Select value={country} onValueChange={(v) => onCountryChange(v as FuelCountry)} disabled={disabled}>
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
            <Select value={currency} onValueChange={(v) => onCurrencyChange(v as FuelCurrency)} disabled={disabled}>
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
              onChange={(e) => onOdometerChange(e.target.value)}
              disabled={disabled}
              min={0}
              placeholder="voliteľné"
            />
          </div>
        )}
      </div>

      {/* Tachometer ak je vybraná "other" krajina */}
      {country === 'other' && (
        <div className="space-y-2 max-w-[200px]">
          <Label htmlFor="odometer-other">Stav tachometra (km)</Label>
          <Input
            id="odometer-other"
            type="number"
            value={odometer}
            onChange={(e) => onOdometerChange(e.target.value)}
            disabled={disabled}
            min={0}
            placeholder="voliteľné"
          />
        </div>
      )}

      {/* Množstvo a ceny */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="liters">Množstvo (litre) *</Label>
          <Input
            id="liters"
            type="number"
            step="0.01"
            value={liters}
            onChange={(e) => onLitersChange(e.target.value)}
            required
            disabled={disabled}
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
            onChange={(e) => onPricePerLiterChange(e.target.value)}
            required
            disabled={disabled}
            min={0}
          />
        </div>
        <div className="space-y-2">
          <Label>Celková suma ({currencySymbol})</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
            {totalPrice ? `${totalPrice} ${currencySymbol}` : '-'}
          </div>
        </div>
        {showPriceWithoutVat && (
          <div className="space-y-2">
            <Label>Bez DPH (EUR)</Label>
            <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium">
              {priceWithoutVat ? `${priceWithoutVat} EUR` : '-'}
            </div>
          </div>
        )}
      </div>

      {/* Alert pre cudziu menu */}
      {isForeignCurrency && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Tankovanie v cudzej mene{showEurConfirmation ? ` (${currency})` : ''}</AlertTitle>
          <AlertDescription>
            {showEurConfirmation
              ? 'Môžete zadať EUR sumu hneď (ak máte bankový výpis), alebo nechať na doplnenie neskôr.'
              : 'Suma v EUR bude doplnená ekonomickým oddelením po príchode bankového výpisu (zvyčajne do 3 pracovných dní).'
            }
          </AlertDescription>
        </Alert>
      )}

      {/* EUR potvrdenie (len admin) */}
      {showEurConfirmation && isForeignCurrency && onConfirmEurNowChange && (
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirmEurNow"
              checked={confirmEurNow}
              onCheckedChange={(checked) => onConfirmEurNowChange(checked === true)}
              disabled={disabled}
            />
            <Label htmlFor="confirmEurNow" className="text-sm font-medium cursor-pointer">
              Zadať EUR sumu teraz
            </Label>
          </div>

          {confirmEurNow && onEurTotalPriceChange && onExchangeRateChange && (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="eurTotalPrice">Celková suma v EUR *</Label>
                <Input
                  id="eurTotalPrice"
                  type="number"
                  step="0.01"
                  value={eurTotalPrice}
                  onChange={(e) => onEurTotalPriceChange(e.target.value)}
                  required={confirmEurNow}
                  disabled={disabled}
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
                  onChange={(e) => onExchangeRateChange(e.target.value)}
                  disabled={disabled}
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

      {/* Plná nádrž */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="fullTank"
          checked={fullTank}
          onCheckedChange={(checked) => onFullTankChange(checked === true)}
          disabled={disabled}
        />
        <Label htmlFor="fullTank" className="text-sm font-normal cursor-pointer">
          Plná nádrž (tankovanie do plna)
        </Label>
      </div>

      {/* Typ paliva, čerpacia stanica, spôsob platby */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fuelType">Typ paliva *</Label>
          <Select value={fuelType} onValueChange={onFuelTypeChange} disabled={disabled}>
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
            onChange={(e) => onGasStationChange(e.target.value)}
            disabled={disabled}
            placeholder="Shell, OMV..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="paymentMethod">Spôsob platby *</Label>
          <Select value={paymentMethod} onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)} disabled={disabled}>
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

      {/* Poznámky */}
      <div className="space-y-2">
        <Label htmlFor="notes">Poznámky</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          rows={2}
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
              Uložiť
            </>
          )}
        </Button>
        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
          <Link href={cancelHref}>Zrušiť</Link>
        </Button>
      </div>
    </div>
  )
}

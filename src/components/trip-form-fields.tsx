'use client'

import Link from 'next/link'
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
import { TRIP_PURPOSES, TRIP_TYPES, TripType } from '@/types'
import RouteCombobox from '@/components/route-combobox'

interface TripFormFieldsProps {
  // Vozidlo
  vehicles: { id: string; name: string; license_plate: string }[]
  vehicleId: string
  onVehicleChange: (value: string) => void

  // Vodič (len admin formuláre)
  drivers?: { id: string; first_name: string; last_name: string }[]
  driverId?: string
  onDriverChange?: (value: string) => void

  // Typ jazdy (voliteľné — vodičovské new formuláre)
  tripType?: TripType
  onTripTypeChange?: (value: TripType) => void

  // Dátum a čas
  date: string
  onDateChange: (value: string) => void
  timeStart: string
  onTimeStartChange: (value: string) => void
  timeEnd: string
  onTimeEndChange: (value: string) => void

  // Trasa
  routeFrom: string
  onRouteFromChange: (value: string) => void
  routeTo: string
  onRouteToChange: (value: string) => void

  // Spiatočná jazda (voliteľné)
  roundTrip?: boolean
  onRoundTripChange?: (value: boolean) => void

  // Miesto návštevy (voliteľné)
  visitPlace?: string
  onVisitPlaceChange?: (value: string) => void

  // Účel cesty
  purpose: string
  onPurposeChange: (value: string) => void
  customPurpose: string
  onCustomPurposeChange: (value: string) => void

  // Tachometer
  odometerStart: string
  onOdometerStartChange: (value: string) => void
  odometerEnd: string
  onOdometerEndChange: (value: string) => void
  distance: number | null
  odometerWarning?: string | null

  // Poznámky
  notes: string
  onNotesChange: (value: string) => void

  // Stav formulára
  disabled: boolean
  isSubmitting: boolean
  submitLabel: string
  cancelHref: string
}

export function TripFormFields({
  vehicles,
  vehicleId,
  onVehicleChange,
  drivers,
  driverId,
  onDriverChange,
  tripType,
  onTripTypeChange,
  date,
  onDateChange,
  timeStart,
  onTimeStartChange,
  timeEnd,
  onTimeEndChange,
  routeFrom,
  onRouteFromChange,
  routeTo,
  onRouteToChange,
  roundTrip,
  onRoundTripChange,
  visitPlace,
  onVisitPlaceChange,
  purpose,
  onPurposeChange,
  customPurpose,
  onCustomPurposeChange,
  odometerStart,
  onOdometerStartChange,
  odometerEnd,
  onOdometerEndChange,
  distance,
  odometerWarning,
  notes,
  onNotesChange,
  disabled,
  isSubmitting,
  submitLabel,
  cancelHref,
}: TripFormFieldsProps) {
  const hasDriverSelect = drivers && onDriverChange && driverId !== undefined
  const hasTripType = tripType !== undefined && onTripTypeChange
  const hasRoundTrip = roundTrip !== undefined && onRoundTripChange
  const hasVisitPlace = visitPlace !== undefined && onVisitPlaceChange

  return (
    <>
      {/* Vozidlo (a vodič pre admin) */}
      {hasDriverSelect ? (
        <div className="grid gap-4 sm:grid-cols-2">
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
          <div className="space-y-2">
            <Label htmlFor="driver">Vodič *</Label>
            <Select value={driverId} onValueChange={onDriverChange} disabled={disabled}>
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
      ) : (
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
      )}

      {/* Typ jazdy */}
      {hasTripType && (
        <div className="space-y-2">
          <Label htmlFor="tripType">Typ jazdy *</Label>
          <Select value={tripType} onValueChange={(value) => onTripTypeChange(value as TripType)} disabled={disabled}>
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
      )}

      {/* Účel cesty */}
      <div className="space-y-2">
        <Label htmlFor="purpose">Účel cesty *</Label>
        <Select value={purpose} onValueChange={onPurposeChange} disabled={disabled}>
          <SelectTrigger id="purpose">
            <SelectValue placeholder="Vyberte účel cesty" />
          </SelectTrigger>
          <SelectContent>
            {TRIP_PURPOSES.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {purpose === 'Iné' && (
          <Input
            className="mt-2"
            placeholder="Zadajte vlastný účel cesty"
            value={customPurpose}
            onChange={(e) => onCustomPurposeChange(e.target.value)}
            disabled={disabled}
          />
        )}
      </div>

      {/* Dátum a čas */}
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
          <Label htmlFor="timeStart">Čas odchodu *</Label>
          <Input
            id="timeStart"
            type="time"
            value={timeStart}
            onChange={(e) => onTimeStartChange(e.target.value)}
            required
            disabled={disabled}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timeEnd">Čas príchodu *</Label>
          <Input
            id="timeEnd"
            type="time"
            value={timeEnd}
            onChange={(e) => onTimeEndChange(e.target.value)}
            required
            disabled={disabled}
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
            onChange={onRouteFromChange}
            required
            disabled={disabled}
            placeholder="Miesto odchodu"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="routeTo">Kam *</Label>
          <RouteCombobox
            id="routeTo"
            value={routeTo}
            onChange={onRouteToChange}
            required
            disabled={disabled}
            placeholder="Cieľové mesto"
          />
        </div>
      </div>

      {/* Spiatočná jazda */}
      {hasRoundTrip && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="roundTrip"
            checked={roundTrip}
            onCheckedChange={(checked) => onRoundTripChange(checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="roundTrip" className="font-normal cursor-pointer">
            Aj cesta späť (spiatočná jazda)
          </Label>
        </div>
      )}

      {/* Miesto návštevy */}
      {hasVisitPlace && (
        <div className="space-y-2">
          <Label htmlFor="visitPlace">Miesto návštevy *</Label>
          <Input
            id="visitPlace"
            value={visitPlace}
            onChange={(e) => onVisitPlaceChange(e.target.value)}
            required
            disabled={disabled}
            placeholder="Názov zákazníka, firmy alebo miesta"
          />
        </div>
      )}

      {/* Tachometer */}
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="odometerStart">Tachometer začiatok (km) *</Label>
            <Input
              id="odometerStart"
              type="number"
              value={odometerStart}
              onChange={(e) => onOdometerStartChange(e.target.value)}
              required
              disabled={disabled}
              min={0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="odometerEnd">Tachometer koniec (km) *</Label>
            <Input
              id="odometerEnd"
              type="number"
              value={odometerEnd}
              onChange={(e) => onOdometerEndChange(e.target.value)}
              required
              disabled={disabled}
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
          onChange={(e) => onNotesChange(e.target.value)}
          disabled={disabled}
          placeholder="Voliteľné poznámky k jazde"
          rows={3}
        />
      </div>

      {/* Tlačidlá */}
      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={disabled}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Ukladám...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {submitLabel}
            </>
          )}
        </Button>
        <Button type="button" variant="outline" asChild disabled={disabled}>
          <Link href={cancelHref}>Zrušiť</Link>
        </Button>
      </div>
    </>
  )
}

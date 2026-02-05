'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import DriverAutocomplete from '@/components/driver-autocomplete'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Plus, Trash2, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TRANSPORT_TYPES, BORDER_CROSSINGS_SK, COUNTRY_NAMES,
  type TransportType,
} from '@/types'

interface BorderCrossingInput {
  crossing_date: string
  crossing_name: string
  country_from: string
  country_to: string
  direction: 'outbound' | 'inbound'
}

interface StepDetailsProps {
  destinationCity: string
  setDestinationCity: (v: string) => void
  purpose: string
  setPurpose: (v: string) => void
  transportType: TransportType
  setTransportType: (v: TransportType) => void
  companion: string
  setCompanion: (v: string) => void
  departureDate: string
  setDepartureDate: (v: string) => void
  returnDate: string
  setReturnDate: (v: string) => void
  advanceAmount: number
  setAdvanceAmount: (v: number) => void
  notes: string
  setNotes: (v: string) => void
  tripType: 'tuzemska' | 'zahranicna'
  destinationCountry: string
  borderCrossings: BorderCrossingInput[]
  setBorderCrossings: (crossings: BorderCrossingInput[]) => void
}

const NEIGHBOR_COUNTRIES = Object.keys(BORDER_CROSSINGS_SK)

export default function StepDetails({
  destinationCity, setDestinationCity,
  purpose, setPurpose,
  transportType, setTransportType,
  companion, setCompanion,
  departureDate, setDepartureDate,
  returnDate, setReturnDate,
  advanceAmount, setAdvanceAmount,
  notes, setNotes,
  tripType, destinationCountry,
  borderCrossings, setBorderCrossings,
}: StepDetailsProps) {

  // --- Border crossings logic ---
  const addCrossing = () => {
    const newCrossing: BorderCrossingInput = {
      crossing_date: '',
      crossing_name: '',
      country_from: borderCrossings.length === 0 ? 'SK' : '',
      country_to: borderCrossings.length === 0 ? (destinationCountry || '') : '',
      direction: borderCrossings.length % 2 === 0 ? 'outbound' : 'inbound',
    }
    setBorderCrossings([...borderCrossings, newCrossing])
  }

  const updateCrossing = (index: number, field: keyof BorderCrossingInput, value: string) => {
    const updated = [...borderCrossings]
    updated[index] = { ...updated[index], [field]: value }
    setBorderCrossings(updated)
  }

  const removeCrossing = (index: number) => {
    setBorderCrossings(borderCrossings.filter((_, i) => i !== index))
  }

  const getCrossingsForCountries = (from: string, to: string): string[] => {
    const key = from === 'SK' ? to : from
    return BORDER_CROSSINGS_SK[key] || []
  }

  return (
    <div className="space-y-6">
      {/* Auto-vyplnené údaje */}
      <div>
        <h3 className="font-medium mb-1">Údaje služobnej cesty</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Údaje boli predvyplnené z vybraných jázd. Môžete ich upraviť.
        </p>
      </div>

      <div>
        <Label htmlFor="city">Cieľové mesto *</Label>
        <Input
          id="city"
          value={destinationCity}
          onChange={(e) => setDestinationCity(e.target.value)}
          placeholder="napr. Bratislava, Viedeň"
        />
      </div>

      <div>
        <Label htmlFor="purpose">Účel cesty *</Label>
        <Input
          id="purpose"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="napr. Rokovanie s dodávateľom"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="departure">Dátum a čas odchodu *</Label>
          <Input
            id="departure"
            type="datetime-local"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="return">Dátum a čas návratu *</Label>
          <Input
            id="return"
            type="datetime-local"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="transport">Dopravný prostriedok</Label>
        <Select value={transportType} onValueChange={(v) => setTransportType(v as TransportType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(TRANSPORT_TYPES).map(([key, label]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Spolucestujúci</Label>
        <DriverAutocomplete
          value={companion}
          onChange={setCompanion}
        />
      </div>

      <div>
        <Label htmlFor="advance">Preddavok (€)</Label>
        <Input
          id="advance"
          type="number"
          min={0}
          step={0.01}
          value={advanceAmount || ''}
          onChange={(e) => setAdvanceAmount(parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
      </div>

      <div>
        <Label htmlFor="notes">Poznámky</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Voliteľné poznámky..."
          rows={2}
        />
      </div>

      {/* Prechody hraníc - len pre zahraničnú cestu */}
      {tripType === 'zahranicna' && (
        <div className="space-y-4 border-t pt-6">
          <div>
            <h3 className="font-medium">Prechody hraníc</h3>
            <p className="text-sm text-muted-foreground">
              Zadajte prechody hraníc v poradí (výjazd aj príjazd).
            </p>
          </div>

          {borderCrossings.length === 0 && (
            <Alert variant="destructive">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Pre zahraničnú cestu je povinné zadať aspoň jeden prechod hraníc.
              </AlertDescription>
            </Alert>
          )}

          {borderCrossings.map((crossing, index) => (
            <div key={index} className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  Prechod #{index + 1} ({crossing.direction === 'outbound' ? 'Výjazd' : 'Príjazd'})
                </span>
                <Button variant="ghost" size="icon" onClick={() => removeCrossing(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Dátum a čas</Label>
                  <Input
                    type="datetime-local"
                    value={crossing.crossing_date}
                    onChange={(e) => updateCrossing(index, 'crossing_date', e.target.value)}
                  />
                </div>

                <div>
                  <Label>Smer</Label>
                  <Select
                    value={crossing.direction}
                    onValueChange={(v) => updateCrossing(index, 'direction', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Výjazd</SelectItem>
                      <SelectItem value="inbound">Príjazd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Z krajiny</Label>
                  <Select
                    value={crossing.country_from}
                    onValueChange={(v) => updateCrossing(index, 'country_from', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SK">Slovensko</SelectItem>
                      {NEIGHBOR_COUNTRIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {COUNTRY_NAMES[code] || code}
                        </SelectItem>
                      ))}
                      {destinationCountry && !NEIGHBOR_COUNTRIES.includes(destinationCountry) && (
                        <SelectItem value={destinationCountry}>
                          {COUNTRY_NAMES[destinationCountry] || destinationCountry}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Do krajiny</Label>
                  <Select
                    value={crossing.country_to}
                    onValueChange={(v) => updateCrossing(index, 'country_to', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SK">Slovensko</SelectItem>
                      {NEIGHBOR_COUNTRIES.map((code) => (
                        <SelectItem key={code} value={code}>
                          {COUNTRY_NAMES[code] || code}
                        </SelectItem>
                      ))}
                      {destinationCountry && !NEIGHBOR_COUNTRIES.includes(destinationCountry) && (
                        <SelectItem value={destinationCountry}>
                          {COUNTRY_NAMES[destinationCountry] || destinationCountry}
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>Hraničný prechod</Label>
                {getCrossingsForCountries(crossing.country_from, crossing.country_to).length > 0 ? (
                  <Select
                    value={crossing.crossing_name}
                    onValueChange={(v) => updateCrossing(index, 'crossing_name', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte prechod" />
                    </SelectTrigger>
                    <SelectContent>
                      {getCrossingsForCountries(crossing.country_from, crossing.country_to).map((name) => (
                        <SelectItem key={name} value={name}>{name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={crossing.crossing_name}
                    onChange={(e) => updateCrossing(index, 'crossing_name', e.target.value)}
                    placeholder="Zadajte názov prechodu"
                  />
                )}
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={addCrossing} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Pridať prechod
          </Button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Vehicle, FUEL_TYPES } from '@/types'

interface EditVehicleFormProps {
  vehicle: Vehicle
}

export function EditVehicleForm({ vehicle }: EditVehicleFormProps) {
  const [name, setName] = useState(vehicle.name)
  const [licensePlate, setLicensePlate] = useState(vehicle.license_plate)
  const [vin, setVin] = useState(vehicle.vin)
  const [brand, setBrand] = useState(vehicle.brand || '')
  const [model, setModel] = useState(vehicle.model || '')
  const [year, setYear] = useState(vehicle.year?.toString() || '')
  const [fuelType, setFuelType] = useState<string>(vehicle.fuel_type)
  const [initialOdometer, setInitialOdometer] = useState(vehicle.initial_odometer.toString())
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from('vehicles')
      .update({
        name: name.trim(),
        license_plate: licensePlate.trim().toUpperCase(),
        vin: vin.trim().toUpperCase(),
        brand: brand.trim() || null,
        model: model.trim() || null,
        year: year ? parseInt(year) : null,
        fuel_type: fuelType,
        initial_odometer: initialOdometer ? parseInt(initialOdometer) : 0,
      })
      .eq('id', vehicle.id)

    if (error) {
      if (error.code === '23505') {
        toast.error('Vozidlo s týmto EČV alebo VIN už existuje')
      } else {
        toast.error('Nepodarilo sa uložiť zmeny')
      }
      setIsSubmitting(false)
      return
    }

    toast.success('Zmeny boli uložené')
    router.refresh()
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Názov vozidla *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="licensePlate">EČV (evidenčné číslo) *</Label>
          <Input
            id="licensePlate"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
            required
            disabled={isSubmitting}
            className="uppercase"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="vin">VIN *</Label>
          <Input
            id="vin"
            value={vin}
            onChange={(e) => setVin(e.target.value)}
            required
            disabled={isSubmitting}
            maxLength={17}
            className="uppercase"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="brand">Značka</Label>
          <Input
            id="brand"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="year">Rok výroby</Label>
          <Input
            id="year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            disabled={isSubmitting}
            min={1900}
            max={new Date().getFullYear() + 1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fuelType">Typ paliva *</Label>
          <Select value={fuelType} onValueChange={setFuelType} disabled={isSubmitting}>
            <SelectTrigger id="fuelType">
              <SelectValue />
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
          <Label htmlFor="initialOdometer">Počiatočný stav km</Label>
          <Input
            id="initialOdometer"
            type="number"
            value={initialOdometer}
            onChange={(e) => setInitialOdometer(e.target.value)}
            disabled={isSubmitting}
            min={0}
          />
        </div>
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
              Uložiť zmeny
            </>
          )}
        </Button>
        <Button type="button" variant="outline" asChild disabled={isSubmitting}>
          <Link href="/admin/vozidla">Späť na zoznam</Link>
        </Button>
      </div>
    </form>
  )
}

'use client'

import { useState, useEffect } from 'react'
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
import { Vehicle, Driver, FUEL_TYPES } from '@/types'
import { logAudit } from '@/lib/audit-logger'

interface EditVehicleFormProps {
  vehicle: Vehicle
  drivers: Driver[]
}

export function EditVehicleForm({ vehicle, drivers }: EditVehicleFormProps) {
  const [name, setName] = useState(vehicle.name)
  const [licensePlate, setLicensePlate] = useState(vehicle.license_plate)
  const [vin, setVin] = useState(vehicle.vin)
  const [brand, setBrand] = useState(vehicle.brand || '')
  const [model, setModel] = useState(vehicle.model || '')
  const [year, setYear] = useState(vehicle.year?.toString() || '')
  const [fuelType, setFuelType] = useState<string>(vehicle.fuel_type)
  const [initialOdometer, setInitialOdometer] = useState(vehicle.initial_odometer.toString())
  const [responsibleDriverId, setResponsibleDriverId] = useState(vehicle.responsible_driver_id || 'none')
  const [ratedConsumption, setRatedConsumption] = useState(vehicle.rated_consumption?.toString() || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const oldData = {
      name: vehicle.name,
      license_plate: vehicle.license_plate,
      vin: vehicle.vin,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      fuel_type: vehicle.fuel_type,
      initial_odometer: vehicle.initial_odometer,
      responsible_driver_id: vehicle.responsible_driver_id,
      rated_consumption: vehicle.rated_consumption,
    }

    const newData = {
      name: name.trim(),
      license_plate: licensePlate.trim().toUpperCase(),
      vin: vin.trim().toUpperCase(),
      brand: brand.trim() || null,
      model: model.trim() || null,
      year: year ? parseInt(year) : null,
      fuel_type: fuelType,
      initial_odometer: initialOdometer ? parseInt(initialOdometer) : 0,
      responsible_driver_id: responsibleDriverId === 'none' ? null : responsibleDriverId,
      rated_consumption: ratedConsumption ? parseFloat(ratedConsumption) : null,
    }

    const { error } = await supabase
      .from('vehicles')
      .update(newData)
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

    const { data: { user } } = await supabase.auth.getUser()
    await logAudit({
      tableName: 'vehicles',
      recordId: vehicle.id,
      operation: 'UPDATE',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      oldData,
      newData,
    })

    toast.success('Zmeny boli uložené')
    router.refresh()
    setIsSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
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

      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
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
        <div className="space-y-2">
          <Label htmlFor="ratedConsumption">Normovaná spotreba (l/100km)</Label>
          <Input
            id="ratedConsumption"
            type="number"
            step="0.1"
            value={ratedConsumption}
            onChange={(e) => setRatedConsumption(e.target.value)}
            disabled={isSubmitting}
            placeholder="napr. 6.5"
            min={0}
            max={50}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="responsibleDriver">Zodpovedný vodič</Label>
        <Select value={responsibleDriverId} onValueChange={setResponsibleDriverId} disabled={isSubmitting}>
          <SelectTrigger id="responsibleDriver">
            <SelectValue placeholder="-- Nevybraný --" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">-- Nevybraný --</SelectItem>
            {drivers.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.first_name} {d.last_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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

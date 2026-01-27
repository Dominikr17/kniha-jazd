'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { FUEL_TYPES, Driver } from '@/types'

export default function NewVehiclePage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [name, setName] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [vin, setVin] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [fuelType, setFuelType] = useState('nafta')
  const [initialOdometer, setInitialOdometer] = useState('')
  const [responsibleDriverId, setResponsibleDriverId] = useState('none')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchDrivers = async () => {
      const { data } = await supabase
        .from('drivers')
        .select('*')
        .order('last_name')
      setDrivers(data || [])
    }
    fetchDrivers()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('vehicles').insert({
      name: name.trim(),
      license_plate: licensePlate.trim().toUpperCase(),
      vin: vin.trim().toUpperCase(),
      brand: brand.trim() || null,
      model: model.trim() || null,
      year: year ? parseInt(year) : null,
      fuel_type: fuelType,
      initial_odometer: initialOdometer ? parseInt(initialOdometer) : 0,
      responsible_driver_id: responsibleDriverId === 'none' ? null : responsibleDriverId,
    })

    if (error) {
      if (error.code === '23505') {
        toast.error('Vozidlo s týmto EČV alebo VIN už existuje')
      } else {
        toast.error('Nepodarilo sa pridať vozidlo')
      }
      setIsSubmitting(false)
      return
    }

    toast.success('Vozidlo bolo úspešne pridané')
    router.push('/admin/vozidla')
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/vozidla">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nové vozidlo</h1>
          <p className="text-muted-foreground">Pridanie nového vozidla do vozového parku</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Údaje vozidla</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Názov vozidla *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
                placeholder="napr. Dodávka 1"
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
                  placeholder="ZA-123AB"
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
                  placeholder="17-miestny VIN kód"
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
                  placeholder="napr. Škoda"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="napr. Octavia"
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
                  placeholder="2024"
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
                  placeholder="0"
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
                    Uložiť
                  </>
                )}
              </Button>
              <Button type="button" variant="outline" asChild disabled={isSubmitting}>
                <Link href="/admin/vozidla">Zrušiť</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

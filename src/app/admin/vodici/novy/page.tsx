'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Car } from 'lucide-react'
import { toast } from 'sonner'
import { logAudit } from '@/lib/audit-logger'
import { Vehicle } from '@/types'
import { VehicleAssignment } from '../vehicle-assignment'

export default function NewDriverPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<string[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchVehicles = async () => {
      const { data } = await supabase
        .from('vehicles')
        .select('id, name, license_plate')
        .order('name')
      setVehicles((data as Vehicle[]) || [])
      setIsLoading(false)
    }
    fetchVehicles()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const driverData = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
    }

    const { data, error } = await supabase.from('drivers').insert(driverData).select().single()

    if (error) {
      toast.error('Nepodarilo sa pridať vodiča')
      setIsSubmitting(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    // Uložiť priradenia vozidiel
    if (selectedVehicleIds.length > 0) {
      const vehicleAssignments = selectedVehicleIds.map((vehicleId) => ({
        driver_id: data.id,
        vehicle_id: vehicleId,
        created_by: user?.id || null,
      }))

      const { error: vehicleError } = await supabase
        .from('driver_vehicles')
        .insert(vehicleAssignments)

      if (vehicleError) {
        toast.warning('Vodič bol pridaný, ale nepodarilo sa priradiť vozidlá')
        console.error(vehicleError)
      }
    }

    await logAudit({
      tableName: 'drivers',
      recordId: data.id,
      operation: 'INSERT',
      userType: 'admin',
      userId: user?.id,
      userName: user?.email,
      newData: { ...driverData, assigned_vehicles: selectedVehicleIds },
    })

    toast.success('Vodič bol úspešne pridaný')
    router.push('/admin/vodici')
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
          <Link href="/admin/vodici">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nový vodič</h1>
          <p className="text-muted-foreground">Pridanie nového vodiča do systému</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Údaje vodiča</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Meno *</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Ján"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Priezvisko *</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  disabled={isSubmitting}
                  placeholder="Novák"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                placeholder="jan.novak@zvl.sk"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefón</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                placeholder="+421 900 000 000"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Priradené vozidlá
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VehicleAssignment
              vehicles={vehicles}
              selectedVehicleIds={selectedVehicleIds}
              onChange={setSelectedVehicleIds}
              disabled={isSubmitting}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3 max-w-2xl">
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
            <Link href="/admin/vodici">Zrušiť</Link>
          </Button>
        </div>
      </form>
    </div>
  )
}

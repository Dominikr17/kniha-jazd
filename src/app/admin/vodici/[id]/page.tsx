import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Car } from 'lucide-react'
import { EditDriverForm } from './edit-form'
import { getVehicleIdsForDriver } from '@/lib/driver-vehicles'

interface EditDriverPageProps {
  params: Promise<{ id: string }>
}

export default async function EditDriverPage({ params }: EditDriverPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: driver, error }, { data: vehicles }, assignedVehicleIds] = await Promise.all([
    supabase.from('drivers').select('*').eq('id', id).single(),
    supabase.from('vehicles').select('id, name, license_plate').order('name'),
    getVehicleIdsForDriver(supabase, id),
  ])

  if (error || !driver) {
    notFound()
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
          <h1 className="text-2xl font-bold">Upraviť vodiča</h1>
          <p className="text-muted-foreground">
            {driver.first_name} {driver.last_name}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Údaje vodiča</CardTitle>
        </CardHeader>
        <CardContent>
          <EditDriverForm
            driver={driver}
            vehicles={vehicles || []}
            initialVehicleIds={assignedVehicleIds}
          />
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
          <p className="text-sm text-muted-foreground mb-4">
            Vozidlá, ktoré môže vodič používať a evidovať jazdy a tankovania.
          </p>
          <EditDriverForm
            driver={driver}
            vehicles={vehicles || []}
            initialVehicleIds={assignedVehicleIds}
            vehiclesOnly
          />
        </CardContent>
      </Card>
    </div>
  )
}

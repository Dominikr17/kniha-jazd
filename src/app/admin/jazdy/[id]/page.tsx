import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'
import { EditTripForm } from './edit-trip-form'

interface EditTripPageProps {
  params: Promise<{ id: string }>
}

export default async function EditTripPage({ params }: EditTripPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: trip, error },
    { data: vehicles },
    { data: drivers },
  ] = await Promise.all([
    supabase.from('trips').select('*').eq('id', id).single(),
    supabase.from('vehicles').select('id, name, license_plate').order('name'),
    supabase.from('drivers').select('id, first_name, last_name').order('last_name'),
  ])

  if (error || !trip) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/jazdy">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Upraviť jazdu č. {trip.trip_number}</h1>
          <p className="text-muted-foreground">Úprava záznamu v knihe jázd</p>
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Údaje o jazde</CardTitle>
        </CardHeader>
        <CardContent>
          <EditTripForm
            trip={trip}
            vehicles={vehicles || []}
            drivers={drivers || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}

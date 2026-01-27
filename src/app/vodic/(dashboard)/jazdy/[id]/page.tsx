import { createClient } from '@/lib/supabase/server'
import { getDriverId, getDriverName } from '@/lib/driver-session'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DriverEditTripForm } from './edit-trip-form'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function DriverEditTripPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const driverId = await getDriverId()
  const driverName = await getDriverName()

  const [{ data: trip }, { data: vehicles }] = await Promise.all([
    supabase
      .from('trips')
      .select('*')
      .eq('id', id)
      .single(),
    supabase
      .from('vehicles')
      .select('id, name, license_plate')
      .order('name'),
  ])

  if (!trip) {
    notFound()
  }

  // Vodič môže upravovať len svoje jazdy
  if (trip.driver_id !== driverId) {
    redirect('/vodic/jazdy')
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vodic/jazdy">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Upraviť jazdu</h1>
          <p className="text-muted-foreground">
            Jazda č. {trip.trip_number} - {driverName}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Údaje o jazde</CardTitle>
        </CardHeader>
        <CardContent>
          <DriverEditTripForm
            trip={trip}
            vehicles={vehicles || []}
            driverId={driverId!}
            driverName={driverName || ''}
          />
        </CardContent>
      </Card>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { getDriverId, getDriverName } from '@/lib/driver-session'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { DriverEditTripForm } from './edit-trip-form'
import { DRIVER_EDIT_TIME_LIMIT_MINUTES } from '@/types'

// Helper funkcia - kontrola či vodič môže upraviť jazdu
function canEditTrip(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
  return diffMinutes <= DRIVER_EDIT_TIME_LIMIT_MINUTES
}

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

  const canEdit = canEditTrip(trip.created_at)

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

      {!canEdit && (
        <Alert variant="destructive" className="max-w-2xl">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Čas na úpravu vypršal</AlertTitle>
          <AlertDescription>
            Jazdu je možné upraviť iba do {DRIVER_EDIT_TIME_LIMIT_MINUTES} minút od vytvorenia.
            Pre úpravu kontaktujte administrátora.
          </AlertDescription>
        </Alert>
      )}

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
            canEdit={canEdit}
          />
        </CardContent>
      </Card>
    </div>
  )
}

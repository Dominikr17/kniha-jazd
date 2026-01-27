import { createClient } from '@/lib/supabase/server'
import { getDriverId, getDriverName } from '@/lib/driver-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { DriverNewTripForm } from './new-trip-form'

export default async function DriverNewTripPage() {
  const supabase = await createClient()
  const driverId = await getDriverId()
  const driverName = await getDriverName()

  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, license_plate')
    .order('name')

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/vodic/jazdy">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Nová jazda</h1>
          <p className="text-muted-foreground">
            Vodič: {driverName}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Údaje o jazde</CardTitle>
        </CardHeader>
        <CardContent>
          <DriverNewTripForm
            vehicles={vehicles || []}
            driverId={driverId!}
            driverName={driverName || ''}
          />
        </CardContent>
      </Card>
    </div>
  )
}

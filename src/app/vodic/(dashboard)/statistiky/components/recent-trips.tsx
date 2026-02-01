import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { ArrowRight } from 'lucide-react'
import { RecentTrip } from '@/lib/driver-stats'

interface RecentTripsProps {
  trips: RecentTrip[]
}

export function RecentTrips({ trips }: RecentTripsProps) {
  if (trips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Posledné jazdy</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Zatiaľ nemáte žiadne jazdy
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Posledné jazdy</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/vodic/jazdy">
            Všetky jazdy
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trips.map((trip) => (
            <div
              key={trip.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border"
            >
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {trip.routeFrom} → {trip.routeTo}
                </div>
                <div className="text-xs text-muted-foreground">
                  {trip.vehicleName}
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  {format(new Date(trip.date), 'd. M. yyyy', { locale: sk })}
                </span>
                <span className="font-medium">{trip.distance} km</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

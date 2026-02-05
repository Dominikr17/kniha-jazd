import { createClient } from '@/lib/supabase/server'
import { getDriverId } from '@/lib/driver-session'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Route, Pencil } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { DRIVER_EDIT_TIME_LIMIT_MINUTES, TRIP_TYPES, TripType } from '@/types'

// Helper funkcia - kontrola či vodič môže upraviť jazdu (do 15 minút od vytvorenia)
function canEditTrip(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
  return diffMinutes <= DRIVER_EDIT_TIME_LIMIT_MINUTES
}

export default async function DriverTripsPage() {
  const supabase = await createClient()
  const driverId = await getDriverId()

  const { data: trips } = await supabase
    .from('trips')
    .select('*, vehicle:vehicles(name, license_plate)')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(50)

  // Štatistiky za aktuálny mesiac
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthTrips = trips?.filter((t) => t.date.startsWith(currentMonth)) || []
  const totalDistance = monthTrips.reduce((sum, t) => sum + (t.distance || 0), 0)

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Moje jazdy</h1>
          <p className="text-muted-foreground">Prehľad a evidencia jázd</p>
        </div>
        <Button asChild>
          <Link href="/vodic/jazdy/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nová jazda
          </Link>
        </Button>
      </div>

      {/* Štatistiky */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jazdy tento mesiac
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthTrips.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Najazdené km tento mesiac
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDistance.toLocaleString('sk')} km</div>
          </CardContent>
        </Card>
      </div>

      {/* Zoznam jázd */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Posledné jazdy
          </CardTitle>
        </CardHeader>
        <CardContent>
          {trips && trips.length > 0 ? (
            <>
              {/* Desktop tabuľka */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Dátum</TableHead>
                      <TableHead>Čas</TableHead>
                      <TableHead>Vozidlo</TableHead>
                      <TableHead>Trasa</TableHead>
                      <TableHead>Účel</TableHead>
                      <TableHead>Typ</TableHead>
                      <TableHead className="text-right">Km</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>
                          {format(parseISO(trip.date), 'd.M.yyyy', { locale: sk })}
                        </TableCell>
                        <TableCell className="text-sm">
                          {trip.time_start?.slice(0, 5)}
                          {trip.time_end && ` - ${trip.time_end.slice(0, 5)}`}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{trip.vehicle?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {trip.vehicle?.license_plate}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>{trip.route_from} → {trip.route_to}{trip.round_trip && ` → ${trip.route_from}`}</div>
                          {trip.visit_place && (
                            <div className="text-xs text-muted-foreground">{trip.visit_place}</div>
                          )}
                        </TableCell>
                        <TableCell>{trip.purpose}</TableCell>
                        <TableCell>
                          <Badge variant={trip.trip_type === 'sukromna' ? 'outline' : 'secondary'}>
                            {TRIP_TYPES[trip.trip_type as TripType]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {trip.distance ? `${trip.distance} km` : '-'}
                        </TableCell>
                        <TableCell>
                          {canEditTrip(trip.created_at) && (
                            <Button variant="ghost" size="icon" asChild>
                              <Link href={`/vodic/jazdy/${trip.id}`}>
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile karty */}
              <div className="md:hidden space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">
                          {trip.route_from} → {trip.route_to}{trip.round_trip && ` → ${trip.route_from}`}
                        </div>
                        {trip.visit_place && (
                          <div className="text-sm text-muted-foreground">{trip.visit_place}</div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {format(parseISO(trip.date), 'd.M.yyyy', { locale: sk })}
                          {' '}
                          {trip.time_start?.slice(0, 5)}
                          {trip.time_end && ` - ${trip.time_end.slice(0, 5)}`}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {trip.distance && (
                          <Badge variant="secondary">{trip.distance} km</Badge>
                        )}
                        <Badge variant={trip.trip_type === 'sukromna' ? 'outline' : 'secondary'}>
                          {TRIP_TYPES[trip.trip_type as TripType]}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {trip.vehicle?.name} ({trip.vehicle?.license_plate})
                    </div>
                    <div className="text-sm">{trip.purpose}</div>
                    {canEditTrip(trip.created_at) && (
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" asChild className="flex-1">
                          <Link href={`/vodic/jazdy/${trip.id}`}>
                            <Pencil className="h-4 w-4 mr-1" />
                            Upraviť
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Zatiaľ nemáte žiadne zaznamenané jazdy.</p>
              <Button asChild className="mt-4">
                <Link href="/vodic/jazdy/nova">
                  <Plus className="mr-2 h-4 w-4" />
                  Pridať prvú jazdu
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

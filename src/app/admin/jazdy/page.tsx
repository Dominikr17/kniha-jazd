import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Route, Pencil } from 'lucide-react'
import { Trip, TRIP_TYPES } from '@/types'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { DeleteButton } from '@/components/delete-button'
import { ExportButtons } from './export-buttons'
import { TripsFilter } from './trips-filter'

interface TripsPageProps {
  searchParams: Promise<{ vehicle?: string; driver?: string; tripType?: string; from?: string; to?: string }>
}

export default async function TripsPage({ searchParams }: TripsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Načítanie vodičov a vozidiel pre filter
  const [{ data: vehicles }, { data: drivers }] = await Promise.all([
    supabase.from('vehicles').select('id, name, license_plate').order('name'),
    supabase.from('drivers').select('id, first_name, last_name').order('last_name'),
  ])

  // Zostavenie query pre jazdy
  let query = supabase
    .from('trips')
    .select(`
      *,
      vehicle:vehicles(id, name, license_plate),
      driver:drivers(id, first_name, last_name)
    `)
    .order('date', { ascending: false })
    .order('time_start', { ascending: false })

  // Aplikovanie filtrov
  if (params.vehicle) {
    query = query.eq('vehicle_id', params.vehicle)
  }
  if (params.driver) {
    query = query.eq('driver_id', params.driver)
  }
  if (params.tripType) {
    query = query.eq('trip_type', params.tripType)
  }
  if (params.from) {
    query = query.gte('date', params.from)
  }
  if (params.to) {
    query = query.lte('date', params.to)
  }

  const { data: trips, error } = await query

  if (error) {
    console.error('Error loading trips:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kniha jázd</h1>
          <p className="text-muted-foreground">Evidencia jázd vozového parku</p>
        </div>
        <div className="flex gap-2">
          <ExportButtons trips={trips || []} />
          <Button asChild>
            <Link href="/admin/jazdy/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nová jazda
            </Link>
          </Button>
        </div>
      </div>

      <TripsFilter
        vehicles={vehicles || []}
        drivers={drivers || []}
        currentFilters={params}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Zoznam jázd
            {trips && trips.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {trips.length} záznamov
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!trips || trips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Route className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Zatiaľ neboli zaznamenané žiadne jazdy.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/jazdy/nova">Zaznamenať prvú jazdu</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Č.</TableHead>
                    <TableHead>Dátum</TableHead>
                    <TableHead className="hidden md:table-cell">Vozidlo</TableHead>
                    <TableHead className="hidden lg:table-cell">Vodič</TableHead>
                    <TableHead className="hidden sm:table-cell">Typ</TableHead>
                    <TableHead>Trasa</TableHead>
                    <TableHead className="text-right">km</TableHead>
                    <TableHead className="w-[80px]">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(trips as Trip[]).map((trip) => (
                    <TableRow key={trip.id}>
                      <TableCell className="font-medium">
                        {trip.trip_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          {format(parseISO(trip.date), 'd.M.yyyy', { locale: sk })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {trip.time_start ? trip.time_start.slice(0, 5) : '–'}
                          {trip.time_end && ` - ${trip.time_end.slice(0, 5)}`}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>{trip.vehicle?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {trip.vehicle?.license_plate}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {trip.driver?.first_name} {trip.driver?.last_name}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant={trip.trip_type === 'sukromna' ? 'secondary' : 'default'}
                          className={trip.trip_type === 'sluzobna' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''}
                        >
                          {TRIP_TYPES[trip.trip_type] || 'Služobná'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {trip.route_from} → {trip.route_to}{trip.round_trip && ` → ${trip.route_from}`}
                        </div>
                        {trip.visit_place && (
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {trip.visit_place}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {trip.purpose}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {trip.distance ?? '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/jazdy/${trip.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteButton
                          tableName="trips"
                          recordId={trip.id}
                          itemLabel={`jazdu č. ${trip.trip_number}`}
                          dialogTitle="Vymazať jazdu"
                          dialogDescription={`Naozaj chcete vymazať jazdu č. ${trip.trip_number}? Táto akcia sa nedá vrátiť späť.`}
                          successMessage="Jazda bola vymazaná"
                          errorMessage="Nepodarilo sa vymazať jazdu"
                        />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

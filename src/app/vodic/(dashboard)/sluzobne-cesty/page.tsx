import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getDriverId, getDriverName } from '@/lib/driver-session'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Briefcase, Eye } from 'lucide-react'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { BUSINESS_TRIP_STATUS, type BusinessTripStatus } from '@/types'
import { DeleteButton } from '@/components/delete-button'

const STATUS_COLORS: Record<BusinessTripStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-purple-100 text-purple-800',
}

export default async function DriverBusinessTripsPage() {
  const driverId = await getDriverId()
  const driverName = await getDriverName()
  if (!driverId) redirect('/')

  const supabase = await createClient()

  const { data: trips } = await supabase
    .from('business_trips')
    .select('*')
    .eq('driver_id', driverId)
    .order('created_at', { ascending: false })
    .limit(50)

  const businessTrips = trips || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#004B87]">Služobné cesty</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Celkom {businessTrips.length} záznamov
          </p>
        </div>
        <Button asChild>
          <Link href="/vodic/sluzobne-cesty/nova">
            <Plus className="h-4 w-4 mr-2" />
            Nová služobná cesta
          </Link>
        </Button>
      </div>

      {businessTrips.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Žiadne služobné cesty</h3>
          <p className="text-muted-foreground mt-1">
            Začnite vytvorením novej služobnej cesty.
          </p>
          <Button asChild className="mt-4">
            <Link href="/vodic/sluzobne-cesty/nova">
              <Plus className="h-4 w-4 mr-2" />
              Nová služobná cesta
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop tabuľka */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Cieľ</TableHead>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Suma</TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessTrips.map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono text-sm">
                      <Link href={`/vodic/sluzobne-cesty/${trip.id}`} className="hover:underline text-[#004B87]">
                        {trip.trip_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {trip.trip_type === 'zahranicna' ? 'Zahraničná' : 'Tuzemská'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>{trip.destination_city}</div>
                      {trip.visit_place && (
                        <div className="text-xs text-muted-foreground">{trip.visit_place}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(trip.departure_date), 'd.M.yyyy', { locale: sk })}
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[trip.status as BusinessTripStatus]}>
                        {BUSINESS_TRIP_STATUS[trip.status as BusinessTripStatus]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {Number(trip.total_amount).toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/vodic/sluzobne-cesty/${trip.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        {trip.status === 'draft' && (
                          <DeleteButton
                            tableName="business_trips"
                            recordId={trip.id}
                            itemLabel={trip.trip_number}
                            dialogTitle="Vymazať služobnú cestu?"
                            dialogDescription={`Naozaj chcete vymazať služobnú cestu ${trip.trip_number}?`}
                            successMessage="Služobná cesta bola vymazaná"
                            errorMessage="Chyba pri mazaní služobnej cesty"
                            userType="driver"
                            userId={driverId}
                            userName={driverName || undefined}
                          />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile karty */}
          <div className="md:hidden space-y-3">
            {businessTrips.map((trip) => (
              <Link
                key={trip.id}
                href={`/vodic/sluzobne-cesty/${trip.id}`}
                className="block rounded-lg border p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-muted-foreground">{trip.trip_number}</span>
                  <Badge className={STATUS_COLORS[trip.status as BusinessTripStatus]}>
                    {BUSINESS_TRIP_STATUS[trip.status as BusinessTripStatus]}
                  </Badge>
                </div>
                <div className="font-medium">{trip.destination_city}</div>
                {trip.visit_place && (
                  <div className="text-sm text-muted-foreground">{trip.visit_place}</div>
                )}
                <div className="text-sm text-muted-foreground mt-1">
                  {format(new Date(trip.departure_date), 'd.M.yyyy', { locale: sk })}
                  {' – '}
                  {format(new Date(trip.return_date), 'd.M.yyyy', { locale: sk })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline">
                    {trip.trip_type === 'zahranicna' ? 'Zahraničná' : 'Tuzemská'}
                  </Badge>
                  <span className="font-medium">{Number(trip.total_amount).toFixed(2)} €</span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

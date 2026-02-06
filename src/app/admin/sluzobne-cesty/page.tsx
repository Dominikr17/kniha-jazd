import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Eye, Briefcase } from 'lucide-react'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { BUSINESS_TRIP_STATUS, type BusinessTripStatus } from '@/types'

const STATUS_COLORS: Record<BusinessTripStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  submitted: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  paid: 'bg-purple-100 text-purple-800',
}

interface SearchParams {
  status?: string
  driver?: string
}

export default async function AdminBusinessTripsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Načítať vodičov pre filter
  const { data: drivers } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .order('last_name')

  // Načítať služobné cesty s filtrami
  let query = supabase
    .from('business_trips')
    .select('*, driver:drivers(first_name, last_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  if (params.status) {
    query = query.eq('status', params.status)
  }
  if (params.driver) {
    query = query.eq('driver_id', params.driver)
  }

  const { data: trips } = await query
  const businessTrips = trips || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Služobné cesty</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Celkom {businessTrips.length} záznamov
        </p>
      </div>

      {/* Filtre */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/sluzobne-cesty">
          <Badge variant={!params.status ? 'default' : 'outline'} className="cursor-pointer">
            Všetky
          </Badge>
        </Link>
        {Object.entries(BUSINESS_TRIP_STATUS).map(([key, label]) => (
          <Link key={key} href={`/admin/sluzobne-cesty?status=${key}${params.driver ? `&driver=${params.driver}` : ''}`}>
            <Badge
              variant={params.status === key ? 'default' : 'outline'}
              className={`cursor-pointer ${params.status === key ? STATUS_COLORS[key as BusinessTripStatus] : ''}`}
            >
              {label}
            </Badge>
          </Link>
        ))}
      </div>

      {/* Filter vodičov */}
      <div className="flex gap-2 flex-wrap">
        {params.driver && (
          <Link href={`/admin/sluzobne-cesty${params.status ? `?status=${params.status}` : ''}`}>
            <Badge variant="outline" className="cursor-pointer">
              × Zrušiť filter vodiča
            </Badge>
          </Link>
        )}
      </div>

      {businessTrips.length === 0 ? (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Žiadne služobné cesty</h3>
          <p className="text-muted-foreground mt-1">
            {params.status ? 'Žiadne služobné cesty v tomto stave.' : 'Zatiaľ neboli vytvorené žiadne služobné cesty.'}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop tabuľka */}
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Číslo</TableHead>
                  <TableHead>Vodič</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Cieľ</TableHead>
                  <TableHead>Dátum</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead className="text-right">Suma</TableHead>
                  <TableHead className="text-right">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {businessTrips.map((trip) => {
                  const driver = trip.driver as { first_name: string; last_name: string } | null
                  return (
                    <TableRow key={trip.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href={`/admin/sluzobne-cesty/${trip.id}`} className="text-[#004B87] hover:underline">
                          {trip.trip_number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {driver ? (
                          <Link
                            href={`/admin/sluzobne-cesty?driver=${trip.driver_id}${params.status ? `&status=${params.status}` : ''}`}
                            className="hover:underline"
                          >
                            {driver.last_name} {driver.first_name}
                          </Link>
                        ) : '—'}
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
                        <Button variant="ghost" size="icon" asChild aria-label="Zobraziť detail">
                          <Link href={`/admin/sluzobne-cesty/${trip.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile karty */}
          <div className="md:hidden space-y-3">
            {businessTrips.map((trip) => {
              const driver = trip.driver as { first_name: string; last_name: string } | null
              return (
                <Link
                  key={trip.id}
                  href={`/admin/sluzobne-cesty/${trip.id}`}
                  className="block rounded-lg border p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm text-muted-foreground">{trip.trip_number}</span>
                    <Badge className={STATUS_COLORS[trip.status as BusinessTripStatus]}>
                      {BUSINESS_TRIP_STATUS[trip.status as BusinessTripStatus]}
                    </Badge>
                  </div>
                  <div className="font-medium">
                    {driver ? `${driver.last_name} ${driver.first_name}` : '—'}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {trip.destination_city}{trip.visit_place ? ` (${trip.visit_place})` : ''} · {format(new Date(trip.departure_date), 'd.M.yyyy', { locale: sk })}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline">
                      {trip.trip_type === 'zahranicna' ? 'Zahraničná' : 'Tuzemská'}
                    </Badge>
                    <span className="font-medium">{Number(trip.total_amount).toFixed(2)} €</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

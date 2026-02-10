import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import {
  BUSINESS_TRIP_STATUS, BUSINESS_TRIP_STATUS_COLORS, TRANSPORT_TYPES, EXPENSE_TYPES, COUNTRY_NAMES,
  type BusinessTripStatus,
} from '@/types'
import AdminActions from './admin-actions'

export default async function AdminBusinessTripDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: trip, error } = await supabase
    .from('business_trips')
    .select(`
      *,
      driver:drivers(*),
      border_crossings(*),
      trip_allowances(*),
      trip_expenses(*),
      business_trip_trips(*, trip:trips(*, vehicle:vehicles(*)))
    `)
    .eq('id', id)
    .single()

  if (error || !trip) notFound()

  const status = trip.status as BusinessTripStatus
  const driver = trip.driver as { first_name: string; last_name: string; position: string | null } | null
  const driverName = driver ? `${driver.last_name} ${driver.first_name}` : '—'
  const allowances = trip.trip_allowances || []
  const expenses = trip.trip_expenses || []
  const borderCrossings = trip.border_crossings || []
  const linkedTrips = (trip.business_trip_trips || []).map((btt: { trip: unknown }) => btt.trip).filter(Boolean)
  const allowanceCurrency = (() => {
    const currencies = [...new Set((allowances as { currency?: string }[]).map((a) => a.currency || 'EUR'))]
    return currencies.length === 1 ? currencies[0] : 'EUR'
  })()

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/sluzobne-cesty">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {trip.trip_number}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge className={BUSINESS_TRIP_STATUS_COLORS[status]}>
              {BUSINESS_TRIP_STATUS[status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {driverName}
            </span>
          </div>
        </div>
      </div>

      {/* Zamietnutie */}
      {status === 'rejected' && trip.rejection_reason && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-800">Dôvod vrátenia:</p>
          <p className="text-sm text-red-700">{trip.rejection_reason}</p>
        </div>
      )}

      {/* Základné info */}
      <div className="rounded-lg border p-4 space-y-2">
        <h3 className="font-medium text-sm text-[#004B87]">Základné údaje</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Vodič:</span>
          <span>{driverName}</span>

          <span className="text-muted-foreground">Funkcia:</span>
          <span>{driver?.position || '—'}</span>

          <span className="text-muted-foreground">Typ cesty:</span>
          <span>{trip.trip_type === 'zahranicna' ? 'Zahraničná' : 'Tuzemská'}</span>

          {trip.trip_type === 'zahranicna' && trip.destination_country && (
            <>
              <span className="text-muted-foreground">Krajina:</span>
              <span>{COUNTRY_NAMES[trip.destination_country] || trip.destination_country}</span>
            </>
          )}

          <span className="text-muted-foreground">Cieľ:</span>
          <span>{trip.destination_city}</span>

          {trip.visit_place && (
            <>
              <span className="text-muted-foreground">Miesto návštevy:</span>
              <span>{trip.visit_place}</span>
            </>
          )}

          <span className="text-muted-foreground">Účel:</span>
          <span>{trip.purpose}</span>

          <span className="text-muted-foreground">Dopravný prostriedok:</span>
          <span>{TRANSPORT_TYPES[trip.transport_type as keyof typeof TRANSPORT_TYPES] || trip.transport_type}</span>

          <span className="text-muted-foreground">Odchod:</span>
          <span>{format(new Date(trip.departure_date), 'd.M.yyyy HH:mm', { locale: sk })}</span>

          <span className="text-muted-foreground">Návrat:</span>
          <span>{format(new Date(trip.return_date), 'd.M.yyyy HH:mm', { locale: sk })}</span>

          {trip.companion && (
            <>
              <span className="text-muted-foreground">Spolucestujúci:</span>
              <span>{trip.companion}</span>
            </>
          )}

          {trip.notes && (
            <>
              <span className="text-muted-foreground">Poznámky:</span>
              <span>{trip.notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Prechody hraníc */}
      {borderCrossings.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="font-medium text-sm text-[#004B87]">Prechody hraníc</h3>
          {borderCrossings.map((bc: { id: string; direction: string; crossing_date: string; crossing_name: string; country_from: string; country_to: string }) => (
            <div key={bc.id} className="text-sm flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {bc.direction === 'outbound' ? 'Výjazd' : 'Príjazd'}
              </Badge>
              <span>
                {format(new Date(bc.crossing_date), 'd.M.yyyy HH:mm', { locale: sk })}
                {' – '}{bc.crossing_name}
                {' '}({COUNTRY_NAMES[bc.country_from] || bc.country_from} → {COUNTRY_NAMES[bc.country_to] || bc.country_to})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Priradené jazdy */}
      {linkedTrips.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="font-medium text-sm text-[#004B87]">Priradené jazdy</h3>
          {linkedTrips.map((lt: { id: string; date: string; route_from: string; route_to: string; distance: number }) => (
            <div key={lt.id} className="text-sm">
              {format(new Date(lt.date), 'd.M.yyyy', { locale: sk })}:
              {' '}{lt.route_from} → {lt.route_to} ({lt.distance || 0} km)
            </div>
          ))}
          <div className="text-sm font-medium">
            Celkom: {linkedTrips.reduce((sum: number, t: { distance: number }) => sum + (t.distance || 0), 0)} km
          </div>
        </div>
      )}

      {/* Stravné */}
      {allowances.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="font-medium text-sm text-[#004B87]">Stravné</h3>
          {allowances.map((allowance: { id: string; date: string; country: string; hours: number; net_amount: number; gross_amount: number; breakfast_deduction: number; lunch_deduction: number; dinner_deduction: number; currency: string }) => (
            <div key={allowance.id} className="text-sm flex justify-between">
              <span>
                {format(new Date(allowance.date), 'EEEE d.M.', { locale: sk })}
                {' – '}{COUNTRY_NAMES[allowance.country] || allowance.country}
                {' '}({allowance.hours}h)
                {(allowance.breakfast_deduction > 0 || allowance.lunch_deduction > 0 || allowance.dinner_deduction > 0) && (
                  <span className="text-muted-foreground ml-1">
                    [krátenie: {[
                      allowance.breakfast_deduction > 0 && 'R',
                      allowance.lunch_deduction > 0 && 'O',
                      allowance.dinner_deduction > 0 && 'V',
                    ].filter(Boolean).join('+')}]
                  </span>
                )}
              </span>
              <span className="font-medium">{Number(allowance.net_amount).toFixed(2)} {allowance.currency || 'EUR'}</span>
            </div>
          ))}
          <div className="text-sm font-medium flex justify-between border-t pt-2">
            <span>Celkom:</span>
            <span>{Number(trip.total_allowance).toFixed(2)} {allowanceCurrency}</span>
          </div>
        </div>
      )}

      {/* Výdavky */}
      {expenses.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h3 className="font-medium text-sm text-[#004B87]">Výdavky</h3>
          {expenses.map((expense: { id: string; expense_type: string; description: string; amount: number; date: string }) => (
            <div key={expense.id} className="text-sm flex justify-between">
              <span>
                {format(new Date(expense.date), 'd.M.', { locale: sk })} –{' '}
                {EXPENSE_TYPES[expense.expense_type as keyof typeof EXPENSE_TYPES] || expense.expense_type}
                {' – '}{expense.description}
              </span>
              <span className="font-medium">{Number(expense.amount).toFixed(2)} €</span>
            </div>
          ))}
          <div className="text-sm font-medium flex justify-between border-t pt-2">
            <span>Celkom:</span>
            <span>{Number(trip.total_expenses).toFixed(2)} €</span>
          </div>
        </div>
      )}

      {/* Celkový súhrn */}
      <div className="rounded-lg border-2 border-[#004B87] p-4 space-y-2 bg-[#004B87]/5">
        <h3 className="font-medium text-[#004B87]">Celkový súhrn</h3>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Stravné:</span>
            <span>{Number(trip.total_allowance).toFixed(2)} {allowanceCurrency}</span>
          </div>
          <div className="flex justify-between">
            <span>Výdavky:</span>
            <span>{Number(trip.total_expenses).toFixed(2)} EUR</span>
          </div>
          {Number(trip.total_amortization) > 0 && (
            <div className="flex justify-between">
              <span>Amortizácia:</span>
              <span>{Number(trip.total_amortization).toFixed(2)} EUR</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Celkový nárok:</span>
            <span>{Number(trip.total_amount).toFixed(2)} {allowanceCurrency}</span>
          </div>
          {Number(trip.advance_amount) > 0 && (
            <>
              <div className="flex justify-between">
                <span>Preddavok:</span>
                <span>{Number(trip.advance_amount).toFixed(2)} EUR</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{Number(trip.balance) >= 0 ? 'Preplatok:' : 'Doplatok:'}</span>
                <span className={Number(trip.balance) >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {Math.abs(Number(trip.balance)).toFixed(2)} {allowanceCurrency}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Admin akcie */}
      <AdminActions
        tripId={trip.id}
        status={status}
        tripNumber={trip.trip_number}
        driverName={driverName}
        driverPosition={driver?.position || null}
      />
    </div>
  )
}

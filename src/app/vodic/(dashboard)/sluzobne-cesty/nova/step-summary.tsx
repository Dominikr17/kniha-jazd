'use client'

import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import {
  TRANSPORT_TYPES, EXPENSE_TYPES, COUNTRY_NAMES,
  type TransportType, type ExpenseType, type Trip,
} from '@/types'

interface BorderCrossingInput {
  crossing_date: string
  crossing_name: string
  country_from: string
  country_to: string
  direction: 'outbound' | 'inbound'
}

interface ExpenseInput {
  expense_type: ExpenseType
  description: string
  amount: number
  currency: string
  date: string
  receipt_number: string
}

interface AllowanceDisplay {
  date: string
  country: string
  hours: number
  gross_amount: number
  net_amount: number
}

interface StepSummaryProps {
  tripType: 'tuzemska' | 'zahranicna'
  destinationCountry: string
  destinationCity: string
  purpose: string
  transportType: TransportType
  companion: string
  departureDate: string
  returnDate: string
  advanceAmount: number
  notes: string
  borderCrossings: BorderCrossingInput[]
  calculatedAllowances: AllowanceDisplay[]
  expenses: ExpenseInput[]
  selectedTrips: Trip[]
  totalAllowance: number
  totalExpenses: number
  totalAmortization: number
  totalAmount: number
  balance: number
}

function formatEur(amount: number): string {
  return `${amount.toFixed(2)} €`
}

export default function StepSummary({
  tripType, destinationCountry, destinationCity, purpose,
  transportType, companion, departureDate, returnDate,
  advanceAmount, notes, borderCrossings, calculatedAllowances,
  expenses, selectedTrips, totalAllowance, totalExpenses,
  totalAmortization, totalAmount, balance,
}: StepSummaryProps) {
  return (
    <div className="space-y-6">
      <h3 className="font-medium text-lg">Súhrn služobnej cesty</h3>

      {/* Základné info */}
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="font-medium text-sm text-[#004B87]">Základné údaje</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Typ cesty:</span>
          <span>{tripType === 'zahranicna' ? 'Zahraničná' : 'Tuzemská'}</span>

          {tripType === 'zahranicna' && (
            <>
              <span className="text-muted-foreground">Krajina:</span>
              <span>{COUNTRY_NAMES[destinationCountry] || destinationCountry}</span>
            </>
          )}

          <span className="text-muted-foreground">Cieľ:</span>
          <span>{destinationCity}</span>

          <span className="text-muted-foreground">Účel:</span>
          <span>{purpose}</span>

          <span className="text-muted-foreground">Dopravný prostriedok:</span>
          <span>{TRANSPORT_TYPES[transportType]}</span>

          <span className="text-muted-foreground">Odchod:</span>
          <span>{departureDate && format(new Date(departureDate), 'd.M.yyyy HH:mm', { locale: sk })}</span>

          <span className="text-muted-foreground">Návrat:</span>
          <span>{returnDate && format(new Date(returnDate), 'd.M.yyyy HH:mm', { locale: sk })}</span>

          {companion && (
            <>
              <span className="text-muted-foreground">Spolucestujúci:</span>
              <span>{companion}</span>
            </>
          )}

          {advanceAmount > 0 && (
            <>
              <span className="text-muted-foreground">Preddavok:</span>
              <span>{formatEur(advanceAmount)}</span>
            </>
          )}

          {notes && (
            <>
              <span className="text-muted-foreground">Poznámky:</span>
              <span>{notes}</span>
            </>
          )}
        </div>
      </div>

      {/* Prechody hraníc */}
      {borderCrossings.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm text-[#004B87]">Prechody hraníc</h4>
          {borderCrossings.map((bc, index) => (
            <div key={index} className="text-sm flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {bc.direction === 'outbound' ? 'Výjazd' : 'Príjazd'}
              </Badge>
              <span>
                {bc.crossing_date && format(new Date(bc.crossing_date), 'd.M.yyyy HH:mm', { locale: sk })}
                {' – '}
                {bc.crossing_name}
                {' '}
                ({COUNTRY_NAMES[bc.country_from] || bc.country_from} → {COUNTRY_NAMES[bc.country_to] || bc.country_to})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Priradené jazdy */}
      {selectedTrips.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm text-[#004B87]">
            Priradené jazdy ({selectedTrips.length})
          </h4>
          {selectedTrips.map((trip) => (
            <div key={trip.id} className="text-sm">
              {format(new Date(trip.date), 'd.M.yyyy', { locale: sk })}:
              {' '}{trip.route_from} → {trip.route_to} ({trip.distance || 0} km)
            </div>
          ))}
          <div className="text-sm font-medium">
            Celkom: {selectedTrips.reduce((sum, t) => sum + (t.distance || 0), 0)} km
          </div>
        </div>
      )}

      {/* Stravné */}
      <div className="rounded-lg border p-4 space-y-2">
        <h4 className="font-medium text-sm text-[#004B87]">Stravné</h4>
        {calculatedAllowances.map((allowance, index) => (
          <div key={index} className="text-sm flex items-center justify-between">
            <span>
              {format(new Date(allowance.date), 'EEEE d.M.', { locale: sk })}
              {' – '}
              {COUNTRY_NAMES[allowance.country] || allowance.country}
              {' '}
              ({allowance.hours}h)
            </span>
            <span className="font-medium">{formatEur(allowance.net_amount)}</span>
          </div>
        ))}
        <div className="text-sm font-medium flex justify-between border-t pt-2">
          <span>Celkom stravné:</span>
          <span>{formatEur(totalAllowance)}</span>
        </div>
      </div>

      {/* Výdavky */}
      {expenses.length > 0 && (
        <div className="rounded-lg border p-4 space-y-2">
          <h4 className="font-medium text-sm text-[#004B87]">Výdavky</h4>
          {expenses.map((expense, index) => (
            <div key={index} className="text-sm flex items-center justify-between">
              <span>
                {EXPENSE_TYPES[expense.expense_type]} – {expense.description}
              </span>
              <span className="font-medium">{formatEur(expense.amount)}</span>
            </div>
          ))}
          <div className="text-sm font-medium flex justify-between border-t pt-2">
            <span>Celkom výdavky:</span>
            <span>{formatEur(totalExpenses)}</span>
          </div>
        </div>
      )}

      {/* Celkový súhrn */}
      <div className="rounded-lg border-2 border-[#004B87] p-4 space-y-2 bg-[#004B87]/5">
        <h4 className="font-medium text-[#004B87]">Celkový súhrn</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Stravné:</span>
            <span>{formatEur(totalAllowance)}</span>
          </div>
          <div className="flex justify-between">
            <span>Výdavky:</span>
            <span>{formatEur(totalExpenses)}</span>
          </div>
          {totalAmortization > 0 && (
            <div className="flex justify-between">
              <span>Amortizácia:</span>
              <span>{formatEur(totalAmortization)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold border-t pt-2">
            <span>Celkový nárok:</span>
            <span>{formatEur(totalAmount)}</span>
          </div>
          {advanceAmount > 0 && (
            <>
              <div className="flex justify-between">
                <span>Preddavok:</span>
                <span>{formatEur(advanceAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>{balance >= 0 ? 'Preplatok:' : 'Doplatok:'}</span>
                <span className={balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatEur(Math.abs(balance))}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

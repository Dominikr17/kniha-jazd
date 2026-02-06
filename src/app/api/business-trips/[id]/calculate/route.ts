import { NextRequest, NextResponse } from 'next/server'
import { calculateTripAllowances, calculateAmortization, calculateTotalAmount, type AllowanceCalculationInput } from '@/lib/business-trip-calculator'
import type { BorderCrossing, Trip, TripExpense } from '@/types'
import { isValidUUID } from '@/lib/report-utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Neplatné ID' }, { status: 400 })
  }

  try {
    const body = await request.json()

    const {
      departure_date, return_date, trip_type, destination_country,
      border_crossings, meals, expenses, linked_trips, transport_type,
      advance_amount
    } = body

    if (!departure_date || !return_date) {
      return NextResponse.json({ error: 'Chýba dátum odchodu/návratu' }, { status: 400 })
    }

    if (departure_date > return_date) {
      return NextResponse.json({ error: 'Dátum odchodu nemôže byť po dátume návratu' }, { status: 400 })
    }

    const calculationInput: AllowanceCalculationInput = {
      departureDate: departure_date,
      returnDate: return_date,
      tripType: trip_type || 'tuzemska',
      destinationCountry: destination_country || null,
      borderCrossings: (border_crossings || []) as BorderCrossing[],
      meals: meals || {},
    }

    const allowances = calculateTripAllowances(calculationInput)
    const amortization = calculateAmortization(
      (linked_trips || []) as Trip[],
      transport_type || ''
    )
    const totals = calculateTotalAmount(
      allowances,
      (expenses || []) as TripExpense[],
      amortization,
      advance_amount || 0
    )

    return NextResponse.json({
      allowances,
      amortization,
      ...totals,
    })
  } catch (error) {
    console.error('Error calculating allowances:', error)
    return NextResponse.json({ error: 'Chyba pri výpočte' }, { status: 500 })
  }
}

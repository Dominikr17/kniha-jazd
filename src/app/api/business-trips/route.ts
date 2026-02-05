import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriverSession } from '@/lib/driver-session'

export async function POST(request: NextRequest) {
  const session = await getDriverSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const body = await request.json()

    const {
      trip_type, destination_country, destination_city, purpose,
      transport_type, companion, departure_date, return_date,
      advance_amount, advance_currency, notes,
      border_crossings, expenses, linked_trip_ids,
      allowances, total_allowance, total_expenses,
      total_amortization, total_amount, balance
    } = body

    // Validácia povinných polí
    if (!trip_type || !destination_city || !purpose || !transport_type || !departure_date || !return_date) {
      return NextResponse.json({ error: 'Chýbajú povinné polia' }, { status: 400 })
    }

    if (!['tuzemska', 'zahranicna'].includes(trip_type)) {
      return NextResponse.json({ error: 'Neplatný typ cesty' }, { status: 400 })
    }

    // Generovanie trip_number
    const { data: seqData, error: seqError } = await supabase
      .rpc('nextval', { seq_name: 'business_trips_number_seq' })

    let tripNumber: string
    if (seqError || !seqData) {
      // Fallback - timestamp-based
      tripNumber = `SC-${new Date().getFullYear()}/${String(Date.now() % 10000).padStart(4, '0')}`
    } else {
      const year = new Date().getFullYear()
      tripNumber = `SC-${year}/${String(seqData).padStart(3, '0')}`
    }

    // Vložiť hlavičku
    const { data: businessTrip, error: insertError } = await supabase
      .from('business_trips')
      .insert({
        trip_number: tripNumber,
        driver_id: session.id,
        trip_type,
        destination_country: destination_country || null,
        destination_city,
        purpose,
        transport_type,
        companion: companion || null,
        departure_date,
        return_date,
        advance_amount: advance_amount || 0,
        advance_currency: advance_currency || 'EUR',
        total_allowance: total_allowance || 0,
        total_expenses: total_expenses || 0,
        total_amortization: total_amortization || 0,
        total_amount: total_amount || 0,
        balance: balance || 0,
        notes: notes || null,
        status: 'draft',
      })
      .select()
      .single()

    if (insertError || !businessTrip) {
      console.error('Error creating business trip:', insertError)
      return NextResponse.json({ error: 'Chyba pri vytváraní služobnej cesty' }, { status: 500 })
    }

    const businessTripId = businessTrip.id

    // Vložiť prechody hraníc
    if (border_crossings && border_crossings.length > 0) {
      const crossingsToInsert = border_crossings.map((bc: Record<string, unknown>) => ({
        business_trip_id: businessTripId,
        crossing_date: bc.crossing_date,
        crossing_name: bc.crossing_name,
        country_from: bc.country_from,
        country_to: bc.country_to,
        direction: bc.direction,
      }))
      await supabase.from('border_crossings').insert(crossingsToInsert)
    }

    // Vložiť stravné
    if (allowances && allowances.length > 0) {
      const allowancesToInsert = allowances.map((a: Record<string, unknown>) => ({
        business_trip_id: businessTripId,
        date: a.date,
        country: a.country,
        hours: a.hours,
        base_rate: a.base_rate,
        rate_percentage: a.rate_percentage,
        gross_amount: a.gross_amount,
        breakfast_deduction: a.breakfast_deduction || 0,
        lunch_deduction: a.lunch_deduction || 0,
        dinner_deduction: a.dinner_deduction || 0,
        net_amount: a.net_amount,
        currency: a.currency || 'EUR',
      }))
      await supabase.from('trip_allowances').insert(allowancesToInsert)
    }

    // Vložiť výdavky
    if (expenses && expenses.length > 0) {
      const expensesToInsert = expenses.map((e: Record<string, unknown>) => ({
        business_trip_id: businessTripId,
        expense_type: e.expense_type,
        description: e.description,
        amount: e.amount,
        currency: e.currency || 'EUR',
        date: e.date,
        receipt_number: e.receipt_number || null,
      }))
      await supabase.from('trip_expenses').insert(expensesToInsert)
    }

    // Väzba na jazdy
    if (linked_trip_ids && linked_trip_ids.length > 0) {
      const linksToInsert = (linked_trip_ids as string[]).map((tripId: string) => ({
        business_trip_id: businessTripId,
        trip_id: tripId,
      }))
      await supabase.from('business_trip_trips').insert(linksToInsert)
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      table_name: 'business_trips',
      record_id: businessTripId,
      operation: 'INSERT',
      user_type: 'driver',
      user_id: session.id,
      user_name: session.name,
      new_data: businessTrip,
      description: `${session.name} vytvoril služobnú cestu ${tripNumber}`,
    })

    return NextResponse.json({ success: true, data: businessTrip })
  } catch (error) {
    console.error('Error in business trips POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

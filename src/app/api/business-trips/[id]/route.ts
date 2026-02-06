import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriverSession } from '@/lib/driver-session'
import { isValidUUID } from '@/lib/report-utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Neplatné ID' }, { status: 400 })
    }

    const supabase = await createClient()

    // Overiť autorizáciu — admin alebo vodič
    const session = await getDriverSession()
    const { data: { user } } = await supabase.auth.getUser()

    if (!session && !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    if (error || !trip) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    // Vodič môže vidieť len vlastné SC
    if (session && !user && trip.driver_id !== session.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie' }, { status: 403 })
    }

    return NextResponse.json(trip)
  } catch (error) {
    console.error('Error getting business trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Neplatné ID' }, { status: 400 })
    }

    const session = await getDriverSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Overiť ownership a status
    const { data: existing, error: fetchError } = await supabase
      .from('business_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    if (existing.driver_id !== session.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie' }, { status: 403 })
    }

    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return NextResponse.json({ error: 'Upraviť je možné len rozpracovanú alebo vrátenú SC' }, { status: 400 })
    }

    const body = await request.json()

    const {
      trip_type, destination_country, destination_city, visit_place, purpose,
      transport_type, companion, departure_date, return_date,
      advance_amount, advance_currency, notes,
      border_crossings, expenses, linked_trip_ids,
      allowances, total_allowance, total_expenses,
      total_amortization, total_amount, balance
    } = body

    // Aktualizovať hlavičku
    const status = existing.status === 'rejected' ? 'draft' : existing.status
    const { error: updateError } = await supabase
      .from('business_trips')
      .update({
        trip_type: trip_type || existing.trip_type,
        destination_country: destination_country ?? existing.destination_country,
        destination_city: destination_city || existing.destination_city,
        visit_place: visit_place ?? existing.visit_place,
        purpose: purpose || existing.purpose,
        transport_type: transport_type || existing.transport_type,
        companion: companion ?? existing.companion,
        departure_date: departure_date || existing.departure_date,
        return_date: return_date || existing.return_date,
        advance_amount: advance_amount ?? existing.advance_amount,
        advance_currency: advance_currency || existing.advance_currency,
        total_allowance: total_allowance ?? existing.total_allowance,
        total_expenses: total_expenses ?? existing.total_expenses,
        total_amortization: total_amortization ?? existing.total_amortization,
        total_amount: total_amount ?? existing.total_amount,
        balance: balance ?? existing.balance,
        notes: notes ?? existing.notes,
        status,
        rejection_reason: status === 'draft' ? null : existing.rejection_reason,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Chyba pri aktualizácii' }, { status: 500 })
    }

    // Nahradiť child záznamy (delete + insert)
    const { error: delCrossingsErr } = await supabase.from('border_crossings').delete().eq('business_trip_id', id)
    const { error: delAllowancesErr } = await supabase.from('trip_allowances').delete().eq('business_trip_id', id)
    const { error: delExpensesErr } = await supabase.from('trip_expenses').delete().eq('business_trip_id', id)
    const { error: delLinksErr } = await supabase.from('business_trip_trips').delete().eq('business_trip_id', id)

    const deleteError = delCrossingsErr || delAllowancesErr || delExpensesErr || delLinksErr
    if (deleteError) {
      console.error('Error deleting child records:', deleteError)
      return NextResponse.json({ error: 'Chyba pri aktualizácii podradených záznamov' }, { status: 500 })
    }

    if (border_crossings && border_crossings.length > 0) {
      const { error: crossingsError } = await supabase.from('border_crossings').insert(
        border_crossings.map((bc: Record<string, unknown>) => ({
          business_trip_id: id,
          crossing_date: bc.crossing_date,
          crossing_name: bc.crossing_name,
          country_from: bc.country_from,
          country_to: bc.country_to,
          direction: bc.direction,
        }))
      )
      if (crossingsError) {
        console.error('Error inserting border crossings:', crossingsError)
        return NextResponse.json({ error: 'Chyba pri ukladaní prechodov hraníc' }, { status: 500 })
      }
    }

    if (allowances && allowances.length > 0) {
      const { error: allowancesError } = await supabase.from('trip_allowances').insert(
        allowances.map((a: Record<string, unknown>) => ({
          business_trip_id: id,
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
      )
      if (allowancesError) {
        console.error('Error inserting allowances:', allowancesError)
        return NextResponse.json({ error: 'Chyba pri ukladaní stravného' }, { status: 500 })
      }
    }

    if (expenses && expenses.length > 0) {
      const { error: expensesError } = await supabase.from('trip_expenses').insert(
        expenses.map((e: Record<string, unknown>) => ({
          business_trip_id: id,
          expense_type: e.expense_type,
          description: e.description,
          amount: e.amount,
          currency: e.currency || 'EUR',
          date: e.date,
          receipt_number: e.receipt_number || null,
        }))
      )
      if (expensesError) {
        console.error('Error inserting expenses:', expensesError)
        return NextResponse.json({ error: 'Chyba pri ukladaní výdavkov' }, { status: 500 })
      }
    }

    if (linked_trip_ids && linked_trip_ids.length > 0) {
      const { error: linksError } = await supabase.from('business_trip_trips').insert(
        (linked_trip_ids as string[]).map((tripId: string) => ({
          business_trip_id: id,
          trip_id: tripId,
        }))
      )
      if (linksError) {
        console.error('Error inserting trip links:', linksError)
        return NextResponse.json({ error: 'Chyba pri prepájaní jázd' }, { status: 500 })
      }
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      table_name: 'business_trips',
      record_id: id,
      operation: 'UPDATE',
      user_type: 'driver',
      user_id: session.id,
      user_name: session.name,
      old_data: existing,
      description: `${session.name} upravil služobnú cestu ${existing.trip_number}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating business trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Neplatné ID' }, { status: 400 })
    }

    const session = await getDriverSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    const { data: existing, error: fetchError } = await supabase
      .from('business_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    if (existing.driver_id !== session.id) {
      return NextResponse.json({ error: 'Nemáte oprávnenie' }, { status: 403 })
    }

    if (existing.status !== 'draft') {
      return NextResponse.json({ error: 'Vymazať je možné len rozpracovanú SC' }, { status: 400 })
    }

    // CASCADE sa postará o child záznamy
    const { error: deleteError } = await supabase
      .from('business_trips')
      .delete()
      .eq('id', id)

    if (deleteError) {
      return NextResponse.json({ error: 'Chyba pri mazaní' }, { status: 500 })
    }

    await supabase.from('audit_logs').insert({
      table_name: 'business_trips',
      record_id: id,
      operation: 'DELETE',
      user_type: 'driver',
      user_id: session.id,
      user_name: session.name,
      old_data: existing,
      description: `${session.name} zmazal služobnú cestu ${existing.trip_number}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting business trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
      trip_type, destination_country, destination_city, visit_place, purpose,
      transport_type, companion, departure_date, return_date,
      advance_amount, advance_currency, notes,
      border_crossings, expenses, linked_trip_ids,
      allowances, total_allowance, total_expenses,
      total_amortization, total_amount, balance,
      companion_driver_ids,
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
        visit_place: visit_place || null,
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
      const { error: crossingsError } = await supabase.from('border_crossings').insert(crossingsToInsert)
      if (crossingsError) {
        console.error('Error inserting border crossings:', crossingsError)
        return NextResponse.json({ error: 'Chyba pri ukladaní prechodov hraníc' }, { status: 500 })
      }
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
      const { error: allowancesError } = await supabase.from('trip_allowances').insert(allowancesToInsert)
      if (allowancesError) {
        console.error('Error inserting allowances:', allowancesError)
        return NextResponse.json({ error: 'Chyba pri ukladaní stravného' }, { status: 500 })
      }
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
      const { error: expensesError } = await supabase.from('trip_expenses').insert(expensesToInsert)
      if (expensesError) {
        console.error('Error inserting expenses:', expensesError)
        return NextResponse.json({ error: 'Chyba pri ukladaní výdavkov' }, { status: 500 })
      }
    }

    // Väzba na jazdy
    if (linked_trip_ids && linked_trip_ids.length > 0) {
      const linksToInsert = (linked_trip_ids as string[]).map((tripId: string) => ({
        business_trip_id: businessTripId,
        trip_id: tripId,
      }))
      const { error: linksError } = await supabase.from('business_trip_trips').insert(linksToInsert)
      if (linksError) {
        console.error('Error inserting trip links:', linksError)
        return NextResponse.json({ error: 'Chyba pri prepájaní jázd' }, { status: 500 })
      }
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

    // Klonovanie SC pre spolucestujúcich vodičov
    if (companion_driver_ids && Array.isArray(companion_driver_ids) && companion_driver_ids.length > 0) {
      const groupId = businessTripId

      // Nastaviť group_id na hlavnej SC
      await supabase.from('business_trips').update({ group_id: groupId }).eq('id', businessTripId)

      for (const companionDriverId of companion_driver_ids) {
        // Overiť, že companion driver existuje
        const { data: companionDriver } = await supabase
          .from('drivers')
          .select('id, first_name, last_name')
          .eq('id', companionDriverId)
          .single()

        if (!companionDriver) continue

        // Generovať nový trip_number pre klon
        const { data: cloneSeqData } = await supabase
          .rpc('nextval', { seq_name: 'business_trips_number_seq' })

        let cloneTripNumber: string
        if (!cloneSeqData) {
          cloneTripNumber = `SC-${new Date().getFullYear()}/${String(Date.now() % 10000).padStart(4, '0')}`
        } else {
          cloneTripNumber = `SC-${new Date().getFullYear()}/${String(cloneSeqData).padStart(3, '0')}`
        }

        // Meno hlavného vodiča ako companion v klone
        const mainDriverCompanion = session.name

        // Vytvoriť klon SC
        const { data: clonedTrip, error: cloneError } = await supabase
          .from('business_trips')
          .insert({
            trip_number: cloneTripNumber,
            driver_id: companionDriverId,
            trip_type,
            destination_country: destination_country || null,
            destination_city,
            visit_place: visit_place || null,
            purpose,
            transport_type,
            companion: mainDriverCompanion,
            group_id: groupId,
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

        if (cloneError || !clonedTrip) {
          console.error('Error cloning business trip for companion:', cloneError)
          continue
        }

        const clonedTripId = clonedTrip.id

        // Klonovať prechody hraníc
        if (border_crossings && border_crossings.length > 0) {
          const cloneCrossings = border_crossings.map((bc: Record<string, unknown>) => ({
            business_trip_id: clonedTripId,
            crossing_date: bc.crossing_date,
            crossing_name: bc.crossing_name,
            country_from: bc.country_from,
            country_to: bc.country_to,
            direction: bc.direction,
          }))
          await supabase.from('border_crossings').insert(cloneCrossings)
        }

        // Klonovať stravné
        if (allowances && allowances.length > 0) {
          const cloneAllowances = allowances.map((a: Record<string, unknown>) => ({
            business_trip_id: clonedTripId,
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
          await supabase.from('trip_allowances').insert(cloneAllowances)
        }

        // Klonovať výdavky
        if (expenses && expenses.length > 0) {
          const cloneExpenses = expenses.map((e: Record<string, unknown>) => ({
            business_trip_id: clonedTripId,
            expense_type: e.expense_type,
            description: e.description,
            amount: e.amount,
            currency: e.currency || 'EUR',
            date: e.date,
            receipt_number: e.receipt_number || null,
          }))
          await supabase.from('trip_expenses').insert(cloneExpenses)
        }

        // Klonovať väzby na jazdy
        if (linked_trip_ids && linked_trip_ids.length > 0) {
          const cloneLinks = (linked_trip_ids as string[]).map((tripId: string) => ({
            business_trip_id: clonedTripId,
            trip_id: tripId,
          }))
          await supabase.from('business_trip_trips').insert(cloneLinks)
        }

        // Audit log pre klon
        const companionName = `${companionDriver.last_name} ${companionDriver.first_name}`
        await supabase.from('audit_logs').insert({
          table_name: 'business_trips',
          record_id: clonedTripId,
          operation: 'INSERT',
          user_type: 'driver',
          user_id: session.id,
          user_name: session.name,
          new_data: clonedTrip,
          description: `Automaticky vytvorená kópia SC ${cloneTripNumber} pre ${companionName} (skupina ${groupId})`,
        })
      }
    }

    return NextResponse.json({ success: true, data: businessTrip })
  } catch (error) {
    console.error('Error in business trips POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

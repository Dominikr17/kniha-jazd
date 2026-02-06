import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriverSession } from '@/lib/driver-session'
import { isValidUUID } from '@/lib/report-utils'

export async function POST(
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

    if (existing.status !== 'draft' && existing.status !== 'rejected') {
      return NextResponse.json({ error: 'Odoslať je možné len rozpracovanú alebo vrátenú SC' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('business_trips')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Chyba pri odosielaní' }, { status: 500 })
    }

    await supabase.from('audit_logs').insert({
      table_name: 'business_trips',
      record_id: id,
      operation: 'UPDATE',
      user_type: 'driver',
      user_id: session.id,
      user_name: session.name,
      old_data: existing,
      description: `${session.name} odoslal služobnú cestu ${existing.trip_number} na schválenie`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error submitting business trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

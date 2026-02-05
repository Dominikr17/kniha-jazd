import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data: existing, error: fetchError } = await supabase
      .from('business_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    if (existing.status !== 'approved') {
      return NextResponse.json({ error: 'Preplatiť je možné len schválenú SC' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('business_trips')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Chyba pri preplatení' }, { status: 500 })
    }

    await supabase.from('audit_logs').insert({
      table_name: 'business_trips',
      record_id: id,
      operation: 'UPDATE',
      user_type: 'admin',
      user_id: user.id,
      user_name: user.email,
      old_data: existing,
      description: `Admin ${user.email} preplatil služobnú cestu ${existing.trip_number}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error marking business trip as paid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

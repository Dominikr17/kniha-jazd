import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditWithClient } from '@/lib/audit-logger'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { reason } = body

    const { data: existing, error: fetchError } = await supabase
      .from('business_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    if (existing.status !== 'submitted') {
      return NextResponse.json({ error: 'Vrátiť je možné len odoslanú SC' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('business_trips')
      .update({
        status: 'rejected',
        rejection_reason: reason || 'Bez udania dôvodu',
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Chyba pri vrátení' }, { status: 500 })
    }

    await logAuditWithClient(supabase, {
      tableName: 'business_trips',
      recordId: id,
      operation: 'UPDATE',
      userType: 'admin',
      userId: user.id,
      userName: user.email,
      oldData: existing,
      description: `Admin ${user.email} vrátil služobnú cestu ${existing.trip_number}: ${reason || 'bez dôvodu'}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error rejecting business trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

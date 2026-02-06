import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAuditWithClient } from '@/lib/audit-logger'
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

    const supabase = await createClient()

    // Overiť admin autentifikáciu
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: existing, error: fetchError } = await supabase
      .from('business_trips')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Služobná cesta nenájdená' }, { status: 404 })
    }

    if (existing.status !== 'submitted') {
      return NextResponse.json({ error: 'Schváliť je možné len odoslanú SC' }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from('business_trips')
      .update({
        status: 'approved',
        approved_by: user.email || user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: 'Chyba pri schvaľovaní' }, { status: 500 })
    }

    await logAuditWithClient(supabase, {
      tableName: 'business_trips',
      recordId: id,
      operation: 'UPDATE',
      userType: 'admin',
      userId: user.id,
      userName: user.email,
      oldData: existing,
      description: `Admin ${user.email} schválil služobnú cestu ${existing.trip_number}`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error approving business trip:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

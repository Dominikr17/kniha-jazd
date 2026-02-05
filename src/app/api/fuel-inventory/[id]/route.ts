import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit-logger'
import { isValidUUID } from '@/lib/report-utils'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Neplatné ID' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Overenie admin autentifikácie
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Načítanie záznamu pred vymazaním
    const { data: oldData, error: fetchError } = await supabase
      .from('fuel_inventory')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !oldData) {
      return NextResponse.json(
        { success: false, error: 'Záznam nebol nájdený' },
        { status: 404 }
      )
    }

    // Vymazanie záznamu
    const { error: deleteError } = await supabase
      .from('fuel_inventory')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting fuel inventory:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Nepodarilo sa vymazať záznam' },
        { status: 500 }
      )
    }

    // Audit log
    await logAudit({
      tableName: 'fuel_inventory',
      recordId: id,
      operation: 'DELETE',
      userType: 'admin',
      userId: user.id,
      userName: user.email,
      oldData,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in fuel-inventory DELETE API:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

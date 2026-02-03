import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/audit-logger'

// UUID validácia
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    // Validácia UUID
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { success: false, error: 'Neplatné ID výkazu' },
        { status: 400 }
      )
    }

    // Autorizácia - overenie admin používateľa
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    // Načítať výkaz pred vymazaním pre audit log
    const { data: report, error: fetchError } = await supabase
      .from('monthly_reports')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !report) {
      return NextResponse.json(
        { success: false, error: 'Výkaz nebol nájdený' },
        { status: 404 }
      )
    }

    // Vymazanie výkazu
    const { error: deleteError } = await supabase
      .from('monthly_reports')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Error deleting report:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Chyba pri mazaní výkazu' },
        { status: 500 }
      )
    }

    // Audit log
    await logAudit({
      tableName: 'monthly_reports',
      recordId: id,
      operation: 'DELETE',
      userType: 'admin',
      userId: user.id,
      userName: user.email,
      oldData: report,
    })

    // Redirect na zoznam výkazov
    const redirectUrl = new URL('/admin/vykazy', request.url)
    return NextResponse.redirect(redirectUrl, 303)
  } catch (error) {
    console.error('Error in DELETE /api/admin/vykazy/[id]:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

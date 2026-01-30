import { NextResponse } from 'next/server'
import { generateReportsForAllVehicles } from '@/lib/monthly-report'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    // Autorizácia - overenie admin používateľa
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { year, month } = body

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Chýba rok alebo mesiac' },
        { status: 400 }
      )
    }

    // Validácia číselných hodnôt
    const parsedYear = parseInt(year)
    const parsedMonth = parseInt(month)

    if (parsedYear < 2020 || parsedYear > 2100) {
      return NextResponse.json(
        { success: false, error: 'Neplatný rok' },
        { status: 400 }
      )
    }

    if (parsedMonth < 1 || parsedMonth > 12) {
      return NextResponse.json(
        { success: false, error: 'Neplatný mesiac' },
        { status: 400 }
      )
    }

    const result = await generateReportsForAllVehicles(parsedYear, parsedMonth)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

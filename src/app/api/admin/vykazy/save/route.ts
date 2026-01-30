import { NextResponse } from 'next/server'
import { saveMonthlyReport } from '@/lib/monthly-report'
import { ReportStatus, REPORT_STATUS } from '@/types'
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
    const {
      vehicleId,
      year,
      month,
      initialFuelStock,
      finalFuelStock,
      initialOdometer,
      finalOdometer,
      status,
      approvedBy,
      notes
    } = body

    // Validácia povinných parametrov
    if (!vehicleId || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'Chýbajú povinné parametre' },
        { status: 400 }
      )
    }

    // Validácia status enum
    const validStatuses = Object.values(REPORT_STATUS)
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Neplatný status' },
        { status: 400 }
      )
    }

    // Validácia číselných hodnôt
    const parsedYear = parseInt(year)
    const parsedMonth = parseInt(month)
    const parsedInitialFuelStock = parseFloat(initialFuelStock) || 0
    const parsedFinalFuelStock = parseFloat(finalFuelStock) || 0
    const parsedInitialOdometer = parseInt(initialOdometer) || 0
    const parsedFinalOdometer = parseInt(finalOdometer) || 0

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

    if (parsedInitialFuelStock < 0 || parsedFinalFuelStock < 0) {
      return NextResponse.json(
        { success: false, error: 'Zásoby PHM nemôžu byť záporné' },
        { status: 400 }
      )
    }

    if (parsedInitialOdometer < 0 || parsedFinalOdometer < 0) {
      return NextResponse.json(
        { success: false, error: 'Stav tachometra nemôže byť záporný' },
        { status: 400 }
      )
    }

    const result = await saveMonthlyReport({
      vehicleId,
      year: parsedYear,
      month: parsedMonth,
      initialFuelStock: parsedInitialFuelStock,
      finalFuelStock: parsedFinalFuelStock,
      initialOdometer: parsedInitialOdometer,
      finalOdometer: parsedFinalOdometer,
      status: (status as ReportStatus) || 'draft',
      approvedBy: approvedBy || null,
      notes: notes || null
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error saving report:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

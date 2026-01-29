import { NextResponse } from 'next/server'
import { saveMonthlyReport } from '@/lib/monthly-report'
import { ReportStatus } from '@/types'

export async function POST(request: Request) {
  try {
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

    if (!vehicleId || !year || !month) {
      return NextResponse.json(
        { success: false, error: 'Chýbajú povinné parametre' },
        { status: 400 }
      )
    }

    const result = await saveMonthlyReport({
      vehicleId,
      year: parseInt(year),
      month: parseInt(month),
      initialFuelStock: parseFloat(initialFuelStock) || 0,
      finalFuelStock: parseFloat(finalFuelStock) || 0,
      initialOdometer: parseInt(initialOdometer) || 0,
      finalOdometer: parseInt(finalOdometer) || 0,
      status: status as ReportStatus,
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

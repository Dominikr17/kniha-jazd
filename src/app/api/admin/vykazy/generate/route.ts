import { NextResponse } from 'next/server'
import { generateReportsForAllVehicles } from '@/lib/monthly-report'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { year, month } = body

    if (!year || !month) {
      return NextResponse.json(
        { success: false, error: 'Chýba rok alebo mesiac' },
        { status: 400 }
      )
    }

    const result = await generateReportsForAllVehicles(year, month)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

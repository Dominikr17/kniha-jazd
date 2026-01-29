import { NextRequest, NextResponse } from 'next/server'
import { handleFullTankRefuel } from '@/lib/fuel-stock-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, fuelRecordId, date } = body

    if (!vehicleId || !fuelRecordId || !date) {
      return NextResponse.json(
        { success: false, error: 'Chýbajúce parametre' },
        { status: 400 }
      )
    }

    const result = await handleFullTankRefuel({
      vehicleId,
      fuelRecordId,
      date
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in fuel-inventory API:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

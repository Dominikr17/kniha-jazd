import { NextRequest, NextResponse } from 'next/server'
import { createFuelInventory } from '@/lib/fuel-stock-calculator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, date, fuelAmount, notes } = body

    if (!vehicleId || !date || fuelAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Chýbajúce parametre' },
        { status: 400 }
      )
    }

    const result = await createFuelInventory({
      vehicleId,
      date,
      fuelAmount: parseFloat(fuelAmount),
      source: 'initial',
      notes
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in fuel-inventory/initial API:', error)
    return NextResponse.json(
      { success: false, error: 'Interná chyba servera' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createFuelInventory } from '@/lib/fuel-stock-calculator'
import { isValidUUID } from '@/lib/report-utils'

export async function POST(request: NextRequest) {
  try {
    // Overenie admin autentifikácie
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Neautorizovaný prístup' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { vehicleId, date, fuelAmount, notes } = body

    if (!vehicleId || !date || fuelAmount === undefined) {
      return NextResponse.json(
        { success: false, error: 'Chýbajúce parametre' },
        { status: 400 }
      )
    }

    // UUID validácia
    if (!isValidUUID(vehicleId)) {
      return NextResponse.json(
        { success: false, error: 'Neplatné ID vozidla' },
        { status: 400 }
      )
    }

    // Validácia dátumu
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Neplatný formát dátumu' },
        { status: 400 }
      )
    }

    // Validácia množstva paliva
    const parsedAmount = parseFloat(fuelAmount)
    if (isNaN(parsedAmount) || parsedAmount < 0 || parsedAmount > 500) {
      return NextResponse.json(
        { success: false, error: 'Neplatné množstvo paliva (0-500 l)' },
        { status: 400 }
      )
    }

    const result = await createFuelInventory({
      vehicleId,
      date,
      fuelAmount: parsedAmount,
      source: 'initial',
      notes: notes ? String(notes).slice(0, 500) : undefined
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

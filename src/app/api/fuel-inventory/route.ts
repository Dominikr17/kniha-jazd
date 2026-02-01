import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { handleFullTankRefuel } from '@/lib/fuel-stock-calculator'

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

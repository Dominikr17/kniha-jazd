import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getDriverId } from '@/lib/driver-session'
import { getVehiclesForDriver } from '@/lib/driver-vehicles'

export async function GET() {
  try {
    const driverId = await getDriverId()

    if (!driverId) {
      return NextResponse.json({ vehicles: [], error: 'Nie ste prihlásený' }, { status: 401 })
    }

    const supabase = await createClient()
    const vehicles = await getVehiclesForDriver(supabase, driverId)

    return NextResponse.json({ vehicles })
  } catch (error) {
    console.error('Error getting driver vehicles:', error)
    return NextResponse.json({ vehicles: [], error: 'Internal server error' }, { status: 500 })
  }
}

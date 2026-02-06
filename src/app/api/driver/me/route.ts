import { NextResponse } from 'next/server'
import { getDriverId, getDriverName } from '@/lib/driver-session'

export async function GET() {
  try {
    const driverId = await getDriverId()
    const driverName = await getDriverName()

    return NextResponse.json({
      driverId,
      driverName,
    })
  } catch (error) {
    console.error('Error getting driver session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

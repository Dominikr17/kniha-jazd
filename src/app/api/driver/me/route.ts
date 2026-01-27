import { NextResponse } from 'next/server'
import { getDriverId, getDriverName } from '@/lib/driver-session'

export async function GET() {
  const driverId = await getDriverId()
  const driverName = await getDriverName()

  return NextResponse.json({
    driverId,
    driverName,
  })
}

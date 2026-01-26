import { NextRequest, NextResponse } from 'next/server'
import { setDriverCookie } from '@/lib/driver-session'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const driverId = formData.get('driverId') as string
  const driverName = formData.get('driverName') as string

  if (!driverId || !driverName) {
    return NextResponse.redirect(new URL('/vodic?error=missing', request.url))
  }

  await setDriverCookie(driverId, driverName)
  return NextResponse.redirect(new URL('/vodic/jazdy', request.url))
}

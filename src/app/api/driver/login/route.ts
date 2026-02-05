import { NextRequest, NextResponse } from 'next/server'
import { setDriverCookie } from '@/lib/driver-session'
import { createClient } from '@/lib/supabase/server'
import { isValidUUID } from '@/lib/report-utils'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const driverId = formData.get('driverId') as string
  const driverName = formData.get('driverName') as string

  if (!driverId || !driverName) {
    return NextResponse.redirect(new URL('/?error=missing', request.url))
  }

  // UUID validácia
  if (!isValidUUID(driverId)) {
    return NextResponse.redirect(new URL('/?error=invalid', request.url))
  }

  // Ochrana pred príliš dlhým menom
  if (driverName.length > 200) {
    return NextResponse.redirect(new URL('/?error=invalid', request.url))
  }

  // Validácia - overiť že vodič existuje v databáze
  const supabase = await createClient()
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('id, first_name, last_name')
    .eq('id', driverId)
    .single()

  if (error || !driver) {
    console.warn('Invalid driver login attempt:', driverId)
    return NextResponse.redirect(new URL('/?error=invalid', request.url))
  }

  // Overiť že meno zodpovedá (ochrana pred manipuláciou)
  const expectedName = `${driver.first_name} ${driver.last_name}`
  if (driverName !== expectedName) {
    console.warn('Driver name mismatch:', { provided: driverName, expected: expectedName })
    return NextResponse.redirect(new URL('/?error=invalid', request.url))
  }

  await setDriverCookie(driverId, driverName)
  return NextResponse.redirect(new URL('/vodic/jazdy', request.url))
}

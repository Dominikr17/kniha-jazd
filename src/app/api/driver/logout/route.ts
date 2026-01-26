import { NextResponse } from 'next/server'
import { clearDriverCookie } from '@/lib/driver-session'

export async function POST() {
  await clearDriverCookie()
  return NextResponse.redirect(new URL('/vodic', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'))
}

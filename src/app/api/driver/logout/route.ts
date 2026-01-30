import { NextRequest, NextResponse } from 'next/server'
import { clearDriverCookie } from '@/lib/driver-session'

export async function POST(request: NextRequest) {
  await clearDriverCookie()

  const url = new URL('/', request.url)
  return NextResponse.redirect(url, 303)
}

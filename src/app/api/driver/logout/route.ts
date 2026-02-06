import { NextRequest, NextResponse } from 'next/server'
import { clearDriverCookie } from '@/lib/driver-session'

export async function POST(request: NextRequest) {
  try {
    await clearDriverCookie()

    const url = new URL('/', request.url)
    return NextResponse.redirect(url, 303)
  } catch (error) {
    console.error('Error during driver logout:', error)
    const url = new URL('/', request.url)
    return NextResponse.redirect(url, 303)
  }
}

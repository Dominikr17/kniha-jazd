import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { pin } = await request.json()

    const appPin = process.env.APP_PIN
    if (!appPin) {
      console.error('APP_PIN environment variable is not set')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (pin !== appPin) {
      return NextResponse.json(
        { success: false, error: 'Nesprávny PIN' },
        { status: 401 }
      )
    }

    const maxAge = parseInt(process.env.PIN_COOKIE_MAX_AGE || '2592000', 10)

    const response = NextResponse.json({ success: true })
    response.cookies.set('pin_verified', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}

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

    const response = NextResponse.json({ success: true })

    // Session cookie - bez maxAge sa vymaže pri zatvorení prehliadača
    response.cookies.set('pin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
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

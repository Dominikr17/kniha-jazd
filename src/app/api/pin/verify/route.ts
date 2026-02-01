import { NextRequest, NextResponse } from 'next/server'

// In-memory rate limiting (v produkcii použiť Redis)
const rateLimitMap = new Map<string, { attempts: number; blockedUntil: number }>()

const MAX_ATTEMPTS = 5
const BLOCK_DURATION_MS = 15 * 60 * 1000 // 15 minút

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; blockedUntil?: number } {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  // Ak je IP blokovaná
  if (record.blockedUntil > now) {
    return { allowed: false, remainingAttempts: 0, blockedUntil: record.blockedUntil }
  }

  // Reset ak prešlo okno
  if (record.blockedUntil < now && record.attempts >= MAX_ATTEMPTS) {
    rateLimitMap.delete(ip)
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS }
  }

  return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.attempts }
}

function recordFailedAttempt(ip: string): void {
  const now = Date.now()
  const record = rateLimitMap.get(ip)

  if (!record) {
    rateLimitMap.set(ip, { attempts: 1, blockedUntil: 0 })
    return
  }

  record.attempts++

  if (record.attempts >= MAX_ATTEMPTS) {
    record.blockedUntil = now + BLOCK_DURATION_MS
  }

  rateLimitMap.set(ip, record)
}

function clearAttempts(ip: string): void {
  rateLimitMap.delete(ip)
}

export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request)

  // Kontrola rate limit
  const rateLimit = checkRateLimit(clientIp)
  if (!rateLimit.allowed) {
    const remainingSeconds = Math.ceil((rateLimit.blockedUntil! - Date.now()) / 1000)
    return NextResponse.json(
      {
        success: false,
        error: `Príliš veľa pokusov. Skúste znova za ${Math.ceil(remainingSeconds / 60)} minút.`
      },
      { status: 429 }
    )
  }

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
      recordFailedAttempt(clientIp)
      const remaining = MAX_ATTEMPTS - (rateLimitMap.get(clientIp)?.attempts || 0)

      return NextResponse.json(
        {
          success: false,
          error: remaining > 0
            ? `Nesprávny PIN. Zostáva ${remaining} pokusov.`
            : 'Nesprávny PIN. Účet je dočasne zablokovaný.'
        },
        { status: 401 }
      )
    }

    // Úspešné prihlásenie - vyčistiť pokusy
    clearAttempts(clientIp)

    const response = NextResponse.json({ success: true })

    response.cookies.set('pin_session', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // 8 hodín
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    )
  }
}

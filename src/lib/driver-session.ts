import { cookies } from 'next/headers'
import crypto from 'crypto'

const DRIVER_COOKIE_NAME = 'driver_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 dní

// Secret pre podpisovanie - vyžaduje sa vždy
function getSecret(): string {
  const secret = process.env.DRIVER_SESSION_SECRET
  if (!secret) {
    throw new Error('DRIVER_SESSION_SECRET nie je nastavený. Pridajte ho do .env.local')
  }
  return secret
}

// Vytvorenie HMAC podpisu
function createSignature(data: string): string {
  return crypto
    .createHmac('sha256', getSecret())
    .update(data)
    .digest('hex')
}

// Overenie podpisu
function verifySignature(data: string, signature: string): boolean {
  const expectedSignature = createSignature(data)
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

// Vytvorenie podpísaného tokenu
function createToken(driverId: string, driverName: string): string {
  const payload = JSON.stringify({ id: driverId, name: driverName })
  const encoded = Buffer.from(payload).toString('base64url')
  const signature = createSignature(encoded)
  return `${encoded}.${signature}`
}

// Parsovanie a overenie tokenu
function parseToken(token: string): { id: string; name: string } | null {
  try {
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature) return null

    // Overiť podpis
    if (!verifySignature(encoded, signature)) {
      console.warn('Invalid driver session signature')
      return null
    }

    // Dekódovať payload
    const payload = Buffer.from(encoded, 'base64url').toString('utf-8')
    const data = JSON.parse(payload)

    if (!data.id || typeof data.id !== 'string') return null

    return { id: data.id, name: data.name || '' }
  } catch {
    return null
  }
}

// Server-side: získanie driver ID z cookie
export async function getDriverId(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(DRIVER_COOKIE_NAME)?.value
  if (!token) return null

  const data = parseToken(token)
  return data?.id ?? null
}

// Server-side: získanie mena vodiča z cookie
export async function getDriverName(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(DRIVER_COOKIE_NAME)?.value
  if (!token) return null

  const data = parseToken(token)
  return data?.name ?? null
}

// Server-side: získanie celej driver session
export async function getDriverSession(): Promise<{ id: string; name: string } | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(DRIVER_COOKIE_NAME)?.value
  if (!token) return null

  return parseToken(token)
}

// Server-side: nastavenie driver cookie
export async function setDriverCookie(driverId: string, driverName: string) {
  const cookieStore = await cookies()
  const token = createToken(driverId, driverName)

  cookieStore.set(DRIVER_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  })
}

// Server-side: vymazanie driver cookie
export async function clearDriverCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(DRIVER_COOKIE_NAME)
}

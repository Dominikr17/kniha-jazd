import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Konfigurácia ciest
const PUBLIC_PATHS = ['/pin', '/api/pin', '/api/driver']
const ADMIN_PATHS = ['/admin', '/login', '/auth']
const DRIVER_PUBLIC_PATHS = ['/', '/vodic']

// Názov session cookie
const PIN_SESSION_COOKIE = 'pin_session'

function isStaticFile(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  )
}

function matchesPathPrefix(pathname: string, paths: string[]): boolean {
  return paths.some(path => pathname.startsWith(path))
}

function matchesExactPath(pathname: string, paths: string[]): boolean {
  return paths.includes(pathname)
}

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

function isAllowedIp(clientIp: string): boolean {
  const allowedIps = process.env.ALLOWED_IPS || ''
  if (!allowedIps) return false
  const ipList = allowedIps.split(',').map(entry => entry.trim())
  return ipList.includes(clientIp)
}

function hasPinSession(request: NextRequest): boolean {
  const cookie = request.cookies.get(PIN_SESSION_COOKIE)
  return cookie?.value === 'true'
}

function redirectToPin(request: NextRequest, pathname: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/pin'
  url.searchParams.set('redirect', pathname)
  return NextResponse.redirect(url)
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Statické súbory - povoliť
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }

  // Verejné cesty (PIN stránka, API) - povoliť
  if (matchesPathPrefix(pathname, PUBLIC_PATHS)) {
    return NextResponse.next()
  }

  // Admin cesty - delegovať na Supabase Auth
  if (matchesPathPrefix(pathname, ADMIN_PATHS)) {
    return await updateSession(request)
  }

  // Verejné vodičovské cesty (hlavná stránka, výber vodiča) - povoliť
  if (matchesExactPath(pathname, DRIVER_PUBLIC_PATHS)) {
    return NextResponse.next()
  }

  // Vodičovská sekcia - kontrola IP alebo PIN session
  const clientIp = getClientIp(request)

  if (isAllowedIp(clientIp) || hasPinSession(request)) {
    return NextResponse.next()
  }

  return redirectToPin(request, pathname)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

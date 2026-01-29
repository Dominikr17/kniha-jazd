import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Cesty, ktoré nevyžadujú IP/PIN kontrolu
const PIN_PUBLIC_PATHS = ['/pin', '/api/pin', '/api/driver']

// Cesty, ktoré vyžadujú Supabase Auth (admin sekcia)
const ADMIN_PATHS = ['/admin', '/login', '/auth']

// Verejné cesty pre vodičov (hlavná stránka, výber vodiča)
const DRIVER_PUBLIC_PATHS = ['/', '/vodic']

function isStaticFile(pathname: string): boolean {
  return (
    pathname.startsWith('/_next/static') ||
    pathname.startsWith('/_next/image') ||
    pathname === '/favicon.ico' ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico)$/.test(pathname)
  )
}

function isPinPublicPath(pathname: string): boolean {
  return PIN_PUBLIC_PATHS.some(path => pathname.startsWith(path))
}

function isAdminPath(pathname: string): boolean {
  return ADMIN_PATHS.some(path => pathname.startsWith(path))
}

function isDriverPublicPath(pathname: string): boolean {
  // Presná zhoda pre / a /vodic
  return pathname === '/' || pathname === '/vodic'
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

function isAllowedIp(ip: string): boolean {
  const allowedIps = process.env.ALLOWED_IPS || ''
  if (!allowedIps) return false
  const ipList = allowedIps.split(',').map(ip => ip.trim())
  return ipList.includes(ip)
}

function hasPinSession(request: NextRequest): boolean {
  const sessionCookie = request.cookies.get('pin_session')
  return sessionCookie?.value === 'true'
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Statické súbory - povoliť
  if (isStaticFile(pathname)) {
    return NextResponse.next()
  }

  // PIN stránka a API - povoliť bez kontroly
  if (isPinPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Admin cesty - delegovať na Supabase Auth
  if (isAdminPath(pathname)) {
    return await updateSession(request)
  }

  // Verejné vodičovské cesty (hlavná stránka, výber vodiča) - povoliť
  if (isDriverPublicPath(pathname)) {
    return NextResponse.next()
  }

  // Vodičovská sekcia (/vodic/jazdy, /vodic/phm, ...) - kontrola IP + PIN
  const clientIp = getClientIp(request)

  // Povolená IP - priamy prístup
  if (isAllowedIp(clientIp)) {
    return NextResponse.next()
  }

  // PIN session cookie - povolený prístup (platí do zatvorenia prehliadača)
  if (hasPinSession(request)) {
    return NextResponse.next()
  }

  // Presmerovať na PIN stránku
  const url = request.nextUrl.clone()
  url.pathname = '/pin'
  url.searchParams.set('redirect', pathname)
  return NextResponse.redirect(url)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

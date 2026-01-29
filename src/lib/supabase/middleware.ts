import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Verejné cesty, ktoré nevyžadujú prihlásenie
const publicPaths = ['/', '/vodic', '/login', '/auth', '/pin', '/api/pin']

function isPublicPath(pathname: string): boolean {
  // Presná zhoda pre root
  if (pathname === '/') return true

  // Cesty začínajúce s /vodic, /login, /auth
  for (const path of publicPaths) {
    if (path !== '/' && pathname.startsWith(path)) {
      return true
    }
  }

  // API routes pre vodičov
  if (pathname.startsWith('/api/driver')) {
    return true
  }

  return false
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // Verejné cesty - nepotrebujú autentifikáciu
  if (isPublicPath(pathname)) {
    // Ale ak je prihlásený admin na /login, presmeruj na /admin
    if (pathname.startsWith('/login')) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const url = request.nextUrl.clone()
        url.pathname = '/admin'
        return NextResponse.redirect(url)
      }
    }
    return supabaseResponse
  }

  // Chránené cesty - vyžadujú prihlásenie (admin stránky)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

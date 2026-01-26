import { cookies } from 'next/headers'

const DRIVER_COOKIE_NAME = 'driver_id'
const DRIVER_NAME_COOKIE = 'driver_name'

// Server-side: získanie driver ID z cookie
export async function getDriverId(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(DRIVER_COOKIE_NAME)?.value ?? null
}

// Server-side: získanie mena vodiča z cookie
export async function getDriverName(): Promise<string | null> {
  const cookieStore = await cookies()
  const name = cookieStore.get(DRIVER_NAME_COOKIE)?.value
  return name ? decodeURIComponent(name) : null
}

// Server-side: nastavenie driver cookie
export async function setDriverCookie(driverId: string, driverName: string) {
  const cookieStore = await cookies()

  cookieStore.set(DRIVER_COOKIE_NAME, driverId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 dní
    path: '/',
  })

  cookieStore.set(DRIVER_NAME_COOKIE, encodeURIComponent(driverName), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  })
}

// Server-side: vymazanie driver cookie
export async function clearDriverCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(DRIVER_COOKIE_NAME)
  cookieStore.delete(DRIVER_NAME_COOKIE)
}

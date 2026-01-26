import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getDriverId, getDriverName } from '@/lib/driver-session'
import { Button } from '@/components/ui/button'
import { Toaster } from '@/components/ui/sonner'
import { Route, Fuel, LogOut, Home } from 'lucide-react'

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const driverId = await getDriverId()
  const driverName = await getDriverName()

  // Ak nie je vodič vybraný a nie sme na výbere vodiča, presmeruj
  if (!driverId) {
    redirect('/vodic')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/vodic/jazdy" className="flex items-center gap-2">
              <img
                src="/logo.svg"
                alt="ZVL SLOVAKIA"
                className="h-8 w-auto"
              />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {driverName}
            </span>
            <form action="/api/driver/logout" method="POST">
              <Button variant="ghost" size="sm" type="submit">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Zmeniť vodiča</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container px-4 py-6">
        {children}
      </main>

      {/* Bottom navigation for mobile */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background sm:hidden">
        <div className="grid grid-cols-3 gap-1 p-2">
          <Link
            href="/vodic/jazdy"
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted"
          >
            <Route className="h-5 w-5" />
            <span className="text-xs">Jazdy</span>
          </Link>
          <Link
            href="/vodic/jazdy/nova"
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted"
          >
            <Home className="h-5 w-5" />
            <span className="text-xs">Nová jazda</span>
          </Link>
          <Link
            href="/vodic/phm/nova"
            className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-muted"
          >
            <Fuel className="h-5 w-5" />
            <span className="text-xs">Tankovanie</span>
          </Link>
        </div>
      </nav>

      <Toaster />
    </div>
  )
}

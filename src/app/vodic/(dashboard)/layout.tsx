import { redirect } from 'next/navigation'
import { getDriverId, getDriverName } from '@/lib/driver-session'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { DriverSidebar } from '@/components/layout/driver-sidebar'
import { Toaster } from '@/components/ui/sonner'

export default async function DriverLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const driverId = await getDriverId()
  const driverName = await getDriverName()

  // Ak nie je vodič vybraný, presmeruj na výber vodiča
  if (!driverId) {
    redirect('/vodic')
  }

  return (
    <SidebarProvider>
      <DriverSidebar driverName={driverName} />
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:hidden">
          <SidebarTrigger />
          <span className="font-semibold">Kniha jázd</span>
        </header>
        <main className="flex-1 p-4 md:p-6 pb-20 sm:pb-6">
          {children}
        </main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}

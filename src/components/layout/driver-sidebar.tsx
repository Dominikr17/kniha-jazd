'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Car, Route, Fuel, BarChart3, Briefcase, LogOut, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 12) return 'Dobré ráno'
  if (hour >= 12 && hour < 18) return 'Dobrý deň'
  if (hour >= 18 && hour < 22) return 'Dobrý večer'
  return 'Dobrý večer'
}

function getFirstName(name: string): string {
  const parts = name.trim().split(/\s+/)
  return parts[0]
}

interface MenuItem {
  title: string
  href: string
  icon: LucideIcon
}

const DRIVER_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Moje jazdy',
    href: '/vodic/jazdy',
    icon: Route,
  },
  {
    title: 'Moje tankovania',
    href: '/vodic/phm',
    icon: Fuel,
  },
  {
    title: 'Moje služobné cesty',
    href: '/vodic/sluzobne-cesty',
    icon: Briefcase,
  },
  {
    title: 'Moje vozidlá',
    href: '/vodic/vozidla',
    icon: Car,
  },
  {
    title: 'Moje štatistiky',
    href: '/vodic/statistiky',
    icon: BarChart3,
  },
]

function DriverMenuItems() {
  const currentPath = usePathname()
  const { setOpenMobile } = useSidebar()

  return (
    <SidebarMenu className="gap-2 px-2">
      {DRIVER_MENU_ITEMS.map((menuItem) => {
        const isActive = currentPath.startsWith(menuItem.href)
        return (
          <SidebarMenuItem key={menuItem.href}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className={cn(
                'rounded-xl px-4 py-3 transition-all duration-200 ease-out',
                'hover:scale-[1.02] active:scale-[0.98]',
                isActive && [
                  'bg-gradient-to-r from-[#FFC72C]/25 to-[#FFC72C]/10',
                  'border border-[#FFC72C]/40',
                  'shadow-sm',
                  'font-medium',
                ],
                !isActive && 'hover:bg-gray-50/80'
              )}
            >
              <Link
                href={menuItem.href}
                className="flex items-center gap-3"
                onClick={() => setOpenMobile(false)}
              >
                <menuItem.icon
                  className={cn(
                    'h-5 w-5 transition-colors duration-200',
                    isActive ? 'text-[#004B87]' : 'text-gray-500'
                  )}
                />
                <span
                  className={cn(
                    'transition-colors duration-200',
                    isActive ? 'text-[#004B87]' : 'text-gray-700'
                  )}
                >
                  {menuItem.title}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}

interface DriverSidebarProps {
  driverName: string | null
}

export function DriverSidebar({ driverName }: DriverSidebarProps) {
  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/vodic/jazdy" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="ZVL SLOVAKIA"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
        {driverName && (
          <p className="mt-2 text-sm text-muted-foreground">
            {getGreeting()}, {getFirstName(driverName)}
          </p>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <DriverMenuItems />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <form action="/api/driver/logout" method="POST">
          <Button
            variant="ghost"
            className="w-full justify-start"
            type="submit"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Odhlásiť sa
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  )
}

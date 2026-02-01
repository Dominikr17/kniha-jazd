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
} from '@/components/ui/sidebar'
import { Car, Route, Fuel, BarChart3, LogOut, LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MenuItem {
  title: string
  href: string
  icon: LucideIcon
}

const DRIVER_MENU_ITEMS: MenuItem[] = [
  {
    title: 'Moje vozidlá',
    href: '/vodic/vozidla',
    icon: Car,
  },
  {
    title: 'Moje jazdy',
    href: '/vodic/jazdy',
    icon: Route,
  },
  {
    title: 'Tankovanie PHM',
    href: '/vodic/phm',
    icon: Fuel,
  },
  {
    title: 'Moje štatistiky',
    href: '/vodic/statistiky',
    icon: BarChart3,
  },
]

interface DriverSidebarProps {
  driverName: string | null
}

export function DriverSidebar({ driverName }: DriverSidebarProps) {
  const currentPath = usePathname()

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
          <p className="mt-2 text-sm text-muted-foreground">{driverName}</p>
        )}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {DRIVER_MENU_ITEMS.map((menuItem) => (
                <SidebarMenuItem key={menuItem.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={currentPath.startsWith(menuItem.href)}
                  >
                    <Link href={menuItem.href}>
                      <menuItem.icon className="h-4 w-4" />
                      <span>{menuItem.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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

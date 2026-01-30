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
import {
  Car,
  Users,
  Route,
  Fuel,
  LayoutDashboard,
  FileText,
  LogOut,
  ClipboardList,
  FileSpreadsheet
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Vozidlá',
    href: '/admin/vozidla',
    icon: Car,
  },
  {
    title: 'Vodiči',
    href: '/admin/vodici',
    icon: Users,
  },
  {
    title: 'Kniha jázd',
    href: '/admin/jazdy',
    icon: Route,
  },
  {
    title: 'Tankovanie PHM',
    href: '/admin/phm',
    icon: Fuel,
  },
  {
    title: 'Mesačné výkazy',
    href: '/admin/vykazy',
    icon: FileSpreadsheet,
  },
  {
    title: 'Reporty',
    href: '/admin/reporty',
    icon: FileText,
  },
  {
    title: 'Žurnál',
    href: '/admin/zurnal',
    icon: ClipboardList,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/admin" className="flex items-center">
          <Image
            src="/logo.svg"
            alt="ZVL SLOVAKIA"
            width={120}
            height={40}
            className="h-10 w-auto"
          />
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      item.href === '/admin'
                        ? pathname === '/admin'
                        : pathname.startsWith(item.href)
                    }
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Odhlásiť sa
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

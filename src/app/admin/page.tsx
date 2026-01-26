import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, Users, Route, Fuel, AlertTriangle, Shield, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { differenceInDays, parseISO, format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { VIGNETTE_COUNTRIES } from '@/types'

interface Alert {
  type: 'stk' | 'ek' | 'vignette'
  vehicleId: string
  vehicleName: string
  licensePlate: string
  validUntil: string
  daysLeft: number
  country?: string
}

export default async function DashboardPage() {
  const supabase = await createClient()

  // Načítanie štatistík a upozornení
  const [
    { count: vehiclesCount },
    { count: driversCount },
    { count: tripsCount },
    { count: fuelCount },
    { data: inspections },
    { data: vignettes },
  ] = await Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('*', { count: 'exact', head: true }),
    supabase.from('fuel_records').select('*', { count: 'exact', head: true }),
    supabase
      .from('vehicle_inspections')
      .select('*, vehicle:vehicles(id, name, license_plate)')
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('valid_until', { ascending: true }),
    supabase
      .from('vehicle_vignettes')
      .select('*, vehicle:vehicles(id, name, license_plate)')
      .gte('valid_until', new Date().toISOString().split('T')[0])
      .order('valid_until', { ascending: true }),
  ])

  const stats = [
    {
      title: 'Vozidlá',
      value: vehiclesCount ?? 0,
      icon: Car,
      href: '/admin/vozidla',
      color: 'text-blue-600',
    },
    {
      title: 'Vodiči',
      value: driversCount ?? 0,
      icon: Users,
      href: '/admin/vodici',
      color: 'text-green-600',
    },
    {
      title: 'Jazdy',
      value: tripsCount ?? 0,
      icon: Route,
      href: '/admin/jazdy',
      color: 'text-purple-600',
    },
    {
      title: 'Tankovania',
      value: fuelCount ?? 0,
      icon: Fuel,
      href: '/admin/phm',
      color: 'text-orange-600',
    },
  ]

  // Spracovanie upozornení
  const alerts: Alert[] = []

  // STK a EK kontroly
  inspections?.forEach((inspection: any) => {
    const daysLeft = differenceInDays(parseISO(inspection.valid_until), new Date())
    if (daysLeft <= 30) {
      alerts.push({
        type: inspection.inspection_type,
        vehicleId: inspection.vehicle?.id,
        vehicleName: inspection.vehicle?.name || 'Neznáme',
        licensePlate: inspection.vehicle?.license_plate || '',
        validUntil: inspection.valid_until,
        daysLeft,
      })
    }
  })

  // Diaľničné známky
  vignettes?.forEach((vignette: any) => {
    const daysLeft = differenceInDays(parseISO(vignette.valid_until), new Date())
    if (daysLeft <= 30) {
      alerts.push({
        type: 'vignette',
        vehicleId: vignette.vehicle?.id,
        vehicleName: vignette.vehicle?.name || 'Neznáme',
        licensePlate: vignette.vehicle?.license_plate || '',
        validUntil: vignette.valid_until,
        daysLeft,
        country: vignette.country,
      })
    }
  })

  // Zoradenie podľa počtu dní
  alerts.sort((a, b) => a.daysLeft - b.daysLeft)

  const getAlertBadge = (daysLeft: number) => {
    if (daysLeft <= 7) {
      return <Badge variant="destructive">{daysLeft} dní</Badge>
    }
    return <Badge className="bg-orange-500">{daysLeft} dní</Badge>
  }

  const getAlertIcon = (type: string) => {
    if (type === 'vignette') {
      return <CreditCard className="h-4 w-4" />
    }
    return <Shield className="h-4 w-4" />
  }

  const getAlertLabel = (alert: Alert) => {
    if (alert.type === 'stk') return 'STK'
    if (alert.type === 'ek') return 'EK'
    if (alert.type === 'vignette' && alert.country) {
      return `Známka ${VIGNETTE_COUNTRIES[alert.country as keyof typeof VIGNETTE_COUNTRIES]}`
    }
    return 'Diaľničná známka'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Prehľad vozidlového parku ZVL SLOVAKIA
        </p>
      </div>

      {/* Štatistiky */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Rýchle akcie */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Rýchle akcie</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/admin/jazdy/nova">
              <Route className="mr-2 h-4 w-4" />
              Nová jazda
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/phm/nova">
              <Fuel className="mr-2 h-4 w-4" />
              Nové tankovanie
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/vozidla/nove">
              <Car className="mr-2 h-4 w-4" />
              Nové vozidlo
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/vodici/novy">
              <Users className="mr-2 h-4 w-4" />
              Nový vodič
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Upozornenia */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Blížiace sa termíny
            {alerts.length > 0 && (
              <Badge variant="destructive">{alerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Žiadne blížiace sa termíny STK, EK alebo diaľničných známok v nasledujúcich 30 dňoch.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Link
                  key={`${alert.type}-${alert.vehicleId}-${index}`}
                  href={`/admin/vozidla/${alert.vehicleId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${alert.daysLeft <= 7 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                      {getAlertIcon(alert.type)}
                    </div>
                    <div>
                      <div className="font-medium">
                        {alert.vehicleName} ({alert.licensePlate})
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {getAlertLabel(alert)} - platnosť do {format(parseISO(alert.validUntil), 'd.M.yyyy', { locale: sk })}
                      </div>
                    </div>
                  </div>
                  {getAlertBadge(alert.daysLeft)}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

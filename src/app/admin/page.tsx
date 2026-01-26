import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, Users, Route, Fuel, AlertTriangle, Shield, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { differenceInDays, parseISO, format, startOfWeek, startOfMonth, startOfYear } from 'date-fns'
import { sk } from 'date-fns/locale'
import { VIGNETTE_COUNTRIES } from '@/types'
import { PeriodFilter } from './period-filter'

interface Alert {
  type: 'stk' | 'ek' | 'vignette'
  vehicleId: string
  vehicleName: string
  licensePlate: string
  validUntil: string
  daysLeft: number
  country?: string
}

type Period = 'week' | 'month' | 'year'

function getStartDate(period: Period): string {
  const now = new Date()
  let start: Date

  switch (period) {
    case 'week':
      start = startOfWeek(now, { weekStartsOn: 1 }) // Pondelok
      break
    case 'month':
      start = startOfMonth(now)
      break
    case 'year':
      start = startOfYear(now)
      break
    default:
      start = startOfMonth(now)
  }

  return start.toISOString().split('T')[0]
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams
  const period = (params.period as Period) || 'month'
  const startDate = getStartDate(period)
  const supabase = await createClient()

  // Načítanie štatistík a upozornení
  const [
    { count: vehiclesCount },
    { count: driversCount },
    { count: tripsCount },
    { count: fuelCount },
    { data: inspections },
    { data: vignettes },
    { data: tripsData },
  ] = await Promise.all([
    supabase.from('vehicles').select('*', { count: 'exact', head: true }),
    supabase.from('drivers').select('*', { count: 'exact', head: true }),
    supabase.from('trips').select('*', { count: 'exact', head: true }).gte('date', startDate),
    supabase.from('fuel_records').select('*', { count: 'exact', head: true }).gte('date', startDate),
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
    supabase
      .from('trips')
      .select('distance')
      .gte('date', startDate)
      .not('distance', 'is', null),
  ])

  // Celkové najazdené km za obdobie
  const totalDistance = tripsData?.reduce((sum, trip) => sum + (trip.distance || 0), 0) ?? 0

  const stats = [
    {
      title: 'Vozidlá',
      value: vehiclesCount ?? 0,
      icon: Car,
      href: '/admin/vozidla',
      color: 'text-blue-600',
      showPeriod: false,
    },
    {
      title: 'Vodiči',
      value: driversCount ?? 0,
      icon: Users,
      href: '/admin/vodici',
      color: 'text-green-600',
      showPeriod: false,
    },
    {
      title: 'Jazdy',
      value: tripsCount ?? 0,
      icon: Route,
      href: '/admin/jazdy',
      color: 'text-purple-600',
      showPeriod: true,
    },
    {
      title: 'Tankovania',
      value: fuelCount ?? 0,
      icon: Fuel,
      href: '/admin/phm',
      color: 'text-orange-600',
      showPeriod: true,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Prehľad vozového parku ZVL SLOVAKIA
          </p>
        </div>
        <PeriodFilter currentPeriod={period} />
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
                {stat.showPeriod && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {period === 'week' && 'tento týždeň'}
                    {period === 'month' && 'tento mesiac'}
                    {period === 'year' && 'tento rok'}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Najazdené km */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Najazdené kilometre</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{totalDistance.toLocaleString('sk')} km</div>
          <p className="text-sm text-muted-foreground">
            {period === 'week' && 'tento týždeň'}
            {period === 'month' && 'tento mesiac'}
            {period === 'year' && 'tento rok'}
          </p>
        </CardContent>
      </Card>

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

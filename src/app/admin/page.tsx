import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Car, Users, Route, Fuel, AlertTriangle, Gauge } from 'lucide-react'
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
      .order('valid_until', { ascending: true }),
    supabase
      .from('vehicle_vignettes')
      .select('*, vehicle:vehicles(id, name, license_plate)')
      .order('valid_until', { ascending: true }),
    supabase
      .from('trips')
      .select('distance, driver_id, vehicle_id')
      .gte('date', startDate),
  ])

  // Počet aktívnych vodičov a vozidiel za obdobie
  const activeDriverIds = new Set(tripsData?.map(t => t.driver_id).filter(Boolean))
  const activeVehicleIds = new Set(tripsData?.map(t => t.vehicle_id).filter(Boolean))
  const activeDriversCount = activeDriverIds.size
  const activeVehiclesCount = activeVehicleIds.size

  // Celkové najazdené km za obdobie
  const totalDistance = tripsData?.reduce((sum, trip) => sum + (trip.distance || 0), 0) ?? 0

  const periodLabel = {
    week: 'tento týždeň',
    month: 'tento mesiac',
    year: 'tento rok',
  }[period]

  const stats = [
    {
      title: 'Vozidlá',
      value: activeVehiclesCount,
      total: vehiclesCount ?? 0,
      icon: Car,
      href: '/admin/vozidla',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      showPeriod: true,
    },
    {
      title: 'Vodiči',
      value: activeDriversCount,
      total: driversCount ?? 0,
      icon: Users,
      href: '/admin/vodici',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      showPeriod: true,
    },
    {
      title: 'Jazdy',
      value: tripsCount ?? 0,
      icon: Route,
      href: '/admin/jazdy',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      showPeriod: true,
    },
    {
      title: 'Tankovania',
      value: fuelCount ?? 0,
      icon: Fuel,
      href: '/admin/phm',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      showPeriod: true,
    },
    {
      title: 'Najazdené km',
      value: totalDistance.toLocaleString('sk'),
      icon: Gauge,
      href: '/admin/jazdy',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      showPeriod: true,
    },
  ] as const

  // Spracovanie upozornení
  const alerts: Alert[] = []

  // STK a EK kontroly
  inspections?.forEach((inspection: any) => {
    const daysLeft = differenceInDays(parseISO(inspection.valid_until), new Date())
    // Zobrazí vypršané (do -30 dní) a blížiace sa (do +30 dní)
    if (daysLeft <= 30 && daysLeft >= -30) {
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
    // Zobrazí vypršané (do -30 dní) a blížiace sa (do +30 dní)
    if (daysLeft <= 30 && daysLeft >= -30) {
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
    if (daysLeft < 0) {
      return <Badge variant="destructive">Vypršané</Badge>
    }
    if (daysLeft === 0) {
      return <Badge variant="destructive">Dnes</Badge>
    }
    if (daysLeft <= 7) {
      return <Badge variant="destructive">{daysLeft} dní</Badge>
    }
    return <Badge className="bg-orange-500">{daysLeft} dní</Badge>
  }

  const getAlertLabel = (alert: Alert) => {
    if (alert.type === 'stk') return 'STK'
    if (alert.type === 'ek') return 'EK'
    if (alert.type === 'vignette' && alert.country) {
      return `Diaľničná známka ${VIGNETTE_COUNTRIES[alert.country as keyof typeof VIGNETTE_COUNTRIES]}`
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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
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
            Termíny a upozornenia
            {alerts.length > 0 && (
              <Badge variant="destructive">{alerts.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Žiadne vypršané ani blížiace sa termíny STK, EK alebo diaľničných známok.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert, index) => (
                <Link
                  key={`${alert.type}-${alert.vehicleId}-${index}`}
                  href={`/admin/vozidla/${alert.vehicleId}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <div className="font-medium">
                      {alert.vehicleName} ({alert.licensePlate})
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {getAlertLabel(alert)} - platnosť do {format(parseISO(alert.validUntil), 'd.M.yyyy', { locale: sk })}
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

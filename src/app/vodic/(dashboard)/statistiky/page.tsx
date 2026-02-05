import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDriverSession } from '@/lib/driver-session'
import {
  getDriverStats,
  getMonthlyKm,
  getConsumptionByVehicle,
  getRecentTrips,
  isValidPeriod,
  StatsPeriod
} from '@/lib/driver-stats'
import { PeriodFilter } from './components/period-filter'
import { StatsCards } from './components/stats-cards'
import { KmChart } from './components/km-chart'
import { ConsumptionByVehicle } from './components/consumption-by-vehicle'
import { RecentTrips } from './components/recent-trips'

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function StatistikyPage({ searchParams }: PageProps) {
  const supabase = await createClient()
  const driverInfo = await getDriverSession()

  if (!driverInfo) {
    redirect('/')
  }

  const params = await searchParams
  const periodParam = typeof params.period === 'string' ? params.period : null
  const period: StatsPeriod = isValidPeriod(periodParam) ? periodParam : 'this_month'

  // Načítaj všetky dáta paralelne
  const [stats, monthlyKm, consumptionByVehicle, recentTrips] = await Promise.all([
    getDriverStats(supabase, driverInfo.id, period),
    getMonthlyKm(supabase, driverInfo.id, period),
    getConsumptionByVehicle(supabase, driverInfo.id, period),
    getRecentTrips(supabase, driverInfo.id, 5),
  ])

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">Moje štatistiky</h1>
        <PeriodFilter currentPeriod={period} />
      </div>

      <StatsCards stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <KmChart data={monthlyKm} />
        <ConsumptionByVehicle data={consumptionByVehicle} />
      </div>

      <RecentTrips trips={recentTrips} />
    </div>
  )
}

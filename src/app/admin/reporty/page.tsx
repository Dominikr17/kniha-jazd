import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Car, TrendingUp, Fuel, DollarSign, Users } from 'lucide-react'
import { VehicleComparison } from './vehicle-comparison'
import { MonthlyOverview } from './monthly-overview'
import { FuelConsumption } from './fuel-consumption'
import { FilterPanel } from './components/filter-panel'
import { CostsTab } from './components/costs-tab'
import { DriversTab } from './components/drivers-tab'
import {
  getDateRangeFromPeriod,
  isValidPeriod,
  isValidUUID,
  type PeriodType,
} from '@/lib/report-utils'
import { aggregateVehicleStats } from '@/lib/report-calculations'
import { getLocalDateString } from '@/lib/utils'
import { Vehicle, Trip, FuelRecord, Driver } from '@/types'

interface ReportsPageProps {
  searchParams: Promise<{
    period?: string
    vehicle?: string
    driver?: string
    from?: string
    to?: string
  }>
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Validácia a spracovanie filtrov pred dotazmi
  const period: PeriodType = params.period && isValidPeriod(params.period) ? params.period : 'all'
  const vehicleFilter = params.vehicle && isValidUUID(params.vehicle) ? params.vehicle : null
  const driverFilter = params.driver && isValidUUID(params.driver) ? params.driver : null
  const dateRange = getDateRangeFromPeriod(period, params.from, params.to)

  // Filtrovanie priamo v Supabase namiesto načítania všetkých dát do pamäte
  let tripsQuery = supabase.from('trips').select('*')
  let fuelQuery = supabase.from('fuel_records').select('*')

  if (dateRange) {
    const fromStr = getLocalDateString(dateRange.from)
    const toStr = getLocalDateString(dateRange.to)
    tripsQuery = tripsQuery.gte('date', fromStr).lte('date', toStr)
    fuelQuery = fuelQuery.gte('date', fromStr).lte('date', toStr)
  }
  if (vehicleFilter) {
    tripsQuery = tripsQuery.eq('vehicle_id', vehicleFilter)
    fuelQuery = fuelQuery.eq('vehicle_id', vehicleFilter)
  }
  if (driverFilter) {
    tripsQuery = tripsQuery.eq('driver_id', driverFilter)
    fuelQuery = fuelQuery.eq('driver_id', driverFilter)
  }

  const [
    { data: vehicles },
    { data: trips },
    { data: fuelRecords },
    { data: drivers },
  ] = await Promise.all([
    supabase.from('vehicles').select('id, name, license_plate, rated_consumption, tank_capacity').order('name'),
    tripsQuery,
    fuelQuery,
    supabase.from('drivers').select('id, first_name, last_name, position').order('last_name'),
  ])

  const filteredTrips = (trips || []) as Trip[]
  const filteredFuelRecords = (fuelRecords || []) as FuelRecord[]

  // Agregované štatistiky vozidiel
  const vehicleStats = (vehicles || []).map((vehicle) =>
    aggregateVehicleStats(vehicle as Vehicle, filteredTrips, filteredFuelRecords)
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporty</h1>
        <p className="text-muted-foreground">Analýza a prehľad vozového parku</p>
      </div>

      {/* Filter panel */}
      <FilterPanel
        vehicles={(vehicles || []) as Vehicle[]}
        drivers={(drivers || []) as Driver[]}
      />

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="comparison" className="gap-2">
            <Car className="h-4 w-4 hidden sm:inline" />
            <span className="hidden sm:inline">Porovnanie vozidiel</span>
            <span className="sm:hidden">Vozidlá</span>
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <TrendingUp className="h-4 w-4 hidden sm:inline" />
            <span className="hidden sm:inline">Mesačný prehľad</span>
            <span className="sm:hidden">Mesiac</span>
          </TabsTrigger>
          <TabsTrigger value="fuel" className="gap-2">
            <Fuel className="h-4 w-4 hidden sm:inline" />
            <span className="hidden sm:inline">Spotreba paliva</span>
            <span className="sm:hidden">Spotreba</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-2">
            <DollarSign className="h-4 w-4 hidden sm:inline" />
            <span className="hidden sm:inline">Náklady</span>
            <span className="sm:hidden">Náklady</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="gap-2">
            <Users className="h-4 w-4 hidden sm:inline" />
            <span className="hidden sm:inline">Vodiči</span>
            <span className="sm:hidden">Vodiči</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <VehicleComparison
            vehicles={(vehicles || []) as Vehicle[]}
            vehicleStats={vehicleStats}
          />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyOverview
            trips={filteredTrips}
            fuelRecords={filteredFuelRecords}
            dateRange={dateRange}
          />
        </TabsContent>

        <TabsContent value="fuel">
          <FuelConsumption
            vehicles={(vehicles || []) as Vehicle[]}
            fuelRecords={filteredFuelRecords}
          />
        </TabsContent>

        <TabsContent value="costs">
          <CostsTab
            trips={filteredTrips}
            fuelRecords={filteredFuelRecords}
            vehicleStats={vehicleStats}
          />
        </TabsContent>

        <TabsContent value="drivers">
          <DriversTab
            drivers={(drivers || []) as Driver[]}
            vehicles={(vehicles || []) as Vehicle[]}
            trips={filteredTrips}
            fuelRecords={filteredFuelRecords}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, TrendingUp, Car, Fuel } from 'lucide-react'
import { VehicleComparison } from './vehicle-comparison'
import { MonthlyOverview } from './monthly-overview'
import { FuelConsumption } from './fuel-consumption'

export default async function ReportsPage() {
  const supabase = await createClient()

  // Načítanie všetkých potrebných dát pre reporty
  const [
    { data: vehicles },
    { data: trips },
    { data: fuelRecords },
  ] = await Promise.all([
    supabase.from('vehicles').select('id, name, license_plate').order('name'),
    supabase.from('trips').select('*'),
    supabase.from('fuel_records').select('*'),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Reporty</h1>
        <p className="text-muted-foreground">Analýza a prehľad vozidlového parku</p>
      </div>

      <Tabs defaultValue="comparison" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison" className="gap-2">
            <Car className="h-4 w-4 hidden sm:inline" />
            Porovnanie vozidiel
          </TabsTrigger>
          <TabsTrigger value="monthly" className="gap-2">
            <TrendingUp className="h-4 w-4 hidden sm:inline" />
            Mesačný prehľad
          </TabsTrigger>
          <TabsTrigger value="fuel" className="gap-2">
            <Fuel className="h-4 w-4 hidden sm:inline" />
            Spotreba paliva
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comparison">
          <VehicleComparison
            vehicles={vehicles || []}
            trips={trips || []}
            fuelRecords={fuelRecords || []}
          />
        </TabsContent>

        <TabsContent value="monthly">
          <MonthlyOverview trips={trips || []} fuelRecords={fuelRecords || []} />
        </TabsContent>

        <TabsContent value="fuel">
          <FuelConsumption
            vehicles={vehicles || []}
            fuelRecords={fuelRecords || []}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileSpreadsheet } from 'lucide-react'
import { VykazyFilter } from './vykazy-filter'
import { VykazyList } from './vykazy-list'
import { getMonthlyReports } from '@/lib/monthly-report'
import { ReportStatus } from '@/types'

interface PageProps {
  searchParams: Promise<{
    year?: string
    month?: string
    vehicleId?: string
    status?: string
  }>
}

export default async function VykazyPage({ searchParams }: PageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Načítanie vozidiel pre filter
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('id, name, license_plate')
    .order('name')

  // Aktuálny rok a mesiac ako default
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  const filters = {
    year: params.year ? parseInt(params.year) : currentYear,
    month: params.month ? parseInt(params.month) : undefined,
    vehicleId: params.vehicleId || undefined,
    status: (params.status as ReportStatus) || undefined
  }

  // Načítanie výkazov
  const reports = await getMonthlyReports(filters)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mesačné výkazy PHM</h1>
        <p className="text-muted-foreground">
          Generovanie mesačných výkazov spotreby PHM pre ekonomické oddelenie
        </p>
      </div>

      <VykazyFilter
        vehicles={vehicles || []}
        defaultYear={filters.year}
        defaultMonth={filters.month}
        defaultVehicleId={filters.vehicleId}
        defaultStatus={filters.status}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Zoznam výkazov
          </CardTitle>
        </CardHeader>
        <CardContent>
          <VykazyList
            reports={reports}
            year={filters.year}
            month={filters.month || currentMonth}
          />
        </CardContent>
      </Card>
    </div>
  )
}

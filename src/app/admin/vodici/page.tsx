import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Users } from 'lucide-react'
import { Driver } from '@/types'
import { DriversTable } from './drivers-table'

interface DriverWithCount extends Driver {
  vehicle_count: number
}

export default async function DriversPage() {
  const supabase = await createClient()

  // Načítať vodičov s počtom priradených vozidiel
  const { data: drivers, error } = await supabase
    .from('drivers')
    .select('*')
    .order('last_name', { ascending: true })

  // Načítať počty vozidiel pre každého vodiča
  const { data: vehicleCounts } = await supabase
    .from('driver_vehicles')
    .select('driver_id')

  // Spočítať vozidlá pre každého vodiča
  const countMap: Record<string, number> = {}
  vehicleCounts?.forEach((row) => {
    countMap[row.driver_id] = (countMap[row.driver_id] || 0) + 1
  })

  // Pridať počty k vodičom
  const driversWithCount: DriverWithCount[] = (drivers || []).map((driver) => ({
    ...driver,
    vehicle_count: countMap[driver.id] || 0,
  }))

  if (error) {
    console.error('Error loading drivers:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vodiči</h1>
          <p className="text-muted-foreground">Správa vodičov vozového parku</p>
        </div>
        <Button asChild>
          <Link href="/admin/vodici/novy">
            <Plus className="mr-2 h-4 w-4" />
            Pridať vodiča
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Zoznam vodičov
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DriversTable drivers={driversWithCount} />
        </CardContent>
      </Card>
    </div>
  )
}

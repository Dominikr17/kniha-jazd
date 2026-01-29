import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Users, Car } from 'lucide-react'
import { Driver } from '@/types'
import { DeleteDriverButton } from './delete-button'

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
          {driversWithCount.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Zatiaľ neboli pridaní žiadni vodiči.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/vodici/novy">Pridať prvého vodiča</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meno</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefón</TableHead>
                  <TableHead>Vozidlá</TableHead>
                  <TableHead className="w-[100px]">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driversWithCount.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">
                      {driver.first_name} {driver.last_name}
                    </TableCell>
                    <TableCell>{driver.email || '-'}</TableCell>
                    <TableCell>{driver.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={driver.vehicle_count > 0 ? 'default' : 'secondary'} className="gap-1">
                        <Car className="h-3 w-3" />
                        {driver.vehicle_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/admin/vodici/${driver.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteDriverButton id={driver.id} name={`${driver.first_name} ${driver.last_name}`} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

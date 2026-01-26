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
import { Plus, Fuel, Trash2 } from 'lucide-react'
import { FuelRecord, FUEL_TYPES } from '@/types'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { DeleteFuelButton } from './delete-button'

export default async function FuelPage() {
  const supabase = await createClient()

  const { data: fuelRecords, error } = await supabase
    .from('fuel_records')
    .select(`
      *,
      vehicle:vehicles(id, name, license_plate),
      driver:drivers(id, first_name, last_name)
    `)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error loading fuel records:', error)
  }

  // Výpočet spotreby pre každý záznam
  const recordsWithConsumption = await Promise.all(
    (fuelRecords || []).map(async (record) => {
      // Nájdeme predchádzajúce tankovanie pre toto vozidlo
      const { data: prevRecord } = await supabase
        .from('fuel_records')
        .select('odometer')
        .eq('vehicle_id', record.vehicle_id)
        .lt('date', record.date)
        .order('date', { ascending: false })
        .limit(1)
        .single()

      let consumption = null
      if (prevRecord && record.odometer > prevRecord.odometer) {
        const distance = record.odometer - prevRecord.odometer
        consumption = (record.liters / distance) * 100
      }

      return { ...record, consumption }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tankovanie PHM</h1>
          <p className="text-muted-foreground">Evidencia tankovania pohonných hmôt</p>
        </div>
        <Button asChild>
          <Link href="/admin/phm/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nové tankovanie
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fuel className="h-5 w-5" />
            Zoznam tankovaní
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!recordsWithConsumption || recordsWithConsumption.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Fuel className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Zatiaľ neboli zaznamenané žiadne tankovania.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/phm/nova">Zaznamenať tankovanie</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dátum</TableHead>
                    <TableHead className="hidden md:table-cell">Vozidlo</TableHead>
                    <TableHead>Palivo</TableHead>
                    <TableHead className="text-right">Litre</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Cena/l</TableHead>
                    <TableHead className="text-right">Suma</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">l/100km</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(recordsWithConsumption as (FuelRecord & { consumption: number | null })[]).map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {format(parseISO(record.date), 'd.M.yyyy', { locale: sk })}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div>{record.vehicle?.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {record.vehicle?.license_plate}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {FUEL_TYPES[record.fuel_type as keyof typeof FUEL_TYPES] || record.fuel_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {Number(record.liters).toFixed(2)} l
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell">
                        {Number(record.price_per_liter).toFixed(3)} EUR
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(record.total_price).toFixed(2)} EUR
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell">
                        {record.consumption !== null ? (
                          <Badge variant={record.consumption > 10 ? 'destructive' : 'secondary'}>
                            {record.consumption.toFixed(1)}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <DeleteFuelButton id={record.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

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
import { Plus, Fuel, Clock } from 'lucide-react'
import { FuelRecord, FUEL_TYPES, FUEL_COUNTRIES, PAYMENT_METHODS, FUEL_CURRENCIES, FuelCurrency } from '@/types'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { DeleteButton } from '@/components/delete-button'

export default async function FuelPage() {
  const supabase = await createClient()

  // Načítanie tankovaní a počtu čakajúcich
  const [{ data: fuelRecords, error }, { count: pendingCount }] = await Promise.all([
    supabase
      .from('fuel_records')
      .select(`
        *,
        vehicle:vehicles(id, name, license_plate),
        driver:drivers(id, first_name, last_name)
      `)
      .order('date', { ascending: false })
      .limit(1000),
    supabase
      .from('fuel_records')
      .select('*', { count: 'exact', head: true })
      .eq('eur_confirmed', false),
  ])

  if (error) {
    console.error('Error loading fuel records:', error)
  }

  // Výpočet spotreby z už načítaných dát (bez N+1 dotazov)
  const allRecords = fuelRecords || []
  const sortedAsc = [...allRecords].sort((a, b) => a.date.localeCompare(b.date))
  const prevByVehicle = new Map<string, number>()
  const consumptionMap = new Map<string, number | null>()

  for (const record of sortedAsc) {
    const prevOdometer = prevByVehicle.get(record.vehicle_id)
    let consumption: number | null = null
    if (prevOdometer && record.odometer && record.odometer > prevOdometer) {
      const distance = record.odometer - prevOdometer
      consumption = (record.liters / distance) * 100
    }
    consumptionMap.set(record.id, consumption)
    if (record.odometer) {
      prevByVehicle.set(record.vehicle_id, record.odometer)
    }
  }

  const recordsWithConsumption = allRecords.map((record) => ({
    ...record,
    consumption: consumptionMap.get(record.id) ?? null,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tankovanie PHM</h1>
          <p className="text-muted-foreground">Evidencia tankovania pohonných hmôt</p>
        </div>
        <div className="flex gap-2">
          {(pendingCount ?? 0) > 0 && (
            <Button variant="outline" asChild>
              <Link href="/admin/phm/potvrdenie">
                <Clock className="mr-2 h-4 w-4" />
                Čaká na EUR ({pendingCount})
              </Link>
            </Button>
          )}
          <Button asChild>
            <Link href="/admin/phm/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nové tankovanie
            </Link>
          </Button>
        </div>
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
                    <TableHead className="hidden sm:table-cell">Krajina</TableHead>
                    <TableHead>Palivo</TableHead>
                    <TableHead className="text-right">Litre</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Cena/l</TableHead>
                    <TableHead className="text-right">Suma</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Bez DPH</TableHead>
                    <TableHead className="hidden lg:table-cell">Platba</TableHead>
                    <TableHead className="text-right hidden xl:table-cell">l/100km</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
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
                      <TableCell className="hidden sm:table-cell">
                        {record.country && FUEL_COUNTRIES[record.country as keyof typeof FUEL_COUNTRIES] ? (
                          <span title={FUEL_COUNTRIES[record.country as keyof typeof FUEL_COUNTRIES].name}>
                            {FUEL_COUNTRIES[record.country as keyof typeof FUEL_COUNTRIES].flag} {record.country}
                          </span>
                        ) : (
                          <span>🇸🇰 SK</span>
                        )}
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
                        {record.price_without_vat ? `${Number(record.price_without_vat).toFixed(2)} EUR` : '-'}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="outline">
                          {record.payment_method && PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS]
                            ? PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS]
                            : 'Firemná karta'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right hidden xl:table-cell">
                        {record.consumption !== null ? (
                          <Badge variant={record.consumption > 10 ? 'destructive' : 'secondary'}>
                            {record.consumption.toFixed(1)}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {record.eur_confirmed === false ? (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            <Clock className="mr-1 h-3 w-3" />
                            {record.original_total_price?.toFixed(2)} {FUEL_CURRENCIES[record.original_currency as FuelCurrency]?.symbol || record.original_currency}
                          </Badge>
                        ) : record.original_currency && record.original_currency !== 'EUR' ? (
                          <Badge variant="secondary" className="text-xs">
                            {FUEL_CURRENCIES[record.original_currency as FuelCurrency]?.symbol} &rarr; EUR
                          </Badge>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <DeleteButton
                        tableName="fuel_records"
                        recordId={record.id}
                        itemLabel="záznam o tankovaní"
                        dialogTitle="Vymazať tankovanie"
                        dialogDescription="Naozaj chcete vymazať tento záznam o tankovaní? Táto akcia sa nedá vrátiť späť."
                        successMessage="Záznam bol vymazaný"
                        errorMessage="Nepodarilo sa vymazať záznam"
                      />
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

import { createClient } from '@/lib/supabase/server'
import { getDriverId } from '@/lib/driver-session'
import { getVehicleIdsForDriver } from '@/lib/driver-vehicles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Fuel, Route, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { FUEL_TYPES, FUEL_COUNTRIES, PAYMENT_METHODS } from '@/types'

export default async function DriverFuelPage() {
  const supabase = await createClient()
  const driverId = await getDriverId()

  // Načítať ID priradených vozidiel
  const assignedVehicleIds = driverId ? await getVehicleIdsForDriver(supabase, driverId) : []

  // Načítať tankovania len pre priradené vozidlá
  let fuelRecords = null
  if (assignedVehicleIds.length > 0) {
    const { data } = await supabase
      .from('fuel_records')
      .select('*, vehicle:vehicles(name, license_plate)')
      .in('vehicle_id', assignedVehicleIds)
      .order('date', { ascending: false })
      .limit(50)
    fuelRecords = data
  }

  // Štatistiky za aktuálny mesiac
  const currentMonth = new Date().toISOString().slice(0, 7)
  const monthRecords = fuelRecords?.filter((r) => r.date.startsWith(currentMonth)) || []
  const totalLiters = monthRecords.reduce((sum, r) => sum + Number(r.liters), 0)
  const totalPrice = monthRecords.reduce((sum, r) => sum + Number(r.total_price), 0)

  return (
    <div className="space-y-6 pb-20 sm:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Moje tankovania</h1>
          <p className="text-muted-foreground">Prehľad tankovaní PHM</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/vodic/phm/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nové tankovanie
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/vodic/jazdy">
              <Route className="mr-2 h-4 w-4" />
              Jazdy
            </Link>
          </Button>
        </div>
      </div>

      {assignedVehicleIds.length === 0 ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Nemáte priradené žiadne vozidlá</AlertTitle>
          <AlertDescription>
            Pre zobrazenie tankovaní musíte mať priradené aspoň jedno vozidlo. Kontaktujte administrátora.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          {/* Štatistiky */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tankovaní tento mesiac
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthRecords.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Natankované litre
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalLiters.toFixed(2)} l</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Celková suma
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalPrice.toFixed(2)} EUR</div>
              </CardContent>
            </Card>
          </div>

          {/* Zoznam tankovaní */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Fuel className="h-5 w-5" />
                Posledné tankovania
              </CardTitle>
            </CardHeader>
            <CardContent>
              {fuelRecords && fuelRecords.length > 0 ? (
                <>
                  {/* Desktop tabuľka */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Dátum</TableHead>
                          <TableHead>Vozidlo</TableHead>
                          <TableHead className="hidden sm:table-cell">Krajina</TableHead>
                          <TableHead>Palivo</TableHead>
                          <TableHead className="text-right">Litre</TableHead>
                          <TableHead className="text-right hidden sm:table-cell">Cena/l</TableHead>
                          <TableHead className="text-right">Suma</TableHead>
                          <TableHead className="hidden lg:table-cell">Platba</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fuelRecords.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              {format(parseISO(record.date), 'd.M.yyyy', { locale: sk })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{record.vehicle?.name}</div>
                              <div className="text-sm text-muted-foreground">
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
                            <TableCell className="hidden lg:table-cell">
                              <Badge variant="outline">
                                {record.payment_method && PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS]
                                  ? PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS]
                                  : 'Firemná karta'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile karty */}
                  <div className="md:hidden space-y-3">
                    {fuelRecords.map((record) => (
                      <div
                        key={record.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">
                              {record.vehicle?.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {format(parseISO(record.date), 'd.M.yyyy', { locale: sk })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{Number(record.total_price).toFixed(2)} EUR</div>
                            <div className="text-sm text-muted-foreground">
                              {Number(record.liters).toFixed(2)} l
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            {FUEL_TYPES[record.fuel_type as keyof typeof FUEL_TYPES] || record.fuel_type}
                          </Badge>
                          {record.country && FUEL_COUNTRIES[record.country as keyof typeof FUEL_COUNTRIES] && (
                            <Badge variant="secondary">
                              {FUEL_COUNTRIES[record.country as keyof typeof FUEL_COUNTRIES].flag} {record.country}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {record.payment_method && PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS]
                              ? PAYMENT_METHODS[record.payment_method as keyof typeof PAYMENT_METHODS]
                              : 'Firemná karta'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Fuel className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Zatiaľ nemáte žiadne zaznamenané tankovania.</p>
                  <Button asChild className="mt-4">
                    <Link href="/vodic/phm/nova">
                      <Plus className="mr-2 h-4 w-4" />
                      Pridať prvé tankovanie
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

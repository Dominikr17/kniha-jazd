import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Clock, AlertCircle } from 'lucide-react'
import { FuelRecord, FUEL_CURRENCIES, FuelCurrency } from '@/types'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmEurForm } from './confirm-eur-form'

export default async function PendingConfirmationPage() {
  const supabase = await createClient()

  // Načítanie nepotvrdených tankovaní
  const { data: pendingRecords, error } = await supabase
    .from('fuel_records')
    .select(`
      *,
      vehicle:vehicles(id, name, license_plate),
      driver:drivers(id, first_name, last_name)
    `)
    .eq('eur_confirmed', false)
    .order('date', { ascending: false })

  if (error) {
    console.error('Error loading pending records:', error)
  }

  const records = (pendingRecords || []) as FuelRecord[]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/phm">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Potvrdenie tankovaní v cudzej mene</h1>
          <p className="text-muted-foreground">
            Tankovania čakajúce na doplnenie EUR sumy po príchode bankového výpisu
          </p>
        </div>
      </div>

      {records.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Clock className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">Žiadne tankovania nečakajú na potvrdenie</p>
              <p className="mt-2">Všetky tankovania v cudzej mene boli spracované.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Čaká na spracovanie: {records.length} {records.length === 1 ? 'tankovanie' : records.length < 5 ? 'tankovania' : 'tankovaní'}</AlertTitle>
            <AlertDescription>
              Doplňte EUR sumu z bankového výpisu pre každé tankovanie. Kurz je voliteľný, ale odporúčame ho zadať pre kontrolu.
            </AlertDescription>
          </Alert>

          {records.map((record) => {
            const currencyData = FUEL_CURRENCIES[record.original_currency as FuelCurrency]
            const currencySymbol = currencyData?.symbol || record.original_currency

            return (
              <Card key={record.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {record.vehicle?.name} ({record.vehicle?.license_plate})
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(parseISO(record.date), 'd. MMMM yyyy', { locale: sk })}
                        {record.driver && (
                          <> &bull; {record.driver.last_name} {record.driver.first_name}</>
                        )}
                        {record.gas_station && (
                          <> &bull; {record.gas_station}</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {record.original_total_price?.toFixed(2)} {currencySymbol}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {record.liters.toFixed(2)} l &times; {record.original_price_per_liter?.toFixed(3)} {currencySymbol}/l
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ConfirmEurForm
                    fuelRecordId={record.id}
                    originalCurrency={record.original_currency as FuelCurrency}
                    originalTotalPrice={record.original_total_price || 0}
                    liters={record.liters}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

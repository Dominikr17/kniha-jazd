import { calculateMonthlyReportData } from '@/lib/monthly-report'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { MONTHS_SK } from '@/types'
import { ReportForm } from './report-form'
import { ExportButtons } from './export-buttons'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface PageProps {
  params: Promise<{
    vehicleId: string
    year: string
    month: string
  }>
}

export default async function ReportDetailPage({ params }: PageProps) {
  const { vehicleId, year, month } = await params

  const reportData = await calculateMonthlyReportData({
    vehicleId,
    year: parseInt(year),
    month: parseInt(month)
  })

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/vykazy">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť
            </Link>
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Vozidlo nebolo nájdené.
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin/vykazy">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Späť
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Mesačný výkaz PHM</h1>
            <p className="text-muted-foreground">
              {reportData.vehicleName} ({reportData.licensePlate}) - {MONTHS_SK[reportData.month - 1]} {reportData.year}
            </p>
          </div>
        </div>
        <ExportButtons reportData={reportData} />
      </div>

      {!reportData.responsibleDriverName && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Vozidlo nemá priradeného zodpovedného vodiča. Predkladateľ výkazu nie je definovaný.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Zásoby a nákup PHM</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Nákup PHM tuzemsko (SK)</dt>
                <dd className="font-medium">
                  {reportData.fuelPurchaseDomestic.toFixed(2)} l
                  <span className="text-muted-foreground ml-2">
                    ({reportData.fuelCostDomestic.toFixed(2)} EUR)
                  </span>
                </dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Nákup PHM zahraničie</dt>
                <dd className="font-medium">
                  {reportData.fuelPurchaseForeign.toFixed(2)} l
                  <span className="text-muted-foreground ml-2">
                    ({reportData.fuelCostForeign.toFixed(2)} EUR)
                  </span>
                </dd>
              </div>
              <div className="flex justify-between border-b pb-2 font-semibold">
                <dt>Nákup PHM spolu</dt>
                <dd>
                  {reportData.fuelPurchaseTotal.toFixed(2)} l
                  <span className="text-muted-foreground ml-2 font-medium">
                    ({reportData.fuelCostTotal.toFixed(2)} EUR)
                  </span>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tachometer a kilometre</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Počiatočný stav tachometra</dt>
                <dd className="font-medium">{reportData.initialOdometer.toLocaleString('sk-SK')} km</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Konečný stav tachometra</dt>
                <dd className="font-medium">{reportData.finalOdometer.toLocaleString('sk-SK')} km</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Kilometre služobne</dt>
                <dd className="font-medium">{reportData.kmBusiness.toLocaleString('sk-SK')} km</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Kilometre súkromne</dt>
                <dd className="font-medium">{reportData.kmPrivate.toLocaleString('sk-SK')} km</dd>
              </div>
              <div className="flex justify-between font-semibold">
                <dt>Kilometre spolu</dt>
                <dd>{reportData.kmTotal.toLocaleString('sk-SK')} km</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spotreba</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Celková spotreba</dt>
                <dd className="font-medium">{reportData.fuelConsumption.toFixed(2)} l</dd>
              </div>
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Priemerná spotreba</dt>
                <dd className="font-medium">{reportData.averageConsumption.toFixed(2)} l/100km</dd>
              </div>
              {reportData.ratedConsumption && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Normovaná spotreba</dt>
                  <dd className="font-medium">{reportData.ratedConsumption.toFixed(2)} l/100km</dd>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Podpisy</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              <div className="flex justify-between border-b pb-2">
                <dt className="text-muted-foreground">Predkladateľ (zodp. vodič)</dt>
                <dd className="font-medium">
                  {reportData.responsibleDriverName || (
                    <span className="text-red-500">Nepriradený</span>
                  )}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ReportForm reportData={reportData} />
    </div>
  )
}

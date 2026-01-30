'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Trip, FuelRecord } from '@/types'
import { format, startOfMonth, subMonths, endOfMonth } from 'date-fns'
import { sk } from 'date-fns/locale'
import { ComparisonCard } from './components/comparison-card'
import { DateRange, getPreviousMonthRange } from '@/lib/report-utils'
import { formatNumber, formatCurrency } from '@/lib/report-calculations'

interface MonthlyOverviewProps {
  trips: Trip[]
  fuelRecords: FuelRecord[]
  dateRange: DateRange | null
}

export function MonthlyOverview({ trips, fuelRecords, dateRange }: MonthlyOverviewProps) {
  // Generovanie posledných 12 mesiacov
  const months = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i)
    return {
      date: startOfMonth(date),
      label: format(date, 'MMM yyyy', { locale: sk }),
      key: format(date, 'yyyy-MM'),
    }
  })

  // Agregácia dát po mesiacoch
  const data = months.map((month) => {
    const monthTrips = trips.filter((t) => t.date.startsWith(month.key))
    const monthFuel = fuelRecords.filter((f) => f.date.startsWith(month.key))

    const totalDistance = monthTrips.reduce((sum, t) => sum + (t.distance || 0), 0)
    const totalFuelCost = monthFuel.reduce((sum, f) => sum + Number(f.total_price), 0)
    const totalLiters = monthFuel.reduce((sum, f) => sum + Number(f.liters), 0)
    const tripCount = monthTrips.length

    // Spotreba (l/100km) ak máme dáta
    const avgConsumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0

    return {
      name: month.label,
      key: month.key,
      'Najazdené km': totalDistance,
      'Náklady PHM': Math.round(totalFuelCost),
      'Počet jázd': tripCount,
      'Spotreba l/100km': Number(avgConsumption.toFixed(1)),
      totalLiters: Math.round(totalLiters),
    }
  })

  // Aktuálne a predchádzajúce obdobie pre MoM
  const currentMonth = dateRange || {
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
    label: format(new Date(), 'MMMM yyyy'),
  }
  const previousMonth = getPreviousMonthRange(currentMonth)

  const currentKey = format(currentMonth.from, 'yyyy-MM')
  const previousKey = format(previousMonth.from, 'yyyy-MM')

  const currentData = data.find((d) => d.key === currentKey)
  const previousData = data.find((d) => d.key === previousKey)

  const hasData = trips.length > 0 || fuelRecords.length > 0

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mesačný prehľad</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Zatiaľ nie sú k dispozícii žiadne dáta.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* MoM porovnanie */}
      {currentData && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ComparisonCard
            title="Najazdené km"
            currentValue={currentData['Najazdené km']}
            previousValue={previousData?.['Najazdené km'] || 0}
            label={currentMonth.label}
            previousLabel={previousMonth.label}
            unit="km"
          />
          <ComparisonCard
            title="Náklady PHM"
            currentValue={currentData['Náklady PHM']}
            previousValue={previousData?.['Náklady PHM'] || 0}
            label={currentMonth.label}
            previousLabel={previousMonth.label}
            unit="EUR"
            inverseColors
          />
          <ComparisonCard
            title="Počet jázd"
            currentValue={currentData['Počet jázd']}
            previousValue={previousData?.['Počet jázd'] || 0}
            label={currentMonth.label}
            previousLabel={previousMonth.label}
          />
          <ComparisonCard
            title="Spotreba"
            currentValue={currentData['Spotreba l/100km']}
            previousValue={previousData?.['Spotreba l/100km'] || 0}
            label={currentMonth.label}
            previousLabel={previousMonth.label}
            unit="l/100km"
            decimals={1}
            inverseColors
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Najazdené kilometre a náklady PHM - posledných 12 mesiacov</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  yAxisId="left"
                  tickFormatter={(value) => formatNumber(value)}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(value) => `${formatNumber(value)} EUR`}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Náklady PHM') return [formatCurrency(Number(value)), String(name)]
                    return [`${formatNumber(Number(value))} km`, String(name)]
                  }}
                />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Najazdené km"
                  stroke="#004B87"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Náklady PHM"
                  stroke="#22c55e"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Priemerná spotreba v čase (l/100km)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value} l`} />
                <Tooltip
                  formatter={(value) => [`${value} l/100km`, 'Spotreba']}
                />
                <Line
                  type="monotone"
                  dataKey="Spotreba l/100km"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Počet jázd za mesiac</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="Počet jázd"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Súhrn za posledných 12 mesiacov</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {formatNumber(data.reduce((sum, d) => sum + d['Najazdené km'], 0))}
              </div>
              <div className="text-sm text-muted-foreground">Celkom km</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {formatCurrency(data.reduce((sum, d) => sum + d['Náklady PHM'], 0))}
              </div>
              <div className="text-sm text-muted-foreground">Celkom náklady PHM</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {formatNumber(data.reduce((sum, d) => sum + d['Počet jázd'], 0))}
              </div>
              <div className="text-sm text-muted-foreground">Celkom jázd</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">
                {formatNumber(data.reduce((sum, d) => sum + d.totalLiters, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Celkom litrov</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

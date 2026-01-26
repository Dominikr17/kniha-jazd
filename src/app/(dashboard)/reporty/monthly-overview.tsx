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
import { format, parseISO, startOfMonth, subMonths } from 'date-fns'
import { sk } from 'date-fns/locale'

interface MonthlyOverviewProps {
  trips: Trip[]
  fuelRecords: FuelRecord[]
}

export function MonthlyOverview({ trips, fuelRecords }: MonthlyOverviewProps) {
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
    const tripCount = monthTrips.length

    return {
      name: month.label,
      'Najazdené km': totalDistance,
      'Náklady PHM': Math.round(totalFuelCost),
      'Počet jázd': tripCount,
    }
  })

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
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="Najazdené km"
                  stroke="#3b82f6"
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
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {data.reduce((sum, d) => sum + d['Najazdené km'], 0).toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Celkom km</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {data.reduce((sum, d) => sum + d['Náklady PHM'], 0).toLocaleString()} EUR
              </div>
              <div className="text-sm text-muted-foreground">Celkom náklady PHM</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">
                {data.reduce((sum, d) => sum + d['Počet jázd'], 0)}
              </div>
              <div className="text-sm text-muted-foreground">Celkom jázd</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

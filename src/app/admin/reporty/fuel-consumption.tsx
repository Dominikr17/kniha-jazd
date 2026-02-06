'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts'
import { FuelRecord, Vehicle, FUEL_CONSUMPTION_TOLERANCE } from '@/types'
import { format, subMonths } from 'date-fns'
import { sk } from 'date-fns/locale'
import { getConsumptionStatus, formatNumber } from '@/lib/report-calculations'

interface FuelConsumptionProps {
  vehicles: Vehicle[]
  fuelRecords: FuelRecord[]
}

export function FuelConsumption({ vehicles, fuelRecords }: FuelConsumptionProps) {
  // Výpočet priemernej spotreby pre každé vozidlo
  const consumptionData = vehicles.map((vehicle) => {
    const vehicleFuel = fuelRecords
      .filter((f) => f.vehicle_id === vehicle.id && f.odometer !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    let totalLiters = 0
    let totalDistance = 0

    for (let i = 1; i < vehicleFuel.length; i++) {
      const currentOdometer = vehicleFuel[i].odometer
      const prevOdometer = vehicleFuel[i - 1].odometer
      if (currentOdometer !== null && prevOdometer !== null) {
        const distance = currentOdometer - prevOdometer
        if (distance > 0) {
          totalDistance += distance
          totalLiters += Number(vehicleFuel[i].liters)
        }
      }
    }

    const avgConsumption = totalDistance > 0 ? (totalLiters / totalDistance) * 100 : 0
    const ratedConsumption = vehicle.rated_consumption
    const tolerance = ratedConsumption ? ratedConsumption * FUEL_CONSUMPTION_TOLERANCE : 0
    const limit = ratedConsumption ? ratedConsumption + tolerance : null
    const difference = ratedConsumption && avgConsumption > 0
      ? Number((avgConsumption - ratedConsumption).toFixed(1))
      : null
    const status = getConsumptionStatus(avgConsumption, ratedConsumption)

    return {
      name: vehicle.name,
      'Spotreba l/100km': Number(avgConsumption.toFixed(1)),
      'Norma l/100km': ratedConsumption ? Number(ratedConsumption.toFixed(1)) : null,
      'Limit (+20%)': limit ? Number(limit.toFixed(1)) : null,
      totalLiters: Math.round(totalLiters),
      totalDistance,
      ratedConsumption,
      difference,
      status,
    }
  }).filter((v) => v['Spotreba l/100km'] > 0)

  // Trend spotreby v čase (posledných 12 mesiacov)
  const trendData = Array.from({ length: 12 }, (_, i) => {
    const date = subMonths(new Date(), 11 - i)
    const monthKey = format(date, 'yyyy-MM')

    const monthFuel = fuelRecords
      .filter(f => f.date.startsWith(monthKey) && f.odometer !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Zjednodušený výpočet - súčet litrov / súčet km z tankovania
    let liters = 0
    let distance = 0

    for (let i = 1; i < monthFuel.length; i++) {
      const curr = monthFuel[i].odometer
      const prev = monthFuel[i - 1].odometer
      if (curr !== null && prev !== null && curr > prev) {
        distance += curr - prev
        liters += Number(monthFuel[i].liters)
      }
    }

    const avgConsumption = distance > 0 ? (liters / distance) * 100 : 0

    return {
      name: format(date, 'MMM yyyy', { locale: sk }),
      'Spotreba': Number(avgConsumption.toFixed(1)),
    }
  })

  if (consumptionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spotreba paliva</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Pre výpočet spotreby je potrebných aspoň 2 záznamov o tankovaní pre dané vozidlo.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Určenie najúspornejšieho a najmenej úsporného vozidla
  const sorted = [...consumptionData].sort((a, b) => a['Spotreba l/100km'] - b['Spotreba l/100km'])
  const mostEconomical = sorted[0]
  const leastEconomical = sorted[sorted.length - 1]

  // Počet vozidiel prekračujúcich limit
  const overLimitCount = consumptionData.filter(v =>
    v.status === 'critical' || v.status === 'warning'
  ).length

  // Priemerná spotreba flotily
  const fleetAvgConsumption = consumptionData.reduce((sum, v) => sum + v['Spotreba l/100km'], 0) / consumptionData.length

  return (
    <div className="space-y-6">
      {/* Súhrnné karty */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              Najúspornejšie vozidlo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">{mostEconomical.name}</div>
            <div className="text-lg text-green-600">
              {mostEconomical['Spotreba l/100km']} l/100km
            </div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">
              Najmenej úsporné vozidlo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{leastEconomical.name}</div>
            <div className="text-lg text-red-600">
              {leastEconomical['Spotreba l/100km']} l/100km
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Priemer flotily
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fleetAvgConsumption.toFixed(1)} l/100km</div>
            <div className="text-sm text-muted-foreground">
              {consumptionData.length} vozidiel
            </div>
          </CardContent>
        </Card>

        <Card className={overLimitCount > 0 ? 'border-yellow-200 bg-yellow-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Prekročenie limitu (+20%)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overLimitCount > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
              {overLimitCount} vozidiel
            </div>
            <div className="text-sm text-muted-foreground">
              z {consumptionData.filter(v => v.ratedConsumption).length} s normou
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graf spotreby s normou a limitom */}
      <Card>
        <CardHeader>
          <CardTitle>Porovnanie spotreby s normou (+20% tolerancia)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={consumptionData}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'Limit (+20%)') return [value ? `${value} l/100km` : '-', 'Limit']
                    if (name === 'Norma l/100km') return [value ? `${value} l/100km` : '-', 'Norma']
                    return [`${value} l/100km`, 'Reálna spotreba']
                  }}
                />
                <Legend />
                <Bar
                  dataKey="Spotreba l/100km"
                  name="Reálna spotreba"
                  barSize={20}
                >
                  {consumptionData.map((entry) => {
                    let color = '#f59e0b' // default oranžová
                    if (entry.status === 'excellent') color = '#22c55e'
                    else if (entry.status === 'good') color = '#3b82f6'
                    else if (entry.status === 'warning') color = '#f59e0b'
                    else if (entry.status === 'critical') color = '#ef4444'
                    return <Cell key={`cell-${entry.name}`} fill={color} />
                  })}
                </Bar>
                <Bar
                  dataKey="Norma l/100km"
                  name="Norma"
                  fill="#94a3b8"
                  barSize={8}
                />
                <Bar
                  dataKey="Limit (+20%)"
                  name="Limit (+20%)"
                  fill="#fca5a5"
                  barSize={6}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 mt-4 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Pod normou</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Do 10% nad normu</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>10-20% nad normu</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded" />
              <span>Nad 20% (prekročenie)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend spotreby v čase */}
      <Card>
        <CardHeader>
          <CardTitle>Trend spotreby v čase (posledných 12 mesiacov)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(value) => `${value} l`} />
                <Tooltip formatter={(value) => [`${value} l/100km`, 'Spotreba']} />
                <Line
                  type="monotone"
                  dataKey="Spotreba"
                  stroke="#004B87"
                  strokeWidth={2}
                  dot={{ fill: '#004B87' }}
                />
                <ReferenceLine
                  y={fleetAvgConsumption}
                  stroke="#FFC72C"
                  strokeDasharray="5 5"
                  label={{ value: `Priemer: ${fleetAvgConsumption.toFixed(1)}`, fill: '#666', fontSize: 12 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Detailná tabuľka */}
      <Card>
        <CardHeader>
          <CardTitle>Detailný prehľad spotreby</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vozidlo</th>
                  <th className="text-right p-2">Reálna spotreba</th>
                  <th className="text-right p-2">Norma</th>
                  <th className="text-right p-2">Limit (+20%)</th>
                  <th className="text-right p-2">Rozdiel</th>
                  <th className="text-right p-2">Celkom litrov</th>
                  <th className="text-right p-2">Celkom km</th>
                  <th className="text-center p-2">Hodnotenie</th>
                </tr>
              </thead>
              <tbody>
                {consumptionData.map((row) => {
                  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'secondary'
                  let badgeText = 'Bez normy'

                  if (row.status === 'excellent') {
                    badgeVariant = 'default'
                    badgeText = 'Výborná'
                  } else if (row.status === 'good') {
                    badgeVariant = 'secondary'
                    badgeText = 'Dobrá'
                  } else if (row.status === 'warning') {
                    badgeVariant = 'outline'
                    badgeText = 'Upozornenie'
                  } else if (row.status === 'critical') {
                    badgeVariant = 'destructive'
                    badgeText = 'Prekročenie'
                  }

                  return (
                    <tr key={row.name} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2 text-right font-bold font-mono">
                        {row['Spotreba l/100km']} l/100km
                      </td>
                      <td className="p-2 text-right text-muted-foreground font-mono">
                        {row.ratedConsumption ? `${row.ratedConsumption} l/100km` : '-'}
                      </td>
                      <td className="p-2 text-right text-muted-foreground font-mono">
                        {row['Limit (+20%)'] ? `${row['Limit (+20%)']} l/100km` : '-'}
                      </td>
                      <td className="p-2 text-right font-mono">
                        {row.difference !== null ? (
                          <span className={row.difference < 0 ? 'text-green-600 font-medium' : row.difference > 0 ? 'text-red-600 font-medium' : ''}>
                            {row.difference > 0 ? '+' : ''}{row.difference} l/100km
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-right font-mono">{formatNumber(row.totalLiters)} l</td>
                      <td className="p-2 text-right font-mono">{formatNumber(row.totalDistance)} km</td>
                      <td className="p-2 text-center">
                        <Badge variant={badgeVariant}>{badgeText}</Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

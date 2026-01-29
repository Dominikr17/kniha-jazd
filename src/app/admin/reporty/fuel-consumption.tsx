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
  ReferenceLine,
  Legend,
  Cell,
} from 'recharts'
import { FuelRecord } from '@/types'

interface FuelConsumptionProps {
  vehicles: { id: string; name: string; license_plate: string; rated_consumption: number | null }[]
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
    const difference = ratedConsumption && avgConsumption > 0
      ? Number((avgConsumption - ratedConsumption).toFixed(1))
      : null

    return {
      name: vehicle.name,
      'Spotreba l/100km': Number(avgConsumption.toFixed(1)),
      'Norma l/100km': ratedConsumption ? Number(ratedConsumption.toFixed(1)) : null,
      totalLiters: Math.round(totalLiters),
      totalDistance,
      ratedConsumption,
      difference,
    }
  }).filter((v) => v['Spotreba l/100km'] > 0)

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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Priemerná spotreba podľa vozidla (l/100km)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
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
                  {consumptionData.map((entry, index) => {
                    let color = '#f59e0b' // default oranžová
                    if (entry.ratedConsumption) {
                      if (entry['Spotreba l/100km'] < entry.ratedConsumption) {
                        color = '#22c55e' // zelená - úspora
                      } else if (entry['Spotreba l/100km'] > entry.ratedConsumption) {
                        color = '#ef4444' // červená - prekročenie
                      }
                    }
                    return <Cell key={`cell-${index}`} fill={color} />
                  })}
                </Bar>
                <Bar
                  dataKey="Norma l/100km"
                  name="Norma"
                  fill="#94a3b8"
                  barSize={8}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

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
                  <th className="text-right p-2">Rozdiel</th>
                  <th className="text-right p-2">Celkom litrov</th>
                  <th className="text-right p-2">Celkom km</th>
                  <th className="text-center p-2">Hodnotenie</th>
                </tr>
              </thead>
              <tbody>
                {consumptionData.map((row) => {
                  let rating: 'Výborná' | 'Dobrá' | 'Priemerná' | 'Vysoká' | 'Úspora' | 'Prekročenie' = 'Priemerná'
                  let badgeColor = 'bg-yellow-500'

                  // Ak máme normovanú spotrebu, hodnotíme podľa nej
                  if (row.ratedConsumption && row.difference !== null) {
                    if (row.difference < -0.5) {
                      rating = 'Úspora'
                      badgeColor = 'bg-green-500'
                    } else if (row.difference > 0.5) {
                      rating = 'Prekročenie'
                      badgeColor = 'bg-red-500'
                    } else {
                      rating = 'Dobrá'
                      badgeColor = 'bg-blue-500'
                    }
                  } else {
                    // Bez normy hodnotíme absolútne
                    if (row['Spotreba l/100km'] < 6) {
                      rating = 'Výborná'
                      badgeColor = 'bg-green-500'
                    } else if (row['Spotreba l/100km'] < 8) {
                      rating = 'Dobrá'
                      badgeColor = 'bg-blue-500'
                    } else if (row['Spotreba l/100km'] > 10) {
                      rating = 'Vysoká'
                      badgeColor = 'bg-red-500'
                    }
                  }

                  return (
                    <tr key={row.name} className="border-b">
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2 text-right font-bold">
                        {row['Spotreba l/100km']} l/100km
                      </td>
                      <td className="p-2 text-right text-muted-foreground">
                        {row.ratedConsumption ? `${row.ratedConsumption} l/100km` : '-'}
                      </td>
                      <td className="p-2 text-right">
                        {row.difference !== null ? (
                          <span className={row.difference < 0 ? 'text-green-600 font-medium' : row.difference > 0 ? 'text-red-600 font-medium' : ''}>
                            {row.difference > 0 ? '+' : ''}{row.difference} l/100km
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-right">{row.totalLiters.toLocaleString()} l</td>
                      <td className="p-2 text-right">{row.totalDistance.toLocaleString()} km</td>
                      <td className="p-2 text-center">
                        <Badge className={badgeColor}>{rating}</Badge>
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

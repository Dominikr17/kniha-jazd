'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Trip, FuelRecord, Vehicle } from '@/types'
import { VehicleStats, formatNumber, formatCurrency } from '@/lib/report-calculations'
import { VehicleComparisonTable } from './components/vehicle-comparison-table'

interface VehicleComparisonProps {
  vehicles: Vehicle[]
  trips: Trip[]
  fuelRecords: FuelRecord[]
  vehicleStats: VehicleStats[]
}

export function VehicleComparison({ vehicles, trips, fuelRecords, vehicleStats }: VehicleComparisonProps) {
  // Dáta pre grafy
  const chartData = vehicleStats
    .filter((v) => v.totalDistance > 0 || v.totalFuelCost > 0)
    .map((v) => ({
      name: v.vehicleName,
      'Najazdené km': v.totalDistance,
      'Náklady PHM (EUR)': Math.round(v.totalFuelCost),
      'Litre paliva': Math.round(v.totalLiters),
    }))

  if (vehicles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Porovnanie vozidiel</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Zatiaľ nie sú k dispozícii žiadne dáta na porovnanie.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Zoraditeľná tabuľka */}
      <VehicleComparisonTable data={vehicleStats} />

      {/* Grafy */}
      {chartData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Najazdené kilometre podľa vozidla</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => formatNumber(value)} />
                    <Tooltip
                      formatter={(value) => [`${formatNumber(Number(value))} km`, 'Najazdené']}
                    />
                    <Bar dataKey="Najazdené km" fill="#004B87" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Náklady na PHM podľa vozidla</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${formatNumber(value)} EUR`} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Náklady']}
                    />
                    <Bar dataKey="Náklady PHM (EUR)" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

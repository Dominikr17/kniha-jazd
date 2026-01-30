'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { Trip, FuelRecord, Vehicle, PAYMENT_METHODS } from '@/types'
import { formatCurrency, formatNumber, VehicleStats } from '@/lib/report-calculations'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import { Fuel, TrendingUp, Car, Receipt } from 'lucide-react'

interface CostsTabProps {
  vehicles: Vehicle[]
  trips: Trip[]
  fuelRecords: FuelRecord[]
  vehicleStats: VehicleStats[]
}

const CHART_COLORS = ['#004B87', '#FFC72C', '#22c55e', '#ef4444', '#8b5cf6', '#f59e0b']

export function CostsTab({ trips, fuelRecords, vehicleStats }: CostsTabProps) {
  // Súčty
  const totals = useMemo(() => {
    const fuelCost = fuelRecords.reduce((sum, record) => sum + Number(record.total_price), 0)
    const distance = trips.reduce((sum, trip) => sum + (trip.distance || 0), 0)
    const liters = fuelRecords.reduce((sum, record) => sum + Number(record.liters), 0)

    return {
      fuelCost,
      distance,
      liters,
      costPerKm: distance > 0 ? fuelCost / distance : 0,
      avgRefuelCost: fuelRecords.length > 0 ? fuelCost / fuelRecords.length : 0,
      vehiclesWithCosts: vehicleStats.filter((stats) => stats.totalFuelCost > 0).length,
    }
  }, [fuelRecords, trips, vehicleStats])

  // Náklady podľa vozidla pre pie chart
  const costsByVehicle = useMemo(() => {
    return vehicleStats
      .filter((stats) => stats.totalFuelCost > 0)
      .map((stats) => ({
        name: stats.vehicleName,
        value: stats.totalFuelCost,
        percent: totals.fuelCost > 0 ? (stats.totalFuelCost / totals.fuelCost) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [vehicleStats, totals.fuelCost])

  // Náklady podľa mesiaca pre bar chart
  const costsByMonth = useMemo(() => {
    const monthlyAggregation = fuelRecords.reduce((acc, record) => {
      const monthKey = format(parseISO(record.date), 'yyyy-MM')
      const monthLabel = format(parseISO(record.date), 'MMM yyyy', { locale: sk })

      if (!acc[monthKey]) {
        acc[monthKey] = { monthKey, name: monthLabel, naklady: 0, litre: 0 }
      }
      acc[monthKey].naklady += Number(record.total_price)
      acc[monthKey].litre += Number(record.liters)

      return acc
    }, {} as Record<string, { monthKey: string; name: string; naklady: number; litre: number }>)

    return Object.values(monthlyAggregation)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
      .slice(-12)
  }, [fuelRecords])

  // Náklady podľa spôsobu platby pre pie chart
  const costsByPaymentMethod = useMemo(() => {
    const aggregation = fuelRecords.reduce((acc, record) => {
      const method = record.payment_method
      const methodLabel = PAYMENT_METHODS[method] || method

      if (!acc[method]) {
        acc[method] = { name: methodLabel, value: 0 }
      }
      acc[method].value += Number(record.total_price)

      return acc
    }, {} as Record<string, { name: string; value: number }>)

    return Object.values(aggregation)
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
  }, [fuelRecords])

  if (fuelRecords.length === 0 && trips.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Náklady</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">Žiadne dáta na zobrazenie.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI karty */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkové náklady PHM</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.fuelCost)}</div>
            <p className="text-xs text-muted-foreground">{formatNumber(totals.liters)} litrov</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priemerné náklady/km</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.costPerKm, 3)} EUR</div>
            <p className="text-xs text-muted-foreground">{formatNumber(totals.distance)} km celkom</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Počet tankovaní</CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fuelRecords.length}</div>
            <p className="text-xs text-muted-foreground">Priemer: {formatCurrency(totals.avgRefuelCost)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Počet vozidiel</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.vehiclesWithCosts}</div>
            <p className="text-xs text-muted-foreground">s nákladmi na PHM</p>
          </CardContent>
        </Card>
      </div>

      {/* Pie grafy */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Náklady PHM podľa vozidla</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costsByVehicle}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => ((percent ?? 0) > 5 ? `${name}: ${(percent ?? 0).toFixed(0)}%` : '')}
                  >
                    {costsByVehicle.map((_, index) => (
                      <Cell key={`vehicle-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Náklady podľa spôsobu platby</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={costsByPaymentMethod}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(Number(value))}`}
                  >
                    {costsByPaymentMethod.map((_, index) => (
                      <Cell key={`payment-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart - náklady v čase */}
      <Card>
        <CardHeader>
          <CardTitle>Náklady PHM v čase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={costsByMonth} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="left" tickFormatter={(value) => `${formatNumber(value)} EUR`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(value) => `${formatNumber(value)} l`} />
                <Tooltip
                  formatter={(value, name) =>
                    name === 'naklady' ? formatCurrency(Number(value)) : `${formatNumber(Number(value))} l`
                  }
                  labelFormatter={(label) => String(label)}
                />
                <Legend formatter={(value) => (value === 'naklady' ? 'Náklady (EUR)' : 'Natankované (l)')} />
                <Bar yAxisId="left" dataKey="naklady" fill="#004B87" />
                <Bar yAxisId="right" dataKey="litre" fill="#FFC72C" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

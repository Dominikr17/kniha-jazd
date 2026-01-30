'use client'

import { useMemo, useCallback } from 'react'
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
} from 'recharts'
import { User, Car, Route, Fuel } from 'lucide-react'
import { Trip, FuelRecord, Vehicle, Driver } from '@/types'
import {
  aggregateDriverStats,
  DriverStats,
  formatNumber,
  formatCurrency,
  findMinMax,
} from '@/lib/report-calculations'
import { cn } from '@/lib/utils'
import {
  useSortableData,
  SortButton,
  MinMaxLegend,
  getMinMaxCellClass,
} from './sortable-table'

interface DriversTabProps {
  drivers: Driver[]
  vehicles: Vehicle[]
  trips: Trip[]
  fuelRecords: FuelRecord[]
}

type DriverSortKey = 'driverName' | 'totalDistance' | 'tripCount' | 'fuelCost'

export function DriversTab({ drivers, vehicles, trips, fuelRecords }: DriversTabProps) {
  // Agregácia dát pre vodičov
  const driverStatsList = useMemo(() => {
    return drivers
      .map((driver) => aggregateDriverStats(driver, trips, fuelRecords, vehicles))
      .filter((stats) => stats.tripCount > 0 || stats.fuelCost > 0)
  }, [drivers, trips, fuelRecords, vehicles])

  const getDriverValue = useCallback((item: DriverStats, key: DriverSortKey): string | number => {
    switch (key) {
      case 'driverName': return item.driverName
      case 'totalDistance': return item.totalDistance
      case 'tripCount': return item.tripCount
      case 'fuelCost': return item.fuelCost
    }
  }, [])

  const { sortedData, sortKey, sortDirection, handleSort } = useSortableData<DriverStats, DriverSortKey>(
    driverStatsList,
    'totalDistance',
    getDriverValue
  )

  // Min/max hodnoty
  const distanceMinMax = useMemo(() => findMinMax(driverStatsList, (d) => d.totalDistance), [driverStatsList])
  const tripsMinMax = useMemo(() => findMinMax(driverStatsList, (d) => d.tripCount), [driverStatsList])
  const costMinMax = useMemo(() => findMinMax(driverStatsList, (d) => d.fuelCost), [driverStatsList])

  // Súčty
  const totals = useMemo(() => ({
    distance: driverStatsList.reduce((sum, d) => sum + d.totalDistance, 0),
    trips: driverStatsList.reduce((sum, d) => sum + d.tripCount, 0),
    fuelCost: driverStatsList.reduce((sum, d) => sum + d.fuelCost, 0),
  }), [driverStatsList])

  // Dáta pre bar chart (top 10)
  const chartData = useMemo(() => {
    return sortedData.slice(0, 10).map((stats) => ({
      name: stats.driverName.split(' ')[1] || stats.driverName,
      'Najazdené km': stats.totalDistance,
      'Počet jázd': stats.tripCount,
    }))
  }, [sortedData])

  const activeDriverCount = driverStatsList.length
  const avgPerDriver = activeDriverCount > 0 ? totals.distance / activeDriverCount : 0

  if (driverStatsList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Štatistiky vodičov</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Žiadne dáta na zobrazenie.
          </p>
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
            <CardTitle className="text-sm font-medium">Aktívni vodiči</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDriverCount}</div>
            <p className="text-xs text-muted-foreground">z celkovo {drivers.length} vodičov</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkom jázd</CardTitle>
            <Route className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.trips)}</div>
            <p className="text-xs text-muted-foreground">
              Priemer: {formatNumber(activeDriverCount > 0 ? totals.trips / activeDriverCount : 0)} jázd/vodič
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkom km</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totals.distance)}</div>
            <p className="text-xs text-muted-foreground">Priemer: {formatNumber(avgPerDriver)} km/vodič</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Celkom PHM</CardTitle>
            <Fuel className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totals.fuelCost)}</div>
            <p className="text-xs text-muted-foreground">
              Priemer: {formatCurrency(activeDriverCount > 0 ? totals.fuelCost / activeDriverCount : 0)}/vodič
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bar chart - Top 10 vodičov */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top 10 vodičov podľa najazdených km</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={90} />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Najazdené km' ? `${formatNumber(Number(value))} km` : formatNumber(Number(value))
                    }
                  />
                  <Legend />
                  <Bar dataKey="Najazdené km" fill="#004B87" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabuľka vodičov */}
      <Card>
        <CardHeader>
          <CardTitle>Detailný prehľad vodičov</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">
                    <SortButton column="driverName" label="Vodič" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="text-right p-2">
                    <SortButton column="totalDistance" label="Km" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="text-right p-2">
                    <SortButton column="tripCount" label="Jázd" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="text-right p-2">
                    <SortButton column="fuelCost" label="Náklady PHM" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                  </th>
                  <th className="text-left p-2">Vozidlá</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((driverStat) => (
                  <tr key={driverStat.driverId} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{driverStat.driverName}</td>
                    <td className={cn('p-2 text-right font-mono', getMinMaxCellClass(driverStat.totalDistance, distanceMinMax.minValue, distanceMinMax.maxValue, driverStatsList.length))}>
                      {formatNumber(driverStat.totalDistance)}
                    </td>
                    <td className={cn('p-2 text-right font-mono', getMinMaxCellClass(driverStat.tripCount, tripsMinMax.minValue, tripsMinMax.maxValue, driverStatsList.length))}>
                      {formatNumber(driverStat.tripCount)}
                    </td>
                    <td className={cn('p-2 text-right font-mono', getMinMaxCellClass(driverStat.fuelCost, costMinMax.minValue, costMinMax.maxValue, driverStatsList.length, true))}>
                      {formatCurrency(driverStat.fuelCost)}
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {driverStat.vehicles.slice(0, 3).map((vehicleName) => (
                          <Badge key={vehicleName} variant="secondary" className="text-xs">
                            {vehicleName}
                          </Badge>
                        ))}
                        {driverStat.vehicles.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{driverStat.vehicles.length - 3}
                          </Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 font-medium bg-muted/50">
                  <td className="p-2">Celkom</td>
                  <td className="p-2 text-right font-mono">{formatNumber(totals.distance)}</td>
                  <td className="p-2 text-right font-mono">{formatNumber(totals.trips)}</td>
                  <td className="p-2 text-right font-mono">{formatCurrency(totals.fuelCost)}</td>
                  <td className="p-2">-</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <MinMaxLegend />
        </CardContent>
      </Card>
    </div>
  )
}

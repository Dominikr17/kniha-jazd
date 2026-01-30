'use client'

import { useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VehicleStats, findMinMax, formatNumber, formatCurrency } from '@/lib/report-calculations'
import { cn } from '@/lib/utils'
import {
  useSortableData,
  SortButton,
  MinMaxLegend,
  getMinMaxCellClass,
} from './sortable-table'

interface VehicleComparisonTableProps {
  data: VehicleStats[]
}

type VehicleSortKey = 'vehicleName' | 'totalDistance' | 'totalFuelCost' | 'totalLiters' | 'costPerKm' | 'avgConsumption'

export function VehicleComparisonTable({ data }: VehicleComparisonTableProps) {
  const getVehicleValue = useCallback((item: VehicleStats, key: VehicleSortKey): string | number => {
    switch (key) {
      case 'vehicleName': return item.vehicleName
      case 'totalDistance': return item.totalDistance
      case 'totalFuelCost': return item.totalFuelCost
      case 'totalLiters': return item.totalLiters
      case 'costPerKm': return item.costPerKm
      case 'avgConsumption': return item.avgConsumption
    }
  }, [])

  const { sortedData, sortKey, sortDirection, handleSort } = useSortableData<VehicleStats, VehicleSortKey>(
    data,
    'totalDistance',
    getVehicleValue
  )

  // Min/max hodnoty pre farebné zvýraznenie
  const distanceMinMax = useMemo(() => findMinMax(data, (d) => d.totalDistance), [data])
  const costMinMax = useMemo(() => findMinMax(data, (d) => d.totalFuelCost), [data])
  const consumptionMinMax = useMemo(() => findMinMax(data, (d) => d.avgConsumption), [data])
  const costPerKmMinMax = useMemo(() => findMinMax(data, (d) => d.costPerKm), [data])

  // Súčty pre footer
  const totals = useMemo(() => ({
    distance: data.reduce((sum, item) => sum + item.totalDistance, 0),
    fuelCost: data.reduce((sum, item) => sum + item.totalFuelCost, 0),
    liters: data.reduce((sum, item) => sum + item.totalLiters, 0),
  }), [data])

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Porovnanie vozidiel</CardTitle>
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
    <Card>
      <CardHeader>
        <CardTitle>Porovnanie vozidiel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  <SortButton column="vehicleName" label="Vozidlo" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right p-2">
                  <SortButton column="totalDistance" label="Km" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right p-2">
                  <SortButton column="totalFuelCost" label="Náklady PHM" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right p-2">
                  <SortButton column="totalLiters" label="Litre" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right p-2">
                  <SortButton column="costPerKm" label="EUR/km" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </th>
                <th className="text-right p-2">
                  <SortButton column="avgConsumption" label="l/100km" currentSortKey={sortKey} sortDirection={sortDirection} onSort={handleSort} />
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((vehicle) => (
                <tr key={vehicle.vehicleId} className="border-b hover:bg-muted/50">
                  <td className="p-2">
                    <div className="font-medium">{vehicle.vehicleName}</div>
                    <div className="text-xs text-muted-foreground">{vehicle.licensePlate}</div>
                  </td>
                  <td className={cn('p-2 text-right font-mono', getMinMaxCellClass(vehicle.totalDistance, distanceMinMax.minValue, distanceMinMax.maxValue, data.length))}>
                    {formatNumber(vehicle.totalDistance)}
                  </td>
                  <td className={cn('p-2 text-right font-mono', getMinMaxCellClass(vehicle.totalFuelCost, costMinMax.minValue, costMinMax.maxValue, data.length, true))}>
                    {formatCurrency(vehicle.totalFuelCost)}
                  </td>
                  <td className="p-2 text-right font-mono">
                    {formatNumber(vehicle.totalLiters)} l
                  </td>
                  <td className={cn('p-2 text-right font-mono', getMinMaxCellClass(vehicle.costPerKm, costPerKmMinMax.minValue, costPerKmMinMax.maxValue, data.length, true))}>
                    {vehicle.costPerKm > 0 ? formatNumber(vehicle.costPerKm, 3) : '-'}
                  </td>
                  <td className={cn('p-2 text-right font-mono', vehicle.avgConsumption > 0 ? getMinMaxCellClass(vehicle.avgConsumption, consumptionMinMax.minValue, consumptionMinMax.maxValue, data.length, true) : '')}>
                    {vehicle.avgConsumption > 0 ? formatNumber(vehicle.avgConsumption, 1) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-medium bg-muted/50">
                <td className="p-2">Celkom</td>
                <td className="p-2 text-right font-mono">{formatNumber(totals.distance)}</td>
                <td className="p-2 text-right font-mono">{formatCurrency(totals.fuelCost)}</td>
                <td className="p-2 text-right font-mono">{formatNumber(totals.liters)} l</td>
                <td className="p-2 text-right font-mono">-</td>
                <td className="p-2 text-right font-mono">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <MinMaxLegend />
      </CardContent>
    </Card>
  )
}

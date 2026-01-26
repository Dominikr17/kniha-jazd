'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Trip, FuelRecord } from '@/types'

interface VehicleComparisonProps {
  vehicles: { id: string; name: string; license_plate: string }[]
  trips: Trip[]
  fuelRecords: FuelRecord[]
}

export function VehicleComparison({ vehicles, trips, fuelRecords }: VehicleComparisonProps) {
  // Agregácia dát pre každé vozidlo
  const data = vehicles.map((vehicle) => {
    const vehicleTrips = trips.filter((t) => t.vehicle_id === vehicle.id)
    const vehicleFuel = fuelRecords.filter((f) => f.vehicle_id === vehicle.id)

    const totalDistance = vehicleTrips.reduce((sum, t) => sum + (t.distance || 0), 0)
    const totalFuelCost = vehicleFuel.reduce((sum, f) => sum + Number(f.total_price), 0)
    const totalLiters = vehicleFuel.reduce((sum, f) => sum + Number(f.liters), 0)

    return {
      name: vehicle.name,
      'Najazdené km': totalDistance,
      'Náklady PHM (EUR)': Math.round(totalFuelCost),
      'Litre paliva': Math.round(totalLiters),
    }
  })

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
      <Card>
        <CardHeader>
          <CardTitle>Najazdené kilometre podľa vozidla</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Najazdené km" fill="#3b82f6" />
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
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="Náklady PHM (EUR)" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prehľad v tabuľke</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vozidlo</th>
                  <th className="text-right p-2">Najazdené km</th>
                  <th className="text-right p-2">Náklady PHM</th>
                  <th className="text-right p-2">Litre paliva</th>
                  <th className="text-right p-2">EUR/km</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const costPerKm = row['Najazdené km'] > 0
                    ? (row['Náklady PHM (EUR)'] / row['Najazdené km']).toFixed(3)
                    : '-'
                  return (
                    <tr key={row.name} className="border-b">
                      <td className="p-2 font-medium">{row.name}</td>
                      <td className="p-2 text-right">{row['Najazdené km'].toLocaleString()}</td>
                      <td className="p-2 text-right">{row['Náklady PHM (EUR)'].toLocaleString()} EUR</td>
                      <td className="p-2 text-right">{row['Litre paliva'].toLocaleString()} l</td>
                      <td className="p-2 text-right">{costPerKm}</td>
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

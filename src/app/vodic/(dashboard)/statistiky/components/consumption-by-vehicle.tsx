import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { VehicleConsumption } from '@/lib/driver-stats'

interface ConsumptionByVehicleProps {
  data: VehicleConsumption[]
}

const STATUS_STYLES = {
  ok: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  over: 'bg-red-100 text-red-800',
}

const STATUS_LABELS = {
  ok: 'V norme',
  warning: 'Mierne vyššia',
  over: 'Prekročená norma',
}

export function ConsumptionByVehicle({ data }: ConsumptionByVehicleProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spotreba podľa vozidla</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Žiadne dáta pre zvolené obdobie
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Spotreba podľa vozidla</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((vehicle) => (
            <div
              key={vehicle.vehicleId}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-lg border"
            >
              <div className="flex-1">
                <div className="font-medium">{vehicle.vehicleName}</div>
                <div className="text-sm text-muted-foreground">
                  {vehicle.licensePlate}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {vehicle.totalKm.toLocaleString('sk-SK')} km •{' '}
                  {vehicle.totalLiters.toFixed(1)} l
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-lg font-semibold">
                  {vehicle.consumption !== null
                    ? `${vehicle.consumption.toFixed(1)} l/100km`
                    : '-'}
                </div>
                {vehicle.ratedConsumption !== null && (
                  <div className="text-xs text-muted-foreground">
                    Norma: {vehicle.ratedConsumption.toFixed(1)} l/100km (+20%)
                  </div>
                )}
                {vehicle.consumption !== null && vehicle.ratedConsumption !== null && (
                  <Badge className={STATUS_STYLES[vehicle.status]} variant="outline">
                    {STATUS_LABELS[vehicle.status]}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

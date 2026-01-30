'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { CheckSquare, Square } from 'lucide-react'

// Zjednodušený typ pre výber vozidiel
interface VehicleBasic {
  id: string
  name: string
  license_plate: string
}

interface VehicleAssignmentProps {
  vehicles: VehicleBasic[]
  selectedVehicleIds: string[]
  onChange: (vehicleIds: string[]) => void
  disabled?: boolean
}

export function VehicleAssignment({
  vehicles,
  selectedVehicleIds,
  onChange,
  disabled = false,
}: VehicleAssignmentProps) {
  const handleToggle = (vehicleId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedVehicleIds, vehicleId])
    } else {
      onChange(selectedVehicleIds.filter((id) => id !== vehicleId))
    }
  }

  const handleSelectAll = () => {
    onChange(vehicles.map((vehicle) => vehicle.id))
  }

  const handleSelectNone = () => {
    onChange([])
  }

  if (vehicles.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4">
        Zatiaľ neboli pridané žiadne vozidlá.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled}
        >
          <CheckSquare className="mr-2 h-4 w-4" />
          Vybrať všetky
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectNone}
          disabled={disabled}
        >
          <Square className="mr-2 h-4 w-4" />
          Zrušiť výber
        </Button>
        <span className="text-sm text-muted-foreground ml-auto">
          Vybrané: {selectedVehicleIds.length} z {vehicles.length}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <label
            key={vehicle.id}
            htmlFor={`vehicle-${vehicle.id}`}
            className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer hover:bg-muted/50 ${
              selectedVehicleIds.includes(vehicle.id)
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
          >
            <Checkbox
              id={`vehicle-${vehicle.id}`}
              checked={selectedVehicleIds.includes(vehicle.id)}
              onCheckedChange={(checked) => handleToggle(vehicle.id, checked === true)}
              disabled={disabled}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{vehicle.name}</div>
              <div className="text-xs text-muted-foreground">{vehicle.license_plate}</div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

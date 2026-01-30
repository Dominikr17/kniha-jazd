'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Car, Plus, Fuel } from 'lucide-react'
import { StatusBadge } from './status-badge'
import { VehicleWithDetails } from '@/types'

interface VehicleCardProps {
  vehicle: VehicleWithDetails
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        {/* Hlavička vozidla */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#004B87] rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{vehicle.name}</h3>
              <p className="text-sm text-gray-500">{vehicle.license_plate}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Tachometer</p>
            <p className="font-semibold">{vehicle.currentOdometer.toLocaleString('sk-SK')} km</p>
          </div>
        </div>

        {/* Statusy - STK, EK, Známky */}
        <div className="flex flex-wrap gap-2 mb-4">
          <StatusBadge
            label="STK"
            validUntil={vehicle.stk?.valid_until}
          />
          <StatusBadge
            label="EK"
            validUntil={vehicle.ek?.valid_until}
          />
          {vehicle.vignettes.map((vignette, index) => (
            <StatusBadge
              key={index}
              label={vignette.country}
              validUntil={vignette.valid_until}
            />
          ))}
        </div>

        {/* Akčné tlačidlá */}
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1 bg-[#004B87] hover:bg-[#003a6b]">
            <Link href={`/vodic/jazdy/nova?vehicle=${vehicle.id}`}>
              <Plus className="w-4 h-4 mr-1" />
              Nová jazda
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={`/vodic/phm/nova?vehicle=${vehicle.id}`}>
              <Fuel className="w-4 h-4 mr-1" />
              Tankovanie
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

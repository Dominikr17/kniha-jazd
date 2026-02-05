import { createClient } from '@/lib/supabase/server'
import { getDriverId } from '@/lib/driver-session'
import { getVehiclesWithDetails } from '@/lib/driver-vehicles'
import { VehicleCard } from './components/vehicle-card'
import { redirect } from 'next/navigation'
import { Car } from 'lucide-react'

export default async function MojeVozidlaPage() {
  const driverId = await getDriverId()

  if (!driverId) {
    redirect('/')
  }

  const supabase = await createClient()
  const vehicles = await getVehiclesWithDetails(supabase, driverId)

  return (
    <div className="container mx-auto max-w-4xl pb-20 sm:pb-0">
      {/* Hlavička */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Moje vozidlá</h1>
        <p className="text-muted-foreground mt-1">
          Prehľad priradených vozidiel a ich termínov
        </p>
      </div>

      {/* Zoznam vozidiel */}
      {vehicles.length > 0 ? (
        <div className="space-y-4">
          {vehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Car className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <h3 className="font-semibold text-yellow-800 mb-1">
            Žiadne priradené vozidlá
          </h3>
          <p className="text-yellow-700 text-sm">
            Nemáte priradené žiadne vozidlá. Kontaktujte administrátora.
          </p>
        </div>
      )}
    </div>
  )
}

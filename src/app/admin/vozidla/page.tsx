import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Car } from 'lucide-react'
import { Vehicle, FUEL_TYPES } from '@/types'
import { DeleteVehicleButton } from './delete-button'

export default async function VehiclesPage() {
  const supabase = await createClient()

  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('*, responsible_driver:drivers(*)')
    .order('name', { ascending: true })

  if (error) {
    console.error('Error loading vehicles:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vozidlá</h1>
          <p className="text-muted-foreground">Správa vozového parku</p>
        </div>
        <Button asChild>
          <Link href="/admin/vozidla/nove">
            <Plus className="mr-2 h-4 w-4" />
            Pridať vozidlo
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Zoznam vozidiel
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!vehicles || vehicles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>Zatiaľ neboli pridané žiadne vozidlá.</p>
              <Button asChild className="mt-4">
                <Link href="/admin/vozidla/nove">Pridať prvé vozidlo</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Názov</TableHead>
                    <TableHead>EČV</TableHead>
                    <TableHead className="hidden md:table-cell">Značka/Model</TableHead>
                    <TableHead className="hidden sm:table-cell">Palivo</TableHead>
                    <TableHead className="hidden lg:table-cell">Zodpovedný vodič</TableHead>
                    <TableHead className="w-[100px]">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(vehicles as Vehicle[]).map((vehicle) => (
                    <TableRow key={vehicle.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/vozidla/${vehicle.id}`} className="hover:underline">
                          {vehicle.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{vehicle.license_plate}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {vehicle.brand && vehicle.model
                          ? `${vehicle.brand} ${vehicle.model}`
                          : vehicle.brand || '-'}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {FUEL_TYPES[vehicle.fuel_type as keyof typeof FUEL_TYPES]}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {vehicle.responsible_driver
                          ? `${vehicle.responsible_driver.first_name} ${vehicle.responsible_driver.last_name}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/admin/vozidla/${vehicle.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteVehicleButton id={vehicle.id} name={vehicle.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

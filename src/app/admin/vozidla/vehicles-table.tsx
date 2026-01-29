'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Pencil, Car, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Vehicle, FUEL_TYPES } from '@/types'
import { DeleteButton } from '@/components/delete-button'

type VehicleWithDriver = Omit<Vehicle, 'responsible_driver'> & {
  responsible_driver?: {
    first_name: string
    last_name: string
  } | null
}

interface VehiclesTableProps {
  vehicles: VehicleWithDriver[]
}

type SortField = 'name' | 'license_plate' | 'brand_model' | 'fuel_type' | 'driver'
type SortDirection = 'asc' | 'desc'

export function VehiclesTable({ vehicles }: VehiclesTableProps) {
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4 text-muted-foreground/50" />
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-4 w-4" />
      : <ArrowDown className="ml-1 h-4 w-4" />
  }

  const filteredAndSortedVehicles = useMemo(() => {
    const filtered = vehicles.filter((vehicle) => {
      const searchLower = search.toLowerCase()
      const brandModel = `${vehicle.brand || ''} ${vehicle.model || ''}`.toLowerCase()
      const driverName = vehicle.responsible_driver
        ? `${vehicle.responsible_driver.last_name} ${vehicle.responsible_driver.first_name}`.toLowerCase()
        : ''
      return (
        vehicle.name.toLowerCase().includes(searchLower) ||
        vehicle.license_plate.toLowerCase().includes(searchLower) ||
        brandModel.includes(searchLower) ||
        driverName.includes(searchLower)
      )
    })

    return filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'sk')
          break
        case 'license_plate':
          comparison = a.license_plate.localeCompare(b.license_plate, 'sk')
          break
        case 'brand_model':
          const brandModelA = `${a.brand || ''} ${a.model || ''}`
          const brandModelB = `${b.brand || ''} ${b.model || ''}`
          comparison = brandModelA.localeCompare(brandModelB, 'sk')
          break
        case 'fuel_type':
          const fuelA = FUEL_TYPES[a.fuel_type as keyof typeof FUEL_TYPES] || ''
          const fuelB = FUEL_TYPES[b.fuel_type as keyof typeof FUEL_TYPES] || ''
          comparison = fuelA.localeCompare(fuelB, 'sk')
          break
        case 'driver':
          const driverA = a.responsible_driver
            ? `${a.responsible_driver.last_name} ${a.responsible_driver.first_name}`
            : ''
          const driverB = b.responsible_driver
            ? `${b.responsible_driver.last_name} ${b.responsible_driver.first_name}`
            : ''
          comparison = driverA.localeCompare(driverB, 'sk')
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [vehicles, search, sortField, sortDirection])

  if (vehicles.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Car className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Zatiaľ neboli pridané žiadne vozidlá.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/vozidla/nove">Pridať prvé vozidlo</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Vyhľadať vozidlo..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredAndSortedVehicles.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Žiadne vozidlá nezodpovedajú vyhľadávaniu.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <span className="flex items-center">
                    Názov
                    <SortIcon field="name" />
                  </span>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('license_plate')}
                >
                  <span className="flex items-center">
                    EČV
                    <SortIcon field="license_plate" />
                  </span>
                </TableHead>
                <TableHead
                  className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('brand_model')}
                >
                  <span className="flex items-center">
                    Značka/Model
                    <SortIcon field="brand_model" />
                  </span>
                </TableHead>
                <TableHead
                  className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('fuel_type')}
                >
                  <span className="flex items-center">
                    Palivo
                    <SortIcon field="fuel_type" />
                  </span>
                </TableHead>
                <TableHead
                  className="hidden lg:table-cell cursor-pointer select-none hover:bg-muted/50"
                  onClick={() => handleSort('driver')}
                >
                  <span className="flex items-center">
                    Zodpovedný vodič
                    <SortIcon field="driver" />
                  </span>
                </TableHead>
                <TableHead className="w-[100px]">Akcie</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedVehicles.map((vehicle) => (
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
                      ? `${vehicle.responsible_driver.last_name} ${vehicle.responsible_driver.first_name}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/vozidla/${vehicle.id}`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteButton
                      tableName="vehicles"
                      recordId={vehicle.id}
                      itemLabel={vehicle.name}
                      dialogTitle="Vymazať vozidlo"
                      dialogDescription={`Naozaj chcete vymazať vozidlo ${vehicle.name}? Vymažú sa aj všetky súvisiace dokumenty, kontroly a diaľničné známky. Táto akcia sa nedá vrátiť späť.`}
                      successMessage="Vozidlo bolo vymazané"
                      errorMessage="Nepodarilo sa vymazať vozidlo"
                    />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

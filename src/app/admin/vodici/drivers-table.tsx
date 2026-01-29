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
import { Pencil, Car, Search, Users, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { Driver } from '@/types'
import { DeleteButton } from '@/components/delete-button'

interface DriverWithCount extends Driver {
  vehicle_count: number
}

interface DriversTableProps {
  drivers: DriverWithCount[]
}

type SortField = 'name' | 'position' | 'email' | 'phone' | 'vehicle_count'
type SortDirection = 'asc' | 'desc'

export function DriversTable({ drivers }: DriversTableProps) {
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

  const filteredAndSortedDrivers = useMemo(() => {
    const filtered = drivers.filter((driver) => {
      const searchLower = search.toLowerCase()
      const fullName = `${driver.last_name} ${driver.first_name}`.toLowerCase()
      const fullNameReversed = `${driver.first_name} ${driver.last_name}`.toLowerCase()
      return (
        fullName.includes(searchLower) ||
        fullNameReversed.includes(searchLower) ||
        (driver.position?.toLowerCase().includes(searchLower) ?? false) ||
        (driver.email?.toLowerCase().includes(searchLower) ?? false) ||
        (driver.phone?.includes(search) ?? false)
      )
    })

    return filtered.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = `${a.last_name} ${a.first_name}`.localeCompare(
            `${b.last_name} ${b.first_name}`,
            'sk'
          )
          break
        case 'position':
          comparison = (a.position || '').localeCompare(b.position || '', 'sk')
          break
        case 'email':
          comparison = (a.email || '').localeCompare(b.email || '', 'sk')
          break
        case 'phone':
          comparison = (a.phone || '').localeCompare(b.phone || '', 'sk')
          break
        case 'vehicle_count':
          comparison = a.vehicle_count - b.vehicle_count
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [drivers, search, sortField, sortDirection])

  if (drivers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Users className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Zatiaľ neboli pridaní žiadni vodiči.</p>
        <Button asChild className="mt-4">
          <Link href="/admin/vodici/novy">Pridať prvého vodiča</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Vyhľadať vodiča..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredAndSortedDrivers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Žiadni vodiči nezodpovedajú vyhľadávaniu.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('name')}
              >
                <span className="flex items-center">
                  Meno
                  <SortIcon field="name" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('position')}
              >
                <span className="flex items-center">
                  Funkcia
                  <SortIcon field="position" />
                </span>
              </TableHead>
              <TableHead
                className="hidden md:table-cell cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('email')}
              >
                <span className="flex items-center">
                  Email
                  <SortIcon field="email" />
                </span>
              </TableHead>
              <TableHead
                className="hidden sm:table-cell cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('phone')}
              >
                <span className="flex items-center">
                  Telefón
                  <SortIcon field="phone" />
                </span>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none hover:bg-muted/50"
                onClick={() => handleSort('vehicle_count')}
              >
                <span className="flex items-center">
                  Vozidlá
                  <SortIcon field="vehicle_count" />
                </span>
              </TableHead>
              <TableHead className="w-[100px]">Akcie</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedDrivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell className="font-medium">
                  {driver.last_name} {driver.first_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {driver.position || '-'}
                </TableCell>
                <TableCell className="hidden md:table-cell">{driver.email || '-'}</TableCell>
                <TableCell className="hidden sm:table-cell">{driver.phone || '-'}</TableCell>
                <TableCell>
                  <Badge variant={driver.vehicle_count > 0 ? 'default' : 'secondary'} className="gap-1">
                    <Car className="h-3 w-3" />
                    {driver.vehicle_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/vodici/${driver.id}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DeleteButton
                      tableName="drivers"
                      recordId={driver.id}
                      itemLabel={`${driver.first_name} ${driver.last_name}`}
                      dialogTitle="Vymazať vodiča"
                      dialogDescription={`Naozaj chcete vymazať vodiča ${driver.first_name} ${driver.last_name}? Táto akcia sa nedá vrátiť späť.`}
                      successMessage="Vodič bol vymazaný"
                      errorMessage="Nepodarilo sa vymazať vodiča"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

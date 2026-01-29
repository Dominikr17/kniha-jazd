'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileSpreadsheet, ExternalLink } from 'lucide-react'
import { MonthlyReport, MONTHS_SK, REPORT_STATUS, ReportStatus } from '@/types'

interface VykazyListProps {
  reports: (MonthlyReport & {
    vehicle: {
      id: string
      name: string
      license_plate: string
      responsible_driver: { first_name: string; last_name: string } | null
    }
  })[]
  year: number
  month: number
}

function getStatusBadgeVariant(status: ReportStatus): 'secondary' | 'outline' | 'default' {
  switch (status) {
    case 'draft':
      return 'secondary'
    case 'submitted':
      return 'outline'
    case 'approved':
      return 'default'
    default:
      return 'secondary'
  }
}

function getStatusBadgeClass(status: ReportStatus): string {
  switch (status) {
    case 'draft':
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
    case 'submitted':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-100'
    case 'approved':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    default:
      return ''
  }
}

export function VykazyList({ reports, year, month }: VykazyListProps) {
  if (reports.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileSpreadsheet className="mx-auto h-12 w-12 mb-4 opacity-50" />
        <p>Žiadne výkazy pre zvolené obdobie.</p>
        <p className="text-sm mt-2">
          Kliknite na &quot;Generovať výkazy&quot; pre vytvorenie výkazov za vybraný mesiac.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vozidlo</TableHead>
            <TableHead>Mesiac</TableHead>
            <TableHead className="hidden md:table-cell">Zodp. vodič</TableHead>
            <TableHead className="text-right">km</TableHead>
            <TableHead className="text-right hidden sm:table-cell">PHM (l)</TableHead>
            <TableHead className="text-right hidden lg:table-cell">Náklady</TableHead>
            <TableHead>Stav</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((report) => {
            const km = (report.final_odometer || 0) - (report.initial_odometer || 0)
            const responsibleDriver = report.vehicle?.responsible_driver

            return (
              <TableRow key={report.id}>
                <TableCell>
                  <div className="font-medium">{report.vehicle?.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {report.vehicle?.license_plate}
                  </div>
                </TableCell>
                <TableCell>
                  {MONTHS_SK[report.month - 1]} {report.year}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {responsibleDriver ? (
                    `${responsibleDriver.first_name} ${responsibleDriver.last_name}`
                  ) : (
                    <span className="text-muted-foreground">Nepriradený</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {km.toLocaleString('sk-SK')} km
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell">
                  {((report.initial_fuel_stock || 0) + 0 - (report.final_fuel_stock || 0)).toFixed(1)} l
                </TableCell>
                <TableCell className="text-right hidden lg:table-cell">
                  -
                </TableCell>
                <TableCell>
                  <Badge
                    variant={getStatusBadgeVariant(report.status)}
                    className={getStatusBadgeClass(report.status)}
                  >
                    {REPORT_STATUS[report.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/vykazy/${report.vehicle_id}/${report.year}/${report.month}`}>
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Detail
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

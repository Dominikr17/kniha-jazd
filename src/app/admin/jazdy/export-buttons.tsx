'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FileDown, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Trip } from '@/types'
import { format, parseISO } from 'date-fns'
import { sk } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'

interface ExportButtonsProps {
  trips: Trip[]
}

export function ExportButtons({ trips }: ExportButtonsProps) {
  const [isExporting, setIsExporting] = useState(false)

  const exportPDF = async () => {
    if (trips.length === 0) {
      toast.error('Nie sú žiadne jazdy na export')
      return
    }

    setIsExporting(true)

    try {
      const doc = new jsPDF('landscape', 'mm', 'a4')

      // Nadpis
      doc.setFontSize(16)
      doc.text('Kniha jazd - ZVL SLOVAKIA', 14, 15)

      doc.setFontSize(10)
      doc.text(`Vygenerované: ${format(new Date(), 'd.M.yyyy HH:mm', { locale: sk })}`, 14, 22)

      // Tabuľka
      const tableData = trips.map((trip) => [
        trip.trip_number.toString(),
        format(parseISO(trip.date), 'd.M.yyyy', { locale: sk }),
        trip.time_start.slice(0, 5),
        trip.time_end?.slice(0, 5) || '-',
        trip.vehicle?.name || '-',
        trip.vehicle?.license_plate || '-',
        `${trip.driver?.first_name || ''} ${trip.driver?.last_name || ''}`.trim() || '-',
        trip.route_from,
        trip.route_to,
        trip.purpose,
        trip.odometer_start.toString(),
        trip.odometer_end?.toString() || '-',
        trip.distance?.toString() || '-',
      ])

      autoTable(doc, {
        startY: 28,
        head: [
          ['Č.', 'Dátum', 'Od', 'Do', 'Vozidlo', 'EČV', 'Vodič', 'Odkiaľ', 'Kam', 'Účel', 'Tach. začiatok', 'Tach. koniec', 'km'],
        ],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 1.5 },
        headStyles: { fillColor: [41, 128, 185], fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 10 },
          1: { cellWidth: 18 },
          2: { cellWidth: 12 },
          3: { cellWidth: 12 },
          4: { cellWidth: 25 },
          5: { cellWidth: 20 },
          6: { cellWidth: 30 },
          7: { cellWidth: 30 },
          8: { cellWidth: 30 },
          9: { cellWidth: 35 },
          10: { cellWidth: 18 },
          11: { cellWidth: 18 },
          12: { cellWidth: 12 },
        },
      })

      doc.save(`kniha-jazd-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
      toast.success('PDF bolo vygenerované')
    } catch (error) {
      console.error('PDF export error:', error)
      toast.error('Nepodarilo sa vygenerovať PDF')
    } finally {
      setIsExporting(false)
    }
  }

  const exportExcel = async () => {
    if (trips.length === 0) {
      toast.error('Nie sú žiadne jazdy na export')
      return
    }

    setIsExporting(true)

    try {
      const data = trips.map((trip) => ({
        'Číslo': trip.trip_number,
        'Dátum': format(parseISO(trip.date), 'd.M.yyyy', { locale: sk }),
        'Čas od': trip.time_start.slice(0, 5),
        'Čas do': trip.time_end?.slice(0, 5) || '',
        'Vozidlo': trip.vehicle?.name || '',
        'EČV': trip.vehicle?.license_plate || '',
        'Vodič': `${trip.driver?.first_name || ''} ${trip.driver?.last_name || ''}`.trim(),
        'Odkiaľ': trip.route_from,
        'Kam': trip.route_to,
        'Účel cesty': trip.purpose,
        'Tachometer začiatok': trip.odometer_start,
        'Tachometer koniec': trip.odometer_end || '',
        'Najazdené km': trip.distance || '',
        'Poznámky': trip.notes || '',
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Kniha jazd')

      XLSX.writeFile(wb, `kniha-jazd-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      toast.success('Excel bol vygenerovaný')
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Nepodarilo sa vygenerovať Excel')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isExporting}>
          {isExporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="mr-2 h-4 w-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={exportPDF}>
          Export do PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportExcel}>
          Export do Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

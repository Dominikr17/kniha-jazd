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
import ExcelJS from 'exceljs'
import { ROBOTO_REGULAR_BASE64 } from '@/lib/fonts/roboto-regular'
import { ROBOTO_BOLD_BASE64 } from '@/lib/fonts/roboto-bold'

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64)
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
}

async function loadImageAsBase64(url: string, maxWidth = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Zmenšenie obrázka pre menšiu veľkosť PDF
      const scale = maxWidth / img.width
      const width = maxWidth
      const height = img.height * scale

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png', 0.9))
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = reject
    img.src = url
  })
}

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

      // Registrácia fontov s diakritikou
      registerFonts(doc)
      doc.setFont('Roboto', 'normal')

      // Logo vľavo hore (pomer strán 2022:546 = 3.7:1)
      const logoWidth = 35
      const logoHeight = logoWidth / 3.7
      try {
        const logoBase64 = await loadImageAsBase64('/logo.png')
        doc.addImage(logoBase64, 'PNG', 14, 8, logoWidth, logoHeight)
      } catch (error) {
        console.warn('Could not load logo:', error)
      }

      // Nadpis v strede
      const pageWidth = doc.internal.pageSize.getWidth()

      // Zistíme či sú všetky jazdy z jedného vozidla
      const vehicleIds = [...new Set(trips.map(t => t.vehicle_id))]
      const isSingleVehicle = vehicleIds.length === 1
      const vehicle = isSingleVehicle ? trips[0].vehicle : null

      const title = vehicle
        ? `Kniha jázd - ${vehicle.name} (${vehicle.license_plate})`
        : 'Kniha jázd'

      doc.setFontSize(12)
      doc.setFont('Roboto', 'bold')
      doc.text(title, pageWidth / 2, 13, { align: 'center' })

      doc.setFontSize(9)
      doc.setFont('Roboto', 'normal')
      doc.text(`Vygenerované: ${format(new Date(), 'd.M.yyyy HH:mm', { locale: sk })}`, pageWidth / 2, 19, { align: 'center' })

      // Tabuľka
      const tableData = trips.map((trip) => [
        format(parseISO(trip.date), 'd.M.yyyy', { locale: sk }),
        trip.time_start.slice(0, 5),
        trip.time_end?.slice(0, 5) || '-',
        trip.vehicle?.name || '-',
        trip.vehicle?.license_plate || '-',
        `${trip.driver?.first_name || ''} ${trip.driver?.last_name || ''}`.trim() || '-',
        trip.route_from,
        trip.route_to,
        trip.visit_place || '-',
        trip.purpose,
        trip.odometer_start.toString(),
        trip.odometer_end?.toString() || '-',
        trip.distance?.toString() || '-',
      ])

      autoTable(doc, {
        startY: 26,
        head: [
          ['Dátum', 'Od', 'Do', 'Vozidlo', 'EČV', 'Vodič', 'Odkiaľ', 'Kam', 'Návšteva', 'Účel', 'Tach. zač.', 'Tach. kon.', 'km'],
        ],
        body: tableData,
        styles: { fontSize: 7, cellPadding: 1.5, font: 'Roboto' },
        headStyles: { fillColor: [0, 75, 135], fontSize: 7, font: 'Roboto', fontStyle: 'bold' },
        columnStyles: {
          0: { cellWidth: 17 },
          1: { cellWidth: 10 },
          2: { cellWidth: 10 },
          3: { cellWidth: 22 },
          4: { cellWidth: 18 },
          5: { cellWidth: 28 },
          6: { cellWidth: 22 },
          7: { cellWidth: 22 },
          8: { cellWidth: 28 },
          9: { cellWidth: 28 },
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
      const wb = new ExcelJS.Workbook()
      const ws = wb.addWorksheet('Kniha jazd')

      ws.columns = [
        { header: 'Číslo', key: 'number', width: 10 },
        { header: 'Dátum', key: 'date', width: 12 },
        { header: 'Čas od', key: 'timeStart', width: 8 },
        { header: 'Čas do', key: 'timeEnd', width: 8 },
        { header: 'Vozidlo', key: 'vehicle', width: 18 },
        { header: 'EČV', key: 'plate', width: 12 },
        { header: 'Vodič', key: 'driver', width: 22 },
        { header: 'Odkiaľ', key: 'from', width: 18 },
        { header: 'Kam', key: 'to', width: 18 },
        { header: 'Miesto návštevy', key: 'visit', width: 20 },
        { header: 'Účel cesty', key: 'purpose', width: 22 },
        { header: 'Tach. začiatok', key: 'odoStart', width: 14 },
        { header: 'Tach. koniec', key: 'odoEnd', width: 14 },
        { header: 'Najazdené km', key: 'distance', width: 12 },
        { header: 'Poznámky', key: 'notes', width: 20 },
      ]

      // Tučná hlavička
      ws.getRow(1).font = { bold: true }

      trips.forEach((trip) => {
        ws.addRow({
          number: trip.trip_number,
          date: format(parseISO(trip.date), 'd.M.yyyy', { locale: sk }),
          timeStart: trip.time_start.slice(0, 5),
          timeEnd: trip.time_end?.slice(0, 5) || '',
          vehicle: trip.vehicle?.name || '',
          plate: trip.vehicle?.license_plate || '',
          driver: `${trip.driver?.first_name || ''} ${trip.driver?.last_name || ''}`.trim(),
          from: trip.route_from,
          to: trip.route_to,
          visit: trip.visit_place || '',
          purpose: trip.purpose,
          odoStart: trip.odometer_start,
          odoEnd: trip.odometer_end || '',
          distance: trip.distance || '',
          notes: trip.notes || '',
        })
      })

      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kniha-jazd-${format(new Date(), 'yyyy-MM-dd')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
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

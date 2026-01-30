'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { MonthlyReportData } from '@/types'
import { generateMonthlyReportPDF } from '@/lib/monthly-report-pdf'
import { generateMonthlyReportExcel } from '@/lib/monthly-report-excel'

interface ExportButtonsProps {
  reportData: MonthlyReportData
}

export function ExportButtons({ reportData }: ExportButtonsProps) {
  const [isExportingPDF, setIsExportingPDF] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)

  const handleExportPDF = async () => {
    setIsExportingPDF(true)
    try {
      await generateMonthlyReportPDF(reportData)
      toast.success('PDF bol vygenerovaný')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Chyba pri generovaní PDF')
    } finally {
      setIsExportingPDF(false)
    }
  }

  const handleExportExcel = async () => {
    setIsExportingExcel(true)
    try {
      await generateMonthlyReportExcel(reportData)
      toast.success('Excel bol vygenerovaný')
    } catch (error) {
      console.error('Error generating Excel:', error)
      toast.error('Chyba pri generovaní Excel')
    } finally {
      setIsExportingExcel(false)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={handleExportPDF}
        disabled={isExportingPDF}
      >
        {isExportingPDF ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileText className="mr-2 h-4 w-4" />
        )}
        Export PDF
      </Button>
      <Button
        variant="outline"
        onClick={handleExportExcel}
        disabled={isExportingExcel}
      >
        {isExportingExcel ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <FileSpreadsheet className="mr-2 h-4 w-4" />
        )}
        Export Excel
      </Button>
    </div>
  )
}

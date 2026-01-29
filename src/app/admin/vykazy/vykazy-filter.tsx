'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw, FileDown } from 'lucide-react'
import { MONTHS_SK, REPORT_STATUS, ReportStatus } from '@/types'
import { useState } from 'react'
import { toast } from 'sonner'

interface VykazyFilterProps {
  vehicles: { id: string; name: string; license_plate: string }[]
  defaultYear: number
  defaultMonth?: number
  defaultVehicleId?: string
  defaultStatus?: ReportStatus
}

export function VykazyFilter({
  vehicles,
  defaultYear,
  defaultMonth,
  defaultVehicleId,
  defaultStatus
}: VykazyFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isGenerating, setIsGenerating] = useState(false)

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i)

  const updateFilter = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== 'all') {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/admin/vykazy?${params.toString()}`)
  }

  const handleGenerateReports = async () => {
    const year = defaultYear
    const month = defaultMonth || new Date().getMonth() + 1

    setIsGenerating(true)
    try {
      const response = await fetch('/api/admin/vykazy/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, month })
      })

      const result = await response.json()

      if (result.success) {
        toast.success(`Vygenerovaných ${result.count} výkazov`)
        router.refresh()
      } else {
        toast.error(result.error || 'Chyba pri generovaní výkazov')
      }
    } catch (error) {
      toast.error('Chyba pri generovaní výkazov')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rok</label>
            <Select
              value={String(defaultYear)}
              onValueChange={(v) => updateFilter('year', v)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Mesiac</label>
            <Select
              value={defaultMonth ? String(defaultMonth) : 'all'}
              onValueChange={(v) => updateFilter('month', v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Všetky" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                {MONTHS_SK.map((name, index) => (
                  <SelectItem key={index} value={String(index + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Vozidlo</label>
            <Select
              value={defaultVehicleId || 'all'}
              onValueChange={(v) => updateFilter('vehicleId', v)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Všetky vozidlá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky vozidlá</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.name} ({vehicle.license_plate})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Stav</label>
            <Select
              value={defaultStatus || 'all'}
              onValueChange={(v) => updateFilter('status', v)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Všetky" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                {Object.entries(REPORT_STATUS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1" />

          <Button
            onClick={handleGenerateReports}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="mr-2 h-4 w-4" />
            )}
            Generovať výkazy
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

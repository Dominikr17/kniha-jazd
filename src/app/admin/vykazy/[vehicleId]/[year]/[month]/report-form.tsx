'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Save, Loader2, Bot, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { MonthlyReportData, REPORT_STATUS, ReportStatus } from '@/types'

interface ReportFormProps {
  reportData: MonthlyReportData
}

export function ReportForm({ reportData }: ReportFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const calc = reportData.fuelStockCalculation
  const hasAutoCalculation = calc && calc.hasReferencePoint

  const [formData, setFormData] = useState({
    initialFuelStock: reportData.initialFuelStock,
    finalFuelStock: reportData.finalFuelStock,
    initialOdometer: reportData.initialOdometer,
    finalOdometer: reportData.finalOdometer,
    status: reportData.status,
    approvedBy: reportData.approvedBy || '',
    notes: reportData.notes || ''
  })

  const resetToAutoCalculated = () => {
    if (calc) {
      setFormData(prev => ({
        ...prev,
        initialFuelStock: calc.initialFuelStock,
        finalFuelStock: calc.finalFuelStock
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/vykazy/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: reportData.vehicleId,
          year: reportData.year,
          month: reportData.month,
          ...formData
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Výkaz bol uložený')
        router.refresh()
      } else {
        toast.error(result.error || 'Chyba pri ukladaní výkazu')
      }
    } catch (error) {
      toast.error('Chyba pri ukladaní výkazu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Editovateľné údaje</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="initialFuelStock" className="flex items-center gap-2">
                Počiatočná zásoba PHM (l)
                {hasAutoCalculation && (
                  <span title="Automaticky vypočítané" className="text-green-600">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
              </Label>
              <Input
                id="initialFuelStock"
                type="number"
                step="0.01"
                value={formData.initialFuelStock}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  initialFuelStock: parseFloat(e.target.value) || 0
                }))}
              />
              {hasAutoCalculation && formData.initialFuelStock !== calc.initialFuelStock && (
                <p className="text-xs text-muted-foreground">
                  Automaticky: {calc.initialFuelStock.toFixed(2)} l
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalFuelStock" className="flex items-center gap-2">
                Konečná zásoba PHM (l)
                {hasAutoCalculation && (
                  <span title="Automaticky vypočítané" className="text-green-600">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
              </Label>
              <Input
                id="finalFuelStock"
                type="number"
                step="0.01"
                value={formData.finalFuelStock}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  finalFuelStock: parseFloat(e.target.value) || 0
                }))}
              />
              {hasAutoCalculation && formData.finalFuelStock !== calc.finalFuelStock && (
                <p className="text-xs text-muted-foreground">
                  Automaticky: {calc.finalFuelStock.toFixed(2)} l
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="initialOdometer">Počiatočný stav tachometra (km)</Label>
              <Input
                id="initialOdometer"
                type="number"
                value={formData.initialOdometer}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  initialOdometer: parseInt(e.target.value) || 0
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalOdometer">Konečný stav tachometra (km)</Label>
              <Input
                id="finalOdometer"
                type="number"
                value={formData.finalOdometer}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  finalOdometer: parseInt(e.target.value) || 0
                }))}
              />
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Stav výkazu</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData(prev => ({
                  ...prev,
                  status: v as ReportStatus
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_STATUS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="approvedBy">Schvaľovateľ</Label>
              <Input
                id="approvedBy"
                value={formData.approvedBy}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  approvedBy: e.target.value
                }))}
                placeholder="Meno a priezvisko schvaľovateľa"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Poznámky</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              placeholder="Voliteľné poznámky k výkazu..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            {hasAutoCalculation && (
              <Button
                type="button"
                variant="outline"
                onClick={resetToAutoCalculated}
                disabled={isSubmitting}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Obnoviť automatický výpočet
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Uložiť výkaz
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

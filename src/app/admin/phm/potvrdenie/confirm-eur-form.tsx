'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { FUEL_CURRENCIES, FuelCurrency } from '@/types'

interface ConfirmEurFormProps {
  fuelRecordId: string
  originalCurrency: FuelCurrency
  originalTotalPrice: number
  liters: number
}

export function ConfirmEurForm({
  fuelRecordId,
  originalCurrency,
  originalTotalPrice,
  liters,
}: ConfirmEurFormProps) {
  const [eurTotalPrice, setEurTotalPrice] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const currencySymbol = FUEL_CURRENCIES[originalCurrency]?.symbol || originalCurrency

  // Výpočet EUR ceny za liter (pre náhľad)
  const eurPricePerLiter = eurTotalPrice && parseFloat(eurTotalPrice) > 0
    ? (parseFloat(eurTotalPrice) / liters).toFixed(3)
    : ''

  // Výpočet kurzu z porovnania súm (pre náhľad)
  const calculatedRate = eurTotalPrice && parseFloat(eurTotalPrice) > 0
    ? (originalTotalPrice / parseFloat(eurTotalPrice)).toFixed(4)
    : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!eurTotalPrice || parseFloat(eurTotalPrice) <= 0) {
      toast.error('Zadajte platnú EUR sumu')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/fuel-records/confirm-eur', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fuelRecordId,
          eurTotalPrice: parseFloat(eurTotalPrice),
          exchangeRate: exchangeRate ? parseFloat(exchangeRate) : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Nepodarilo sa potvrdiť')
      }

      toast.success('EUR suma bola potvrdená')
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Nepodarilo sa potvrdiť EUR sumu')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor={`eur-${fuelRecordId}`}>Celková suma v EUR *</Label>
          <Input
            id={`eur-${fuelRecordId}`}
            type="number"
            step="0.01"
            value={eurTotalPrice}
            onChange={(e) => setEurTotalPrice(e.target.value)}
            required
            disabled={isSubmitting}
            min={0}
            placeholder="napr. 85.50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`rate-${fuelRecordId}`}>Kurz ({originalCurrency}/EUR)</Label>
          <Input
            id={`rate-${fuelRecordId}`}
            type="number"
            step="0.0001"
            value={exchangeRate}
            onChange={(e) => setExchangeRate(e.target.value)}
            disabled={isSubmitting}
            min={0}
            placeholder={calculatedRate ? `~${calculatedRate}` : 'voliteľné'}
          />
        </div>
        <div className="space-y-2">
          <Label>Cena za liter (EUR)</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center font-medium text-sm">
            {eurPricePerLiter ? `${eurPricePerLiter} EUR/l` : '-'}
          </div>
        </div>
        <div className="space-y-2">
          <Label>&nbsp;</Label>
          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Potvrdzujem...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Potvrdiť
              </>
            )}
          </Button>
        </div>
      </div>

      {calculatedRate && !exchangeRate && (
        <p className="text-xs text-muted-foreground">
          Odhadovaný kurz podľa zadanej sumy: ~{calculatedRate} {currencySymbol}/EUR
        </p>
      )}
    </form>
  )
}

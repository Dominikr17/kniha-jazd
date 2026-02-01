'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { StatsPeriod } from '@/lib/driver-stats'

const PERIODS: { value: StatsPeriod; label: string }[] = [
  { value: 'this_month', label: 'Tento mesiac' },
  { value: 'this_year', label: 'Tento rok' },
  { value: 'last_12_months', label: 'Posledných 12 mesiacov' },
]

interface PeriodFilterProps {
  currentPeriod: StatsPeriod
}

export function PeriodFilter({ currentPeriod }: PeriodFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handlePeriodChange = (period: StatsPeriod) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', period)
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {PERIODS.map((period) => (
        <Button
          key={period.value}
          variant={currentPeriod === period.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePeriodChange(period.value)}
        >
          {period.label}
        </Button>
      ))}
    </div>
  )
}

'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PeriodFilterProps {
  currentPeriod: string
}

const periods = [
  { value: 'week', label: 'Tento týždeň' },
  { value: 'month', label: 'Tento mesiac' },
  { value: 'year', label: 'Tento rok' },
]

export function PeriodFilter({ currentPeriod }: PeriodFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', value)
    router.push(`/admin?${params.toString()}`)
  }

  return (
    <Select value={currentPeriod} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {periods.map((period) => (
          <SelectItem key={period.value} value={period.value}>
            {period.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatNumber, calculatePercentChange } from '@/lib/report-calculations'
import { cn } from '@/lib/utils'

interface ComparisonCardProps {
  title: string
  currentValue: number
  previousValue: number
  label: string
  previousLabel: string
  unit?: string
  inverseColors?: boolean // True ak nižšia hodnota je lepšia (napr. spotreba)
  decimals?: number
}

export function ComparisonCard({
  title,
  currentValue,
  previousValue,
  label,
  previousLabel,
  unit = '',
  inverseColors = false,
  decimals = 0,
}: ComparisonCardProps) {
  const percentChange = calculatePercentChange(currentValue, previousValue)
  const isPositive = percentChange !== null && percentChange > 0
  const isNegative = percentChange !== null && percentChange < 0
  const isNeutral = percentChange === null || Math.abs(percentChange) < 0.5

  // Určenie farby - zelená je dobrá, červená zlá
  let colorClass = 'text-muted-foreground'
  if (!isNeutral) {
    if (inverseColors) {
      // Nižšia hodnota je lepšia (spotreba, náklady)
      colorClass = isNegative ? 'text-green-600' : 'text-red-600'
    } else {
      // Vyššia hodnota je lepšia (km, počet jázd)
      colorClass = isPositive ? 'text-green-600' : 'text-red-600'
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-2xl font-bold">
              {formatNumber(currentValue, decimals)}
              {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
            </div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>

          {percentChange !== null && (
            <div className={cn('flex items-center gap-1', colorClass)}>
              {isNeutral ? (
                <Minus className="h-4 w-4" />
              ) : isPositive ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isNeutral ? '0' : (isPositive ? '+' : '')}{formatNumber(percentChange, 1)}%
              </span>
            </div>
          )}
        </div>

        {previousValue > 0 && (
          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
            {previousLabel}: {formatNumber(previousValue, decimals)} {unit}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

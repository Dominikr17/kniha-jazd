'use client'

import { useState, useMemo, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

export type SortDirection = 'asc' | 'desc'

/**
 * Hook pre zoraditeľnú tabuľku
 */
export function useSortableData<T, K extends string>(
  data: T[],
  defaultSortKey: K,
  getValue: (item: T, key: K) => string | number
) {
  const [sortKey, setSortKey] = useState<K>(defaultSortKey)
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const sortedData = useMemo(() => {
    return [...data].sort((a, b) => {
      const aValue = getValue(a, sortKey)
      const bValue = getValue(b, sortKey)

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue, 'sk')
          : bValue.localeCompare(aValue, 'sk')
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })
  }, [data, sortKey, sortDirection, getValue])

  const handleSort = useCallback((key: K) => {
    if (sortKey === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDirection('desc')
    }
  }, [sortKey])

  return { sortedData, sortKey, sortDirection, handleSort }
}

/**
 * Tlačidlo pre zoradenie stĺpca
 */
interface SortButtonProps<K extends string> {
  column: K
  label: string
  currentSortKey: K
  sortDirection: SortDirection
  onSort: (key: K) => void
}

export function SortButton<K extends string>({
  column,
  label,
  currentSortKey,
  sortDirection,
  onSort,
}: SortButtonProps<K>) {
  const isActive = currentSortKey === column

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 px-2 font-medium"
      onClick={() => onSort(column)}
    >
      {label}
      {isActive ? (
        sortDirection === 'asc' ? (
          <ArrowUp className="ml-1 h-4 w-4" />
        ) : (
          <ArrowDown className="ml-1 h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="ml-1 h-4 w-4 opacity-50" />
      )}
    </Button>
  )
}

/**
 * Legenda pre farebné označenie min/max hodnôt
 */
export function MinMaxLegend() {
  return (
    <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-green-100 border border-green-200 rounded" />
        <span>Najlepšia hodnota</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-3 h-3 bg-red-100 border border-red-200 rounded" />
        <span>Najhoršia hodnota</span>
      </div>
    </div>
  )
}

/**
 * CSS trieda pre zvýraznenie min/max hodnoty v bunke
 * @param value - aktuálna hodnota
 * @param minValue - minimálna hodnota v datasete
 * @param maxValue - maximálna hodnota v datasete
 * @param dataLength - počet záznamov (pre kontrolu či má zmysel zvýrazňovať)
 * @param lowerIsBetter - true ak nižšia hodnota je lepšia (napr. náklady, spotreba)
 */
export function getMinMaxCellClass(
  value: number,
  minValue: number,
  maxValue: number,
  dataLength: number,
  lowerIsBetter = false
): string {
  if (dataLength < 2) return ''

  const bestClass = 'bg-green-100 text-green-800'
  const worstClass = 'bg-red-100 text-red-800'

  if (value === minValue) {
    return lowerIsBetter ? bestClass : worstClass
  }
  if (value === maxValue) {
    return lowerIsBetter ? worstClass : bestClass
  }

  return ''
}

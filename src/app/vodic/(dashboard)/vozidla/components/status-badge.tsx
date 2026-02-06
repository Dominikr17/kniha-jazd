'use client'

import { differenceInDays, parseISO, format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { EXPIRY_CRITICAL_DAYS, EXPIRY_WARNING_DAYS } from '@/types'

interface StatusBadgeProps {
  label: string
  validUntil: string | null | undefined
}

type StatusType = 'ok' | 'warning' | 'critical' | 'unknown'

const STATUS_COLORS: Record<StatusType, string> = {
  ok: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  critical: 'bg-red-100 text-red-700 border-red-200',
  unknown: 'bg-gray-100 text-gray-500 border-gray-200',
}

function formatDaysText(daysLeft: number): string {
  if (daysLeft === 1) return 'o 1 deň'
  if (daysLeft < 5) return `o ${daysLeft} dni`
  return `o ${daysLeft} dní`
}

function getExpiryStatus(validUntil: string | null | undefined): { type: StatusType; text: string } {
  if (!validUntil) {
    return { type: 'unknown', text: 'Nezadané' }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiryDate = parseISO(validUntil)
  const daysUntilExpiry = differenceInDays(expiryDate, today)

  if (daysUntilExpiry < 0) {
    return { type: 'critical', text: 'EXPIROVANÉ' }
  }
  if (daysUntilExpiry === 0) {
    return { type: 'critical', text: 'DNES!' }
  }
  if (daysUntilExpiry < EXPIRY_CRITICAL_DAYS) {
    return { type: 'critical', text: formatDaysText(daysUntilExpiry) }
  }
  if (daysUntilExpiry < EXPIRY_WARNING_DAYS) {
    return { type: 'warning', text: formatDaysText(daysUntilExpiry) }
  }

  return {
    type: 'ok',
    text: format(expiryDate, 'd.M.yyyy', { locale: sk }),
  }
}

export function StatusBadge({ label, validUntil }: StatusBadgeProps) {
  const status = getExpiryStatus(validUntil)

  return (
    <div className={`inline-flex flex-col items-center px-3 py-2 rounded-lg border ${STATUS_COLORS[status.type]}`}>
      <span className="text-xs font-medium opacity-75">{label}</span>
      <span className="text-sm font-semibold">{status.text}</span>
    </div>
  )
}

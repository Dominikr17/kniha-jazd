'use client'

import { differenceInDays, parseISO, format } from 'date-fns'
import { sk } from 'date-fns/locale'

interface StatusBadgeProps {
  label: string
  validUntil: string | null | undefined
}

export function StatusBadge({ label, validUntil }: StatusBadgeProps) {
  const getStatus = () => {
    if (!validUntil) {
      return {
        color: 'bg-gray-100 text-gray-500 border-gray-200',
        text: 'Nezadané'
      }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiryDate = parseISO(validUntil)
    const daysLeft = differenceInDays(expiryDate, today)

    if (daysLeft < 0) {
      return {
        color: 'bg-red-100 text-red-700 border-red-200',
        text: 'EXPIROVANÉ'
      }
    } else if (daysLeft === 0) {
      return {
        color: 'bg-red-100 text-red-700 border-red-200',
        text: 'DNES!'
      }
    } else if (daysLeft < 7) {
      return {
        color: 'bg-red-100 text-red-700 border-red-200',
        text: `o ${daysLeft} ${daysLeft === 1 ? 'deň' : daysLeft < 5 ? 'dni' : 'dní'}`
      }
    } else if (daysLeft < 30) {
      return {
        color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        text: `o ${daysLeft} dní`
      }
    } else {
      const formattedDate = format(expiryDate, 'd.M.yyyy', { locale: sk })
      return {
        color: 'bg-green-100 text-green-700 border-green-200',
        text: formattedDate
      }
    }
  }

  const status = getStatus()

  return (
    <div className={`inline-flex flex-col items-center px-3 py-2 rounded-lg border ${status.color}`}>
      <span className="text-xs font-medium opacity-75">{label}</span>
      <span className="text-sm font-semibold">{status.text}</span>
    </div>
  )
}

import {
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfQuarter,
  endOfQuarter,
  startOfYear,
  endOfYear,
  format,
  parseISO,
  isValid,
} from 'date-fns'

export type PeriodType = 'this_month' | 'last_month' | 'quarter' | 'year' | 'custom' | 'all'

// Platné hodnoty obdobia pre validáciu
const VALID_PERIODS: PeriodType[] = ['this_month', 'last_month', 'quarter', 'year', 'custom', 'all']

export interface DateRange {
  from: Date
  to: Date
  label: string
}

/**
 * Validuje či reťazec je platné obdobie
 */
export function isValidPeriod(value: string): value is PeriodType {
  return VALID_PERIODS.includes(value as PeriodType)
}

/**
 * Bezpečne parsuje dátum - vráti null ak je neplatný
 */
function safeParseDate(dateStr: string): Date | null {
  // Validácia formátu yyyy-MM-dd
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return null
  }

  try {
    const date = parseISO(dateStr)
    return isValid(date) ? date : null
  } catch {
    return null
  }
}

/**
 * Validuje či reťazec je platné UUID v4
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(value)
}

/**
 * Získa dátumový rozsah pre zadané obdobie
 */
export function getDateRangeFromPeriod(
  period: PeriodType,
  customFrom?: string,
  customTo?: string
): DateRange | null {
  const now = new Date()

  switch (period) {
    case 'this_month':
      return {
        from: startOfMonth(now),
        to: endOfMonth(now),
        label: format(now, 'MMMM yyyy'),
      }

    case 'last_month': {
      const lastMonth = subMonths(now, 1)
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth),
        label: format(lastMonth, 'MMMM yyyy'),
      }
    }

    case 'quarter':
      return {
        from: startOfQuarter(now),
        to: endOfQuarter(now),
        label: `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`,
      }

    case 'year':
      return {
        from: startOfYear(now),
        to: endOfYear(now),
        label: String(now.getFullYear()),
      }

    case 'custom':
      if (customFrom && customTo) {
        const fromDate = safeParseDate(customFrom)
        const toDate = safeParseDate(customTo)

        // Ak sú oba dátumy platné a from <= to
        if (fromDate && toDate && fromDate <= toDate) {
          return {
            from: fromDate,
            to: toDate,
            label: `${format(fromDate, 'd.M.yyyy')} - ${format(toDate, 'd.M.yyyy')}`,
          }
        }
      }
      return null

    case 'all':
    default:
      return null
  }
}

/**
 * Formátuje dátum pre porovnanie s DB hodnotami (yyyy-MM-dd)
 */
export function formatDateForDB(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/**
 * Kontroluje či dátum je v rozsahu
 */
export function isDateInRange(dateStr: string, range: DateRange | null): boolean {
  if (!range) return true

  const date = parseISO(dateStr)
  return date >= range.from && date <= range.to
}

/**
 * Získa predchádzajúci mesiac pre MoM porovnanie
 */
export function getPreviousMonthRange(currentRange: DateRange): DateRange {
  const from = subMonths(currentRange.from, 1)
  const to = endOfMonth(from)
  return {
    from: startOfMonth(from),
    to,
    label: format(from, 'MMMM yyyy'),
  }
}

/**
 * Získa predchádzajúci rok pre YoY porovnanie (rovnaký mesiac minulého roka)
 */
export function getPreviousYearRange(currentRange: DateRange): DateRange {
  const from = new Date(currentRange.from)
  from.setFullYear(from.getFullYear() - 1)
  const to = endOfMonth(from)
  return {
    from: startOfMonth(from),
    to,
    label: format(from, 'MMMM yyyy'),
  }
}

/**
 * Definícia období pre select
 */
export const PERIOD_OPTIONS = [
  { value: 'all', label: 'Všetko' },
  { value: 'this_month', label: 'Tento mesiac' },
  { value: 'last_month', label: 'Minulý mesiac' },
  { value: 'quarter', label: 'Tento štvrťrok' },
  { value: 'year', label: 'Tento rok' },
  { value: 'custom', label: 'Vlastné obdobie' },
] as const

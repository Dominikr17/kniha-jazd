import {
  DOMESTIC_ALLOWANCE_RATES,
  ALLOWANCE_DEDUCTION_RATES,
  FOREIGN_ALLOWANCE_RATES,
  VEHICLE_AMORTIZATION,
  type TripAllowance,
  type BorderCrossing,
  type Trip,
} from '@/types'

interface MealDeductions {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

interface DayAllowanceInput {
  date: string
  country: string
  hours: number
  meals: MealDeductions
}

// Výpočet stravného pre jeden deň v jednej krajine
function calculateDayAllowance(input: DayAllowanceInput): Omit<TripAllowance, 'id' | 'created_at' | 'business_trip_id'> {
  const { date, country, hours, meals } = input
  const isForeign = country !== 'SK'

  let baseRate = 0
  let ratePercentage = 100
  let grossAmount = 0

  if (isForeign) {
    const countryRate = FOREIGN_ALLOWANCE_RATES[country]
    baseRate = countryRate ? countryRate.rate : 45

    if (hours <= 0) {
      ratePercentage = 0
    } else if (hours <= 6) {
      ratePercentage = 25
    } else if (hours <= 12) {
      ratePercentage = 50
    } else {
      ratePercentage = 100
    }

    grossAmount = Math.ceil((baseRate * ratePercentage / 100) * 100) / 100
  } else {
    // Tuzemská
    if (hours < 5) {
      baseRate = 0
      grossAmount = 0
    } else if (hours <= 12) {
      baseRate = DOMESTIC_ALLOWANCE_RATES['5_12h']
      grossAmount = baseRate
    } else if (hours <= 18) {
      baseRate = DOMESTIC_ALLOWANCE_RATES['12_18h']
      grossAmount = baseRate
    } else {
      baseRate = DOMESTIC_ALLOWANCE_RATES['nad_18h']
      grossAmount = baseRate
    }
  }

  // Krátenie stravného - vždy zo základnej 100% sadzby
  const fullDayRate = isForeign ? baseRate : grossAmount
  const breakfastDeduction = meals.breakfast ? Math.ceil(fullDayRate * ALLOWANCE_DEDUCTION_RATES.breakfast * 100) / 100 : 0
  const lunchDeduction = meals.lunch ? Math.ceil(fullDayRate * ALLOWANCE_DEDUCTION_RATES.lunch * 100) / 100 : 0
  const dinnerDeduction = meals.dinner ? Math.ceil(fullDayRate * ALLOWANCE_DEDUCTION_RATES.dinner * 100) / 100 : 0

  const totalDeductions = breakfastDeduction + lunchDeduction + dinnerDeduction
  const netAmount = Math.max(0, Math.ceil((grossAmount - totalDeductions) * 100) / 100)

  return {
    date,
    country,
    hours,
    base_rate: baseRate,
    rate_percentage: ratePercentage,
    gross_amount: grossAmount,
    breakfast_deduction: breakfastDeduction,
    lunch_deduction: lunchDeduction,
    dinner_deduction: dinnerDeduction,
    net_amount: netAmount,
    currency: 'EUR',
  }
}

// Generovanie zoznamu kalendárnych dní medzi departure a return (vrátane)
function getDateRange(departure: string, returnDate: string): string[] {
  const dates: string[] = []
  const start = new Date(departure)
  const end = new Date(returnDate)
  start.setHours(0, 0, 0, 0)
  end.setHours(0, 0, 0, 0)

  const current = new Date(start)
  while (current <= end) {
    const yyyy = current.getFullYear()
    const mm = String(current.getMonth() + 1).padStart(2, '0')
    const dd = String(current.getDate()).padStart(2, '0')
    dates.push(`${yyyy}-${mm}-${dd}`)
    current.setDate(current.getDate() + 1)
  }
  return dates
}

// Výpočet hodín pre daný deň podľa departure/return
function getHoursForDay(
  dayStr: string,
  departureDate: string,
  returnDate: string
): number {
  const dayStart = new Date(`${dayStr}T00:00:00`)
  const dayEnd = new Date(`${dayStr}T23:59:59`)
  const departure = new Date(departureDate)
  const returnD = new Date(returnDate)

  const effectiveStart = departure > dayStart ? departure : dayStart
  const effectiveEnd = returnD < dayEnd ? returnD : dayEnd

  if (effectiveEnd <= effectiveStart) return 0

  const hours = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60)
  return Math.round(hours * 10) / 10
}

// Určenie krajiny pre daný deň na základe prechodov hraníc
function getCountryForDay(
  dayStr: string,
  borderCrossings: BorderCrossing[],
  tripType: 'tuzemska' | 'zahranicna',
  destinationCountry: string | null
): string {
  if (tripType === 'tuzemska') return 'SK'
  if (!borderCrossings || borderCrossings.length === 0) {
    return destinationCountry || 'SK'
  }

  // Zoradiť prechody podľa dátumu
  const sorted = [...borderCrossings].sort(
    (a, b) => new Date(a.crossing_date).getTime() - new Date(b.crossing_date).getTime()
  )

  const dayDate = new Date(`${dayStr}T12:00:00`)

  // Nájsť poslednú krajinu pred/na tento deň
  let currentCountry = 'SK'
  for (const crossing of sorted) {
    if (new Date(crossing.crossing_date) <= dayDate) {
      currentCountry = crossing.country_to
    }
  }

  return currentCountry
}

export interface AllowanceCalculationInput {
  departureDate: string
  returnDate: string
  tripType: 'tuzemska' | 'zahranicna'
  destinationCountry: string | null
  borderCrossings: BorderCrossing[]
  meals: Record<string, MealDeductions> // key = date string YYYY-MM-DD
}

// Hlavná funkcia: výpočet stravného pre celú SC
export function calculateTripAllowances(
  input: AllowanceCalculationInput
): Omit<TripAllowance, 'id' | 'created_at' | 'business_trip_id'>[] {
  const {
    departureDate,
    returnDate,
    tripType,
    destinationCountry,
    borderCrossings,
    meals
  } = input

  const days = getDateRange(departureDate, returnDate)
  const allowances: Omit<TripAllowance, 'id' | 'created_at' | 'business_trip_id'>[] = []

  for (const day of days) {
    const hours = getHoursForDay(day, departureDate, returnDate)
    const country = getCountryForDay(day, borderCrossings, tripType, destinationCountry)
    const dayMeals = meals[day] || { breakfast: false, lunch: false, dinner: false }

    const allowance = calculateDayAllowance({
      date: day,
      country,
      hours,
      meals: dayMeals,
    })

    allowances.push(allowance)
  }

  return allowances
}

// Výpočet amortizácie vlastného vozidla
export function calculateAmortization(
  linkedTrips: Trip[],
  transportType: string
): number {
  const rate = transportType === 'AUV'
    ? VEHICLE_AMORTIZATION.AUV
    : transportType === 'MOV'
      ? VEHICLE_AMORTIZATION.MOV
      : 0

  if (rate === 0) return 0

  const totalKm = linkedTrips.reduce((sum, trip) => {
    const distance = trip.distance || (trip.odometer_end && trip.odometer_start ? trip.odometer_end - trip.odometer_start : 0)
    return sum + distance
  }, 0)

  return Math.ceil(totalKm * rate * 100) / 100
}

// Celkový výpočet
export interface TotalCalculation {
  totalAllowance: number
  totalExpenses: number
  totalAmortization: number
  totalAmount: number
  balance: number // záporné = doplatok, kladné = preplatok
}

export function calculateTotalAmount(
  allowances: { net_amount: number }[],
  expenses: { amount: number }[],
  amortization: number,
  advanceAmount: number
): TotalCalculation {
  const totalAllowance = Math.ceil(allowances.reduce((sum, a) => sum + a.net_amount, 0) * 100) / 100
  const totalExpenses = Math.ceil(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100
  const totalAmortization = amortization
  const totalAmount = Math.ceil((totalAllowance + totalExpenses + totalAmortization) * 100) / 100
  const balance = Math.ceil((advanceAmount - totalAmount) * 100) / 100

  return {
    totalAllowance,
    totalExpenses,
    totalAmortization,
    totalAmount,
    balance,
  }
}

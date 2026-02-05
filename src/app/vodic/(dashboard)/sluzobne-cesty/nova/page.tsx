'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, ChevronLeft, ChevronRight, Save, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  TRANSPORT_TYPES, FOREIGN_ALLOWANCE_RATES, COUNTRY_NAMES,
  EXPENSE_TYPES, BORDER_CROSSINGS_SK,
  type TransportType, type ExpenseType, type BorderCrossing, type Trip,
} from '@/types'
import {
  calculateTripAllowances, calculateAmortization, calculateTotalAmount,
  type AllowanceCalculationInput,
} from '@/lib/business-trip-calculator'

// Krokové komponenty
import StepTripsAndType from './step-trips-and-type'
import StepDetails from './step-details'
import StepMealsExpenses from './step-meals-expenses'
import StepSummary from './step-summary'

const STEPS = ['Jazdy a typ', 'Doplnenie údajov', 'Stravné a výdavky', 'Súhrn']

interface ExpenseInput {
  expense_type: ExpenseType
  description: string
  amount: number
  currency: string
  date: string
  receipt_number: string
}

interface BorderCrossingInput {
  crossing_date: string
  crossing_name: string
  country_from: string
  country_to: string
  direction: 'outbound' | 'inbound'
}

interface MealDeductions {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

export default function NewBusinessTripPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [driverId, setDriverId] = useState<string | null>(null)
  const [driverName, setDriverName] = useState('')

  // Krok 1: Jazdy a typ
  const [tripType, setTripType] = useState<'tuzemska' | 'zahranicna'>('tuzemska')
  const [destinationCountry, setDestinationCountry] = useState('')
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([])

  // Krok 2: Doplnenie údajov (auto-fill z jázd + ručné doplnenie)
  const [destinationCity, setDestinationCity] = useState('')
  const [purpose, setPurpose] = useState('')
  const [transportType, setTransportType] = useState<TransportType>('AUS_sluzobne')
  const [companion, setCompanion] = useState('')
  const [departureDate, setDepartureDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [advanceAmount, setAdvanceAmount] = useState(0)
  const [notes, setNotes] = useState('')
  const [borderCrossings, setBorderCrossings] = useState<BorderCrossingInput[]>([])

  // Krok 3: Stravné a výdavky
  const [meals, setMeals] = useState<Record<string, MealDeductions>>({})
  const [expenses, setExpenses] = useState<ExpenseInput[]>([])

  // Výpočty
  const [calculatedAllowances, setCalculatedAllowances] = useState<ReturnType<typeof calculateTripAllowances>>([])
  const [totalAllowance, setTotalAllowance] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [totalAmortization, setTotalAmortization] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [balance, setBalance] = useState(0)

  // Načítať driver session
  useEffect(() => {
    const fetchDriver = async () => {
      try {
        const res = await fetch('/api/driver/me')
        const data = await res.json()
        if (data.driverId) {
          setDriverId(data.driverId)
          setDriverName(data.driverName || '')
        }
      } catch {
        toast.error('Chyba pri načítaní vodiča')
      }
    }
    fetchDriver()
  }, [])

  // Auto-fill callback z kroku 1
  const handleAutoFill = useCallback((data: {
    departureDate: string
    returnDate: string
    destinationCity: string
    purpose: string
    transportType: string
  }) => {
    setDepartureDate(data.departureDate)
    setReturnDate(data.returnDate)
    setDestinationCity(data.destinationCity)
    setPurpose(data.purpose)
    if (data.transportType) {
      setTransportType(data.transportType as TransportType)
    }
  }, [])

  // Prepočítať stravné pri zmene relevantných dát
  const recalculate = useCallback(() => {
    if (!departureDate || !returnDate) return

    const input: AllowanceCalculationInput = {
      departureDate,
      returnDate,
      tripType,
      destinationCountry: destinationCountry || null,
      borderCrossings: borderCrossings as unknown as BorderCrossing[],
      meals,
    }

    const allowances = calculateTripAllowances(input)
    setCalculatedAllowances(allowances)

    const amortization = calculateAmortization(selectedTrips, transportType)
    setTotalAmortization(amortization)

    const totals = calculateTotalAmount(
      allowances,
      expenses.map((e) => ({ amount: e.amount })),
      amortization,
      advanceAmount
    )

    setTotalAllowance(totals.totalAllowance)
    setTotalExpenses(totals.totalExpenses)
    setTotalAmount(totals.totalAmount)
    setBalance(totals.balance)
  }, [departureDate, returnDate, tripType, destinationCountry, borderCrossings, meals, expenses, selectedTrips, transportType, advanceAmount])

  useEffect(() => {
    recalculate()
  }, [recalculate])

  const handleSave = async (submit = false) => {
    if (!driverId) {
      toast.error('Nie ste prihlásený')
      return
    }

    if (!destinationCity || !purpose || !departureDate || !returnDate) {
      toast.error('Vyplňte povinné polia (cieľ, účel, dátumy)')
      setCurrentStep(1)
      return
    }

    if (selectedTripIds.length === 0) {
      toast.error('Vyberte aspoň jednu jazdu')
      setCurrentStep(0)
      return
    }

    if (tripType === 'zahranicna' && borderCrossings.length === 0) {
      toast.error('Pre zahraničnú cestu zadajte aspoň jeden prechod hraníc')
      setCurrentStep(1)
      return
    }

    const setter = submit ? setIsSubmitting : setIsSaving
    setter(true)

    try {
      const payload = {
        trip_type: tripType,
        destination_country: tripType === 'zahranicna' ? destinationCountry : null,
        destination_city: destinationCity,
        purpose,
        transport_type: transportType,
        companion: companion || null,
        departure_date: departureDate,
        return_date: returnDate,
        advance_amount: advanceAmount,
        advance_currency: 'EUR',
        notes: notes || null,
        border_crossings: borderCrossings,
        allowances: calculatedAllowances,
        expenses,
        linked_trip_ids: selectedTripIds,
        total_allowance: totalAllowance,
        total_expenses: totalExpenses,
        total_amortization: totalAmortization,
        total_amount: totalAmount,
        balance,
      }

      const res = await fetch('/api/business-trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || 'Chyba pri ukladaní')
        setter(false)
        return
      }

      if (submit && data.data?.id) {
        const submitRes = await fetch(`/api/business-trips/${data.data.id}/submit`, {
          method: 'POST',
        })
        if (submitRes.ok) {
          toast.success('Služobná cesta bola odoslaná na schválenie')
        } else {
          toast.success('Služobná cesta bola uložená (odoslanie zlyhalo)')
        }
      } else {
        toast.success('Služobná cesta bola uložená')
      }

      router.push('/vodic/sluzobne-cesty')
      router.refresh()
    } catch {
      toast.error('Chyba pri ukladaní')
    } finally {
      setter(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return selectedTripIds.length > 0
      case 1:
        if (!destinationCity || !purpose || !departureDate || !returnDate) return false
        if (tripType === 'zahranicna' && borderCrossings.length === 0) return false
        return true
      case 2:
        return true
      case 3:
        return true
      default:
        return true
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-[#004B87]">Nová služobná cesta</h1>

      {/* Stepper */}
      <div className="flex items-center gap-1">
        {STEPS.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <button
              onClick={() => index < currentStep && setCurrentStep(index)}
              className={cn(
                'flex items-center gap-2 text-sm font-medium rounded-lg px-3 py-2 transition-colors w-full',
                index === currentStep && 'bg-[#004B87] text-white',
                index < currentStep && 'bg-[#FFC72C]/20 text-[#004B87] cursor-pointer hover:bg-[#FFC72C]/30',
                index > currentStep && 'bg-gray-100 text-gray-400'
              )}
            >
              <span className={cn(
                'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                index === currentStep && 'bg-white text-[#004B87]',
                index < currentStep && 'bg-[#FFC72C] text-[#004B87]',
                index > currentStep && 'bg-gray-200 text-gray-400'
              )}>
                {index + 1}
              </span>
              <span className="hidden lg:inline truncate">{step}</span>
            </button>
          </div>
        ))}
      </div>

      {/* Krokový obsah */}
      <div className="rounded-lg border p-6">
        {currentStep === 0 && driverId && (
          <StepTripsAndType
            driverId={driverId}
            tripType={tripType}
            setTripType={setTripType}
            destinationCountry={destinationCountry}
            setDestinationCountry={setDestinationCountry}
            selectedTripIds={selectedTripIds}
            setSelectedTripIds={setSelectedTripIds}
            selectedTrips={selectedTrips}
            setSelectedTrips={setSelectedTrips}
            onAutoFill={handleAutoFill}
          />
        )}

        {currentStep === 1 && (
          <StepDetails
            destinationCity={destinationCity}
            setDestinationCity={setDestinationCity}
            purpose={purpose}
            setPurpose={setPurpose}
            transportType={transportType}
            setTransportType={setTransportType}
            companion={companion}
            setCompanion={setCompanion}
            departureDate={departureDate}
            setDepartureDate={setDepartureDate}
            returnDate={returnDate}
            setReturnDate={setReturnDate}
            advanceAmount={advanceAmount}
            setAdvanceAmount={setAdvanceAmount}
            notes={notes}
            setNotes={setNotes}
            tripType={tripType}
            destinationCountry={destinationCountry}
            borderCrossings={borderCrossings}
            setBorderCrossings={setBorderCrossings}
          />
        )}

        {currentStep === 2 && (
          <StepMealsExpenses
            departureDate={departureDate}
            returnDate={returnDate}
            meals={meals}
            setMeals={setMeals}
            expenses={expenses}
            setExpenses={setExpenses}
            calculatedAllowances={calculatedAllowances}
          />
        )}

        {currentStep === 3 && (
          <StepSummary
            tripType={tripType}
            destinationCountry={destinationCountry}
            destinationCity={destinationCity}
            purpose={purpose}
            transportType={transportType}
            companion={companion}
            departureDate={departureDate}
            returnDate={returnDate}
            advanceAmount={advanceAmount}
            notes={notes}
            borderCrossings={borderCrossings}
            calculatedAllowances={calculatedAllowances}
            expenses={expenses}
            selectedTrips={selectedTrips}
            totalAllowance={totalAllowance}
            totalExpenses={totalExpenses}
            totalAmortization={totalAmortization}
            totalAmount={totalAmount}
            balance={balance}
          />
        )}
      </div>

      {/* Navigácia */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
          disabled={currentStep === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Späť
        </Button>

        <div className="flex items-center gap-2">
          {currentStep === STEPS.length - 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving || isSubmitting}
              >
                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Uložiť
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving || isSubmitting}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Odoslať na schválenie
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setCurrentStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={!canProceed()}
            >
              Ďalej
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { Plus, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { sk } from 'date-fns/locale'
import { EXPENSE_TYPES, COUNTRY_NAMES, type ExpenseType } from '@/types'

interface MealDeductions {
  breakfast: boolean
  lunch: boolean
  dinner: boolean
}

interface ExpenseInput {
  expense_type: ExpenseType
  description: string
  amount: number
  currency: string
  date: string
  receipt_number: string
}

interface StepMealsExpensesProps {
  departureDate: string
  returnDate: string
  meals: Record<string, MealDeductions>
  setMeals: (meals: Record<string, MealDeductions>) => void
  expenses: ExpenseInput[]
  setExpenses: (expenses: ExpenseInput[]) => void
  calculatedAllowances: {
    date: string
    country: string
    hours: number
    gross_amount: number
    net_amount: number
    breakfast_deduction: number
    lunch_deduction: number
    dinner_deduction: number
    currency: string
  }[]
}

function getDateRange(departure: string, returnDate: string): string[] {
  if (!departure || !returnDate) return []
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

export default function StepMealsExpenses({
  departureDate, returnDate, meals, setMeals,
  expenses, setExpenses, calculatedAllowances,
}: StepMealsExpensesProps) {
  const days = getDateRange(departureDate, returnDate)

  const updateMeal = (day: string, meal: keyof MealDeductions, value: boolean) => {
    const current = meals[day] || { breakfast: false, lunch: false, dinner: false }
    setMeals({ ...meals, [day]: { ...current, [meal]: value } })
  }

  const addExpense = () => {
    setExpenses([...expenses, {
      expense_type: 'other' as ExpenseType,
      description: '',
      amount: 0,
      currency: 'EUR',
      date: departureDate ? departureDate.split('T')[0] : '',
      receipt_number: '',
    }])
  }

  const updateExpense = (index: number, field: keyof ExpenseInput, value: string | number) => {
    const updated = [...expenses]
    updated[index] = { ...updated[index], [field]: value }
    setExpenses(updated)
  }

  const removeExpense = (index: number) => {
    setExpenses(expenses.filter((_, i) => i !== index))
  }

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

  return (
    <div className="space-y-6">
      {/* Stravné */}
      <div>
        <h3 className="font-medium mb-1">Stravné podľa dní</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Zaškrtnite poskytnuté jedlá (krátenie stravného).
        </p>

        <div className="space-y-2">
          {days.map((day) => {
            const dayMeals = meals[day] || { breakfast: false, lunch: false, dinner: false }
            const allowance = calculatedAllowances.find((a) => a.date === day)

            return (
              <div key={day} className="rounded-lg border p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm">
                      {format(new Date(day), 'EEEE d.M.yyyy', { locale: sk })}
                    </span>
                    {allowance && (
                      <span className="text-sm text-muted-foreground ml-2">
                        ({COUNTRY_NAMES[allowance.country] || allowance.country}, {allowance.hours}h)
                      </span>
                    )}
                  </div>
                  {allowance && (
                    <div className="text-right">
                      <span className="text-sm font-medium">
                        {allowance.net_amount.toFixed(2)} {allowance.currency}
                      </span>
                      {allowance.gross_amount !== allowance.net_amount && (
                        <span className="text-xs text-muted-foreground ml-1">
                          (z {allowance.gross_amount.toFixed(2)} {allowance.currency})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={dayMeals.breakfast}
                      onCheckedChange={(checked) => updateMeal(day, 'breakfast', !!checked)}
                    />
                    <span className="text-sm">Raňajky</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={dayMeals.lunch}
                      onCheckedChange={(checked) => updateMeal(day, 'lunch', !!checked)}
                    />
                    <span className="text-sm">Obed</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={dayMeals.dinner}
                      onCheckedChange={(checked) => updateMeal(day, 'dinner', !!checked)}
                    />
                    <span className="text-sm">Večera</span>
                  </label>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Výdavky */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Výdavky</h3>
            <p className="text-sm text-muted-foreground">
              Ubytovanie, parkovné, mýto a ďalšie výdavky.
            </p>
          </div>
          {totalExpenseAmount > 0 && (
            <span className="text-sm font-medium">
              Celkom: {totalExpenseAmount.toFixed(2)} €
            </span>
          )}
        </div>

        {expenses.map((expense, index) => (
          <div key={index} className="rounded-lg border p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Výdavok #{index + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeExpense(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Typ výdavku</Label>
                <Select
                  value={expense.expense_type}
                  onValueChange={(v) => updateExpense(index, 'expense_type', v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(EXPENSE_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Dátum</Label>
                <Input
                  type="date"
                  value={expense.date}
                  onChange={(e) => updateExpense(index, 'date', e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Popis</Label>
                <Input
                  value={expense.description}
                  onChange={(e) => updateExpense(index, 'description', e.target.value)}
                  placeholder="Popis výdavku"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Suma (€)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={expense.amount || ''}
                  onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        ))}

        <Button variant="outline" onClick={addExpense} className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Pridať výdavok
        </Button>
      </div>
    </div>
  )
}

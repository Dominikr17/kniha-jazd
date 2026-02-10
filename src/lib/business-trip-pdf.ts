import jsPDF from 'jspdf'
import {
  type BusinessTrip,
  type BorderCrossing,
  type TripAllowance,
  type TripExpense,
  type Trip,
  TRANSPORT_TYPES,
  EXPENSE_TYPES,
  COUNTRY_NAMES,
  BUSINESS_TRIP_STATUS,
} from '@/types'
import { ROBOTO_REGULAR_BASE64 } from './fonts/roboto-regular'
import { ROBOTO_BOLD_BASE64 } from './fonts/roboto-bold'

async function loadImageAsBase64(url: string, maxWidth = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const scale = maxWidth / img.width
      const width = maxWidth
      const height = img.height * scale
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/png', 0.9))
      } else {
        reject(new Error('Could not get canvas context'))
      }
    }
    img.onerror = reject
    img.src = url
  })
}

function registerFonts(doc: jsPDF) {
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64)
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  const hours = String(date.getHours()).padStart(2, '0')
  const mins = String(date.getMinutes()).padStart(2, '0')
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()} ${hours}:${mins}`
}

function formatAmount(amount: number, currency: string = 'EUR'): string {
  return `${amount.toFixed(2)} ${currency}`
}

interface BusinessTripPDFData {
  trip: BusinessTrip
  driverName: string
  driverPosition: string | null
  borderCrossings: BorderCrossing[]
  allowances: TripAllowance[]
  expenses: TripExpense[]
  linkedTrips: Trip[]
}

export async function generateBusinessTripPDF(data: BusinessTripPDFData): Promise<void> {
  const { trip, driverName, driverPosition, borderCrossings, allowances, expenses, linkedTrips } = data
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 15

  registerFonts(doc)
  doc.setFont('Roboto', 'normal')

  const primaryColor: [number, number, number] = [0, 75, 135]
  const accentColor: [number, number, number] = [255, 199, 44]

  let y = 15

  // Logo
  const logoWidth = 38
  const logoHeight = logoWidth / 3.7
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png')
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight)
  } catch {
    // Logo sa nepodarilo načítať
  }

  // === STRANA 1: VYÚČTOVANIE ===
  y += logoHeight + 8
  doc.setFontSize(14)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('VYÚČTOVANIE SLUŽOBNEJ CESTY', pageWidth / 2, y, { align: 'center' })

  y += 6
  doc.setFontSize(10)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Číslo: ${trip.trip_number}`, pageWidth / 2, y, { align: 'center' })

  // Accent linka
  y += 5
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)

  // Základné údaje
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)

  const info = [
    ['Meno a priezvisko:', driverName],
    ['Funkcia:', driverPosition || '—'],
    ['Typ cesty:', trip.trip_type === 'zahranicna' ? 'Zahraničná' : 'Tuzemská'],
    ['Cieľ cesty:', `${trip.destination_city}${trip.destination_country ? `, ${COUNTRY_NAMES[trip.destination_country] || trip.destination_country}` : ''}`],
    ['Miesto návštevy:', trip.visit_place || '—'],
    ['Účel cesty:', trip.purpose],
    ['Dopravný prostriedok:', TRANSPORT_TYPES[trip.transport_type] || trip.transport_type],
    ['Odchod:', formatDateTime(trip.departure_date)],
    ['Návrat:', formatDateTime(trip.return_date)],
    ['Spolucestujúci:', trip.companion || '—'],
    ['Stav:', BUSINESS_TRIP_STATUS[trip.status]],
  ]

  for (const [label, value] of info) {
    doc.setFont('Roboto', 'bold')
    doc.text(label, margin, y)
    doc.setFont('Roboto', 'normal')
    doc.text(String(value), margin + 50, y)
    y += 5
  }

  // Prechody hraníc (len zahraničná)
  if (trip.trip_type === 'zahranicna' && borderCrossings.length > 0) {
    y += 5
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Prechody hraníc', margin, y)
    y += 5

    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)

    // Hlavička tabuľky
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 5, 'F')
    doc.setFont('Roboto', 'bold')
    doc.text('Dátum a čas', margin + 2, y)
    doc.text('Prechod', margin + 42, y)
    doc.text('Z', margin + 95, y)
    doc.text('Do', margin + 115, y)
    doc.text('Smer', margin + 140, y)
    y += 5

    doc.setFont('Roboto', 'normal')
    for (const bc of borderCrossings) {
      doc.text(formatDateTime(bc.crossing_date), margin + 2, y)
      doc.text(bc.crossing_name, margin + 42, y)
      doc.text(COUNTRY_NAMES[bc.country_from] || bc.country_from, margin + 95, y)
      doc.text(COUNTRY_NAMES[bc.country_to] || bc.country_to, margin + 115, y)
      doc.text(bc.direction === 'outbound' ? 'Výjazd' : 'Príjazd', margin + 140, y)
      y += 4.5
    }
  }

  // Tabuľka stravného
  y += 5
  doc.setFontSize(9)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('Stravné', margin, y)
  y += 5

  doc.setFontSize(8)
  doc.setTextColor(0, 0, 0)

  // Hlavička
  doc.setFillColor(240, 240, 240)
  doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 5, 'F')
  doc.setFont('Roboto', 'bold')
  doc.text('Dátum', margin + 2, y)
  doc.text('Krajina', margin + 28, y)
  doc.text('Hodiny', margin + 55, y)
  doc.text('Sadzba', margin + 75, y)
  doc.text('%', margin + 95, y)
  doc.text('Hrubé', margin + 108, y)
  doc.text('Krátenie', margin + 128, y)
  doc.text('Čisté', margin + 155, y)
  y += 5

  doc.setFont('Roboto', 'normal')
  for (const allowance of allowances) {
    const cur = allowance.currency || 'EUR'
    doc.text(formatDate(allowance.date), margin + 2, y)
    doc.text(COUNTRY_NAMES[allowance.country] || allowance.country, margin + 28, y)
    doc.text(String(allowance.hours), margin + 55, y)
    doc.text(formatAmount(allowance.base_rate, cur), margin + 75, y)
    doc.text(`${allowance.rate_percentage}%`, margin + 95, y)
    doc.text(formatAmount(allowance.gross_amount, cur), margin + 108, y)
    const totalDed = allowance.breakfast_deduction + allowance.lunch_deduction + allowance.dinner_deduction
    doc.text(totalDed > 0 ? `-${formatAmount(totalDed, cur)}` : '—', margin + 128, y)
    doc.text(formatAmount(allowance.net_amount, cur), margin + 155, y)
    y += 4.5
  }

  // Výdavky
  if (expenses.length > 0) {
    y += 5
    doc.setFontSize(9)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Výdavky', margin, y)
    y += 5

    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)

    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y - 3.5, pageWidth - 2 * margin, 5, 'F')
    doc.setFont('Roboto', 'bold')
    doc.text('Dátum', margin + 2, y)
    doc.text('Typ', margin + 28, y)
    doc.text('Popis', margin + 65, y)
    doc.text('Suma', margin + 140, y)
    y += 5

    doc.setFont('Roboto', 'normal')
    for (const expense of expenses) {
      doc.text(formatDate(expense.date), margin + 2, y)
      doc.text(EXPENSE_TYPES[expense.expense_type] || expense.expense_type, margin + 28, y)
      doc.text(expense.description.substring(0, 40), margin + 65, y)
      doc.text(formatAmount(expense.amount), margin + 140, y)
      y += 4.5
    }
  }

  // Priradené jazdy
  if (linkedTrips.length > 0) {
    y += 5
    doc.setFontSize(9)
    doc.setFont('Roboto', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('Priradené jazdy', margin, y)
    y += 5

    doc.setFontSize(8)
    doc.setTextColor(0, 0, 0)
    let totalKm = 0
    for (const lt of linkedTrips) {
      const km = lt.distance || 0
      totalKm += km
      doc.text(`${formatDate(lt.date)}: ${lt.route_from} → ${lt.route_to} (${km} km)`, margin + 2, y)
      y += 4.5
    }
    doc.setFont('Roboto', 'bold')
    doc.text(`Celkom: ${totalKm} km`, margin + 2, y)
    y += 5
  }

  // Súhrn
  y += 5
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1)
  doc.line(margin, y, pageWidth - margin, y)
  y += 7

  doc.setFontSize(10)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('SÚHRN', margin, y)
  y += 7

  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  const allowanceCurrencies = [...new Set(allowances.map((a) => a.currency || 'EUR'))]
  const allowanceCurrency = allowanceCurrencies.length === 1 ? allowanceCurrencies[0] : 'EUR'

  const summaryRows = [
    ['Stravné:', formatAmount(trip.total_allowance, allowanceCurrency)],
    ['Výdavky:', formatAmount(trip.total_expenses)],
    ['Amortizácia:', formatAmount(trip.total_amortization)],
    ['Celkový nárok:', formatAmount(trip.total_amount, allowanceCurrency)],
    ['Preddavok:', formatAmount(trip.advance_amount)],
    [trip.balance >= 0 ? 'Preplatok:' : 'Doplatok:', formatAmount(Math.abs(trip.balance), allowanceCurrency)],
  ]

  for (const [label, value] of summaryRows) {
    doc.setFont('Roboto', 'bold')
    doc.text(label, margin, y)
    doc.setFont('Roboto', 'normal')
    doc.text(value, margin + 50, y)
    y += 5.5
  }

  // === STRANA 2: CESTOVNÝ PRÍKAZ ===
  doc.addPage()
  y = 15

  // Logo
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png')
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight)
  } catch {
    // Logo sa nepodarilo načítať
  }

  y += logoHeight + 8
  doc.setFontSize(14)
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text('CESTOVNÝ PRÍKAZ', pageWidth / 2, y, { align: 'center' })

  y += 6
  doc.setFontSize(10)
  doc.setFont('Roboto', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text(`Číslo: ${trip.trip_number}`, pageWidth / 2, y, { align: 'center' })

  y += 5
  doc.setDrawColor(...accentColor)
  doc.setLineWidth(1.5)
  doc.line(margin, y, pageWidth - margin, y)

  // Zamestnávateľ
  y += 10
  doc.setFontSize(9)
  doc.setTextColor(0, 0, 0)
  doc.setFont('Roboto', 'bold')
  doc.text('Zamestnávateľ:', margin, y)
  doc.setFont('Roboto', 'normal')
  doc.text('ZVL SLOVAKIA a.s.', margin + 50, y)

  y += 6
  doc.setFont('Roboto', 'bold')
  doc.text('Zamestnanec:', margin, y)
  doc.setFont('Roboto', 'normal')
  doc.text(driverName, margin + 50, y)

  y += 6
  doc.setFont('Roboto', 'bold')
  doc.text('Funkcia:', margin, y)
  doc.setFont('Roboto', 'normal')
  doc.text(driverPosition || '—', margin + 50, y)

  // Podpisový blok
  y += 25
  doc.setDrawColor(180, 180, 180)

  // Podpis 1
  doc.line(margin, y, margin + 60, y)
  y += 4
  doc.setFontSize(8)
  doc.text('Dátum a podpis zamestnanca', margin, y)

  y -= 4
  doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)
  y += 4
  doc.text('Schválil (vedúci)', pageWidth - margin - 60, y)

  y += 20
  doc.line(margin, y, margin + 60, y)
  y += 4
  doc.text('Dátum a podpis pokladníka', margin, y)

  y -= 4
  doc.line(pageWidth - margin - 60, y, pageWidth - margin, y)
  y += 4
  doc.text('Účtovanie', pageWidth - margin - 60, y)

  // Uloženie
  doc.save(`SC-${trip.trip_number}.pdf`)
}

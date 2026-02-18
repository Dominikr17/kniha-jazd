import jsPDF from 'jspdf'
import { MonthlyReportData, MONTHS_SK } from '@/types'
import { ROBOTO_REGULAR_BASE64 } from './fonts/roboto-regular'
import { ROBOTO_BOLD_BASE64 } from './fonts/roboto-bold'

async function loadImageAsBase64(url: string, maxWidth = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      // Zmenšenie obrázka pre menšiu veľkosť PDF
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
  // Registrácia Roboto fontov pre podporu diakritiky
  doc.addFileToVFS('Roboto-Regular.ttf', ROBOTO_REGULAR_BASE64)
  doc.addFileToVFS('Roboto-Bold.ttf', ROBOTO_BOLD_BASE64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold')
}

// Formátovanie čísla pre jsPDF — nahradí nezlomiteľné medzery (U+00A0) bežnými
function formatNumber(value: number): string {
  return value.toLocaleString('sk-SK').replace(/\u00A0/g, ' ')
}

export async function generateMonthlyReportPDF(data: MonthlyReportData): Promise<void> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()

  // Registrácia fontov s diakritikou
  registerFonts(doc)
  doc.setFont('Roboto', 'normal')

  // Firemné farby
  const primaryColor: [number, number, number] = [0, 75, 135] // #004B87
  const accentColor: [number, number, number] = [255, 199, 44] // #FFC72C

  let y = 15

  // Logo vycentrované (pomer strán 2022:546 = 3.7:1)
  const logoWidth = 38
  const logoHeight = logoWidth / 3.7
  try {
    const logoBase64 = await loadImageAsBase64('/logo.png')
    doc.addImage(logoBase64, 'PNG', (pageWidth - logoWidth) / 2, y, logoWidth, logoHeight)
  } catch (error) {
    console.warn('Could not load logo:', error)
  }

  // Hlavička - pod logom
  y += logoHeight + 8
  doc.setFontSize(16)
  doc.setTextColor(...primaryColor)
  doc.text('MESAČNÝ VÝKAZ SPOTREBY PHM', pageWidth / 2, y, { align: 'center' })

  y += 7
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  doc.text(`${MONTHS_SK[data.month - 1]} ${data.year}`, pageWidth / 2, y, { align: 'center' })

  y += 5

  // Informácie o vozidle
  y += 10
  doc.setFontSize(10)
  doc.setTextColor(0, 0, 0)

  const leftCol = 20
  const rightCol = 110

  doc.setFont('Roboto', 'bold')
  doc.text('Vozidlo:', leftCol, y)
  doc.setFont('Roboto', 'normal')
  doc.text(`${data.vehicleName} (${data.licensePlate})`, leftCol + 30, y)

  doc.setFont('Roboto', 'bold')
  doc.text('Zodpovedný vodič:', rightCol, y)
  doc.setFont('Roboto', 'normal')
  doc.text(data.responsibleDriverName || 'Nepriradený', rightCol + 45, y)

  // Čiara
  y += 8
  doc.setDrawColor(...primaryColor)
  doc.setLineWidth(0.5)
  doc.line(leftCol, y, pageWidth - 20, y)

  // Sekcia: Zásoby a nákup PHM
  y += 12
  doc.setFillColor(...accentColor)
  doc.rect(leftCol, y - 4, pageWidth - 40, 8, 'F')
  doc.setFont('Roboto', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text('ZÁSOBY A NÁKUP PHM', leftCol + 2, y + 1)

  y += 12
  doc.setFont('Roboto', 'normal')
  const addRow = (label: string, value: string, indent = 0) => {
    doc.text(label, leftCol + indent, y)
    doc.text(value, pageWidth - 20, y, { align: 'right' })
    y += 6
  }

  addRow('Počiatočná zásoba PHM:', `${data.initialFuelStock.toFixed(2)} l`)
  addRow('Nákup PHM tuzemsko (SK):', `${data.fuelPurchaseDomestic.toFixed(2)} l (${data.fuelCostDomestic.toFixed(2)} €)`)
  addRow('Nákup PHM zahraničie:', `${data.fuelPurchaseForeign.toFixed(2)} l (${data.fuelCostForeign.toFixed(2)} €)`)
  doc.setFont('Roboto', 'bold')
  addRow('Nákup PHM spolu:', `${data.fuelPurchaseTotal.toFixed(2)} l (${data.fuelCostTotal.toFixed(2)} €)`)
  doc.setFont('Roboto', 'normal')
  addRow('Konečná zásoba PHM:', `${data.finalFuelStock.toFixed(2)} l`)

  // Sekcia: Tachometer a kilometre
  y += 6
  doc.setFillColor(...accentColor)
  doc.rect(leftCol, y - 4, pageWidth - 40, 8, 'F')
  doc.setFont('Roboto', 'bold')
  doc.text('TACHOMETER A KILOMETRE', leftCol + 2, y + 1)

  y += 12
  doc.setFont('Roboto', 'normal')
  addRow('Počiatočný stav tachometra:', `${formatNumber(data.initialOdometer)} km`)
  addRow('Konečný stav tachometra:', `${formatNumber(data.finalOdometer)} km`)
  addRow('Kilometre služobne:', `${formatNumber(data.kmBusiness)} km`)
  addRow('Kilometre súkromne:', `${formatNumber(data.kmPrivate)} km`)
  doc.setFont('Roboto', 'bold')
  addRow('Kilometre spolu:', `${formatNumber(data.kmTotal)} km`)

  // Sekcia: Spotreba
  y += 6
  doc.setFillColor(...accentColor)
  doc.rect(leftCol, y - 4, pageWidth - 40, 8, 'F')
  doc.setFont('Roboto', 'bold')
  doc.text('SPOTREBA', leftCol + 2, y + 1)

  y += 12
  doc.setFont('Roboto', 'normal')
  addRow('Celková spotreba:', `${data.fuelConsumption.toFixed(2)} l`)
  addRow('Priemerná spotreba:', `${data.averageConsumption.toFixed(2)} l/100km`)
  if (data.ratedConsumption) {
    addRow('Normovaná spotreba:', `${data.ratedConsumption.toFixed(2)} l/100km`)
  }

  // Sekcia: Podpisy
  y += 10
  doc.setFillColor(...accentColor)
  doc.rect(leftCol, y - 4, pageWidth - 40, 8, 'F')
  doc.setFont('Roboto', 'bold')
  doc.text('PODPISY', leftCol + 2, y + 1)

  y += 15

  // Podpisové bloky
  const signBlockWidth = 70
  const signBlock1X = 30
  const signBlock2X = pageWidth - signBlockWidth - 30

  // Predkladateľ
  doc.setFont('Roboto', 'normal')
  doc.text('Predkladateľ:', signBlock1X, y)
  y += 15
  doc.line(signBlock1X, y, signBlock1X + signBlockWidth, y)
  y += 5
  doc.setFontSize(8)
  doc.text(data.responsibleDriverName || 'Nepriradený', signBlock1X, y)
  doc.text('(zodpovedný vodič)', signBlock1X, y + 4)

  // Schvaľovateľ - vrátime y späť
  y -= 20
  doc.setFontSize(10)
  doc.text('Schvaľovateľ:', signBlock2X, y)
  y += 15
  doc.line(signBlock2X, y, signBlock2X + signBlockWidth, y)
  y += 5
  doc.setFontSize(8)
  doc.text(data.approvedBy || '................................', signBlock2X, y)
  doc.text('(ekonomické oddelenie)', signBlock2X, y + 4)

  // Dátum vytvorenia
  y += 20
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  const today = new Date().toLocaleDateString('sk-SK')
  doc.text(`Vytvorené: ${today}`, leftCol, y)
  doc.text('ZVL SLOVAKIA - Elektronická kniha jázd', pageWidth - 20, y, { align: 'right' })

  // Stiahnutie
  const filename = `vykaz-phm-${data.licensePlate.replace(/\s/g, '-')}-${data.year}-${String(data.month).padStart(2, '0')}.pdf`
  doc.save(filename)
}

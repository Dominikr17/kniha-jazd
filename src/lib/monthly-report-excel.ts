import ExcelJS from 'exceljs'
import { MonthlyReportData, MONTHS_SK, REPORT_STATUS } from '@/types'

export async function generateMonthlyReportExcel(data: MonthlyReportData): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'ZVL SLOVAKIA - Elektronicka kniha jazd'
  wb.created = new Date()

  const ws = wb.addWorksheet('Vykaz PHM')

  // Nastavenie šírky stĺpcov
  ws.columns = [
    { width: 35 },
    { width: 25 },
    { width: 20 },
  ]

  const rows: (string | number)[][] = [
    ['MESACNY VYKAZ SPOTREBY PHM'],
    [`${MONTHS_SK[data.month - 1]} ${data.year}`],
    [],

    ['Vozidlo', `${data.vehicleName} (${data.licensePlate})`],
    ['Zodpovedny vodic', data.responsibleDriverName || 'Nepriradeny'],
    ['Stav vykazu', REPORT_STATUS[data.status]],
    [],

    ['ZASOBY A NAKUP PHM'],
    ['Polozka', 'Litrov', 'Naklady (EUR)'],
    ['Pociatocna zasoba PHM', data.initialFuelStock.toFixed(2), ''],
    ['Nakup PHM tuzemsko (SK)', data.fuelPurchaseDomestic.toFixed(2), data.fuelCostDomestic.toFixed(2)],
    ['Nakup PHM zahranicie', data.fuelPurchaseForeign.toFixed(2), data.fuelCostForeign.toFixed(2)],
    ['Nakup PHM spolu', data.fuelPurchaseTotal.toFixed(2), data.fuelCostTotal.toFixed(2)],
    ['Konecna zasoba PHM', data.finalFuelStock.toFixed(2), ''],
    [],

    ['TACHOMETER A KILOMETRE'],
    ['Polozka', 'Hodnota'],
    ['Pociatocny stav tachometra', `${data.initialOdometer.toLocaleString('sk-SK')} km`],
    ['Konecny stav tachometra', `${data.finalOdometer.toLocaleString('sk-SK')} km`],
    ['Kilometre sluzobne', `${data.kmBusiness.toLocaleString('sk-SK')} km`],
    ['Kilometre sukromne', `${data.kmPrivate.toLocaleString('sk-SK')} km`],
    ['Kilometre spolu', `${data.kmTotal.toLocaleString('sk-SK')} km`],
    [],

    ['SPOTREBA'],
    ['Polozka', 'Hodnota'],
    ['Celkova spotreba', `${data.fuelConsumption.toFixed(2)} l`],
    ['Priemerna spotreba', `${data.averageConsumption.toFixed(2)} l/100km`],
    ['Normovana spotreba', data.ratedConsumption ? `${data.ratedConsumption.toFixed(2)} l/100km` : 'N/A'],
    [],

    ['PODPISY'],
    ['Predkladatel (zodp. vodic)', data.responsibleDriverName || 'Nepriradeny'],
    ['Schvalovatel', data.approvedBy || ''],
    ['Datum schvalenia', data.approvedAt ? new Date(data.approvedAt).toLocaleDateString('sk-SK') : ''],
    [],

    ['POZNAMKY'],
    [data.notes || ''],
    [],

    ['Vytvorene', new Date().toLocaleDateString('sk-SK')],
    ['System', 'ZVL SLOVAKIA - Elektronicka kniha jazd'],
  ]

  ws.addRows(rows)

  // Stiahnutie cez buffer → Blob
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url = URL.createObjectURL(blob)
  const filename = `vykaz-phm-${data.licensePlate.replace(/\s/g, '-')}-${data.year}-${String(data.month).padStart(2, '0')}.xlsx`

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

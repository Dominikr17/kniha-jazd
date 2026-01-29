import * as XLSX from 'xlsx'
import { MonthlyReportData, MONTHS_SK, REPORT_STATUS } from '@/types'

export async function generateMonthlyReportExcel(data: MonthlyReportData): Promise<void> {
  // Vytvorenie workbooku
  const wb = XLSX.utils.book_new()

  // Dáta pre sheet
  const sheetData = [
    // Hlavička
    ['MESACNY VYKAZ SPOTREBY PHM'],
    [`${MONTHS_SK[data.month - 1]} ${data.year}`],
    [],

    // Informácie o vozidle
    ['Vozidlo', `${data.vehicleName} (${data.licensePlate})`],
    ['Zodpovedny vodic', data.responsibleDriverName || 'Nepriradeny'],
    ['Stav vykazu', REPORT_STATUS[data.status]],
    [],

    // Zásoby a nákup PHM
    ['ZASOBY A NAKUP PHM'],
    ['Polozka', 'Litrov', 'Naklady (EUR)'],
    ['Pociatocna zasoba PHM', data.initialFuelStock.toFixed(2), ''],
    ['Nakup PHM tuzemsko (SK)', data.fuelPurchaseDomestic.toFixed(2), data.fuelCostDomestic.toFixed(2)],
    ['Nakup PHM zahranicie', data.fuelPurchaseForeign.toFixed(2), data.fuelCostForeign.toFixed(2)],
    ['Nakup PHM spolu', data.fuelPurchaseTotal.toFixed(2), data.fuelCostTotal.toFixed(2)],
    ['Konecna zasoba PHM', data.finalFuelStock.toFixed(2), ''],
    [],

    // Tachometer a kilometre
    ['TACHOMETER A KILOMETRE'],
    ['Polozka', 'Hodnota'],
    ['Pociatocny stav tachometra', `${data.initialOdometer.toLocaleString('sk-SK')} km`],
    ['Konecny stav tachometra', `${data.finalOdometer.toLocaleString('sk-SK')} km`],
    ['Kilometre sluzobne', `${data.kmBusiness.toLocaleString('sk-SK')} km`],
    ['Kilometre sukromne', `${data.kmPrivate.toLocaleString('sk-SK')} km`],
    ['Kilometre spolu', `${data.kmTotal.toLocaleString('sk-SK')} km`],
    [],

    // Spotreba
    ['SPOTREBA'],
    ['Polozka', 'Hodnota'],
    ['Celkova spotreba', `${data.fuelConsumption.toFixed(2)} l`],
    ['Priemerna spotreba', `${data.averageConsumption.toFixed(2)} l/100km`],
    ['Normovana spotreba', data.ratedConsumption ? `${data.ratedConsumption.toFixed(2)} l/100km` : 'N/A'],
    [],

    // Podpisy
    ['PODPISY'],
    ['Predkladatel (zodp. vodic)', data.responsibleDriverName || 'Nepriradeny'],
    ['Schvalovatel', data.approvedBy || ''],
    ['Datum schvalenia', data.approvedAt ? new Date(data.approvedAt).toLocaleDateString('sk-SK') : ''],
    [],

    // Poznámky
    ['POZNAMKY'],
    [data.notes || ''],
    [],

    // Pätička
    ['Vytvorene', new Date().toLocaleDateString('sk-SK')],
    ['System', 'ZVL SLOVAKIA - Elektronicka kniha jazd']
  ]

  // Vytvorenie sheetu
  const ws = XLSX.utils.aoa_to_sheet(sheetData)

  // Nastavenie šírky stĺpcov
  ws['!cols'] = [
    { wch: 35 },
    { wch: 25 },
    { wch: 20 }
  ]

  // Pridanie sheetu do workbooku
  XLSX.utils.book_append_sheet(wb, ws, 'Vykaz PHM')

  // Stiahnutie
  const filename = `vykaz-phm-${data.licensePlate.replace(/\s/g, '-')}-${data.year}-${String(data.month).padStart(2, '0')}.xlsx`
  XLSX.writeFile(wb, filename)
}

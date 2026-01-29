import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Vypočíta vzdialenosť jazdy z tachometra
 */
export function calculateTripDistance(odometerStart: string, odometerEnd: string): number | null {
  if (!odometerStart || !odometerEnd) return null
  const start = parseInt(odometerStart, 10)
  const end = parseInt(odometerEnd, 10)
  if (isNaN(start) || isNaN(end)) return null
  const distance = end - start
  return distance >= 0 ? distance : null
}

/**
 * Vyriešenie účelu cesty - ak je "Iné", použije vlastný účel
 */
export function resolvePurpose(purpose: string, customPurpose: string): string {
  return purpose === 'Iné' ? customPurpose : purpose
}

/**
 * Výpočet ceny tankovania s DPH
 */
export function calculateFuelPrice(liters: string, pricePerLiter: string, vatRate: number) {
  const litersNum = parseFloat(liters) || 0
  const priceNum = parseFloat(pricePerLiter) || 0
  const totalWithVat = litersNum * priceNum
  const totalWithoutVat = totalWithVat / (1 + vatRate / 100)
  return {
    totalWithVat: Math.round(totalWithVat * 100) / 100,
    totalWithoutVat: Math.round(totalWithoutVat * 100) / 100,
  }
}

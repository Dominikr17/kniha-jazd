import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DRIVER_EDIT_TIME_LIMIT_MINUTES } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Vráti aktuálny dátum vo formáte YYYY-MM-DD
 * Používa lokálny čas (nie UTC) - bezpečné pre CET/CEST
 */
export function getLocalDateString(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * Skontroluje, či je záznam v rámci časového limitu na úpravu/zmazanie
 */
export function isWithinEditTimeLimit(createdAt: string): boolean {
  const created = new Date(createdAt)
  const now = new Date()
  const diffMinutes = (now.getTime() - created.getTime()) / (1000 * 60)
  return diffMinutes <= DRIVER_EDIT_TIME_LIMIT_MINUTES
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

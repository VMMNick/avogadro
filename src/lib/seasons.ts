import { TIME_ZONE } from './constants'

/** Волейбольний сезон починається в серпні: 1 серпня 2025 – 31 липня 2026 → «2025/26». */
export const SEASON_START_MONTH = 8

const parts = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, year: 'numeric', month: 'numeric' })

/** Рік початку сезону для дати (за київським часом). */
export function seasonStartYear(date: Date) {
  const p = parts.formatToParts(date)
  const year = Number(p.find((x) => x.type === 'year')?.value)
  const month = Number(p.find((x) => x.type === 'month')?.value)
  return month >= SEASON_START_MONTH ? year : year - 1
}

/** Ключ сезону: «2025-26». */
export function seasonKey(date: Date) {
  const y = seasonStartYear(date)
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`
}

/** Підпис сезону: «2025/26». */
export const seasonLabel = (key: string) => key.replace('-', '/')

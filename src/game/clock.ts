import type { Hemisphere, Season, TimeOfDay } from './types'

const NORTH_BY_MONTH: Season[] = [
  'winter', 'winter', 'spring', 'spring', 'spring', 'summer',
  'summer', 'summer', 'autumn', 'autumn', 'autumn', 'winter',
]
const FLIP: Record<Season, Season> = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' }

export function seasonOf(date: Date, hemisphere: Hemisphere): Season {
  const north = NORTH_BY_MONTH[date.getMonth()]
  return hemisphere === 'north' ? north : FLIP[north]
}

export function timeOfDay(date: Date): TimeOfDay {
  const h = date.getHours()
  if (h >= 5 && h < 8) return 'dawn'
  if (h >= 8 && h < 17) return 'day'
  if (h >= 17 && h < 20) return 'dusk'
  return 'night'
}

/** Days 0–~20 into the first month of spring: when the cherry blossoms are out. */
export function isBlossomTime(date: Date, hemisphere: Hemisphere): boolean {
  const springStart = hemisphere === 'north' ? 2 : 8
  const m = date.getMonth()
  return (m === springStart && date.getDate() >= 20) || (m === springStart + 1 && date.getDate() <= 25)
}

export const SEASON_LABEL: Record<Season, string> = {
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter',
}

export const SEASON_ICON: Record<Season, string> = { spring: '🌸', summer: '☀️', autumn: '🍁', winter: '❄️' }

/** Local yyyy-mm-dd. */
export function isoDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${m}-${d}`
}

export function parseDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function daysBetween(a: Date, b: Date): number {
  const start = new Date(a.getFullYear(), a.getMonth(), a.getDate())
  const end = new Date(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((end.getTime() - start.getTime()) / 86_400_000)
}

export function prettyDay(day: string): string {
  return parseDay(day).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

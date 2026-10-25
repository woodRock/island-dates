import { hash } from './text'
import type { Category, Cost, IslandItem, ItemType, Recipe, Season } from './types'

export const MILES_PER_DATE = 500

// ── Island geometry (SVG viewBox 0 0 400 320) ───────────────────────────────

export const VIEW = { w: 400, h: 320 }
export const SAND = { cx: 200, cy: 205, rx: 182, ry: 100 }
export const GRASS = { cx: 200, cy: 200, rx: 150, ry: 76 }
/** The house's footprint, kept clear of items. */
export const HOUSE = { x: 200, y: 168 }
const HOUSE_CLEAR = { x0: 158, x1: 242, y0: 112, y1: 186 }

const BEACH_TYPES: ItemType[] = ['shell', 'palm', 'beachChair']

/** Seeded shuffle so slots fill in a scattered but stable order. */
function shuffled<T>(list: T[], seed: number): T[] {
  const out = [...list]
  let s = seed
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

const GRASS_SLOTS: { x: number; y: number }[] = (() => {
  const slots = []
  for (let y = 138; y <= 268; y += 17) {
    for (let x = 64; x <= 336; x += 23) {
      const nx = (x - GRASS.cx) / (GRASS.rx * 0.9)
      const ny = (y - GRASS.cy) / (GRASS.ry * 0.92)
      if (nx * nx + ny * ny > 1) continue
      if (x > HOUSE_CLEAR.x0 && x < HOUSE_CLEAR.x1 && y > HOUSE_CLEAR.y0 && y < HOUSE_CLEAR.y1) continue
      // The path from the front door down to the beach.
      if (Math.abs(x - HOUSE.x) < 12 && y > HOUSE_CLEAR.y1) continue
      const j = hash(`${x},${y}`)
      slots.push({ x: x + (j % 7), y: y + ((j >> 3) % 5) })
    }
  }
  return shuffled(slots, 7)
})()

const BEACH_SLOTS: { x: number; y: number }[] = (() => {
  const slots = []
  for (let i = 0; i < 26; i++) {
    const t = (i / 26) * Math.PI * 2
    // Only the front and sides of the beach: the back sits behind the grass.
    if (Math.sin(t) < -0.35) continue
    slots.push({ x: SAND.cx + Math.cos(t) * 166, y: SAND.cy + Math.sin(t) * 88 })
  }
  return shuffled(slots, 3)
})()

export function placeItem(type: ItemType, items: IslandItem[]): { x: number; y: number } {
  const slots = BEACH_TYPES.includes(type) ? BEACH_SLOTS : GRASS_SLOTS
  const taken = (s: { x: number; y: number }) => items.some((it) => Math.abs(it.x - s.x) < 4 && Math.abs(it.y - s.y) < 4)
  const free = slots.find((s) => !taken(s))
  if (free) return free
  // A full island: nestle in beside an existing slot.
  const s = slots[items.length % slots.length]
  return { x: s.x + ((items.length * 5) % 11) - 5, y: s.y + 6 }
}

const DATE_ITEMS: Record<Category, ItemType[]> = {
  aquarium: ['shell', 'palm', 'beachChair'],
  insects: ['tree', 'flower', 'bush', 'flower'],
  fossils: ['bench', 'lamp', 'tree', 'mailbox'],
  gallery: ['easel', 'flower', 'statue', 'pinwheel'],
}

/** The item a date in this wing grows on the island; cycles so repeat dates bring variety. */
export function itemForDate(category: Category, countInWing: number): ItemType {
  const pool = DATE_ITEMS[category]
  return pool[countInWing % pool.length]
}

export interface DecorOffer {
  type: ItemType
  name: string
  cost: number
}

export const DECOR_SHOP: DecorOffer[] = [
  { type: 'flower', name: 'Flower patch', cost: 200 },
  { type: 'bush', name: 'Hedge bush', cost: 300 },
  { type: 'pinwheel', name: 'Pinwheel', cost: 400 },
  { type: 'pumpkin', name: 'Pumpkin', cost: 500 },
  { type: 'bench', name: 'Garden bench', cost: 600 },
  { type: 'lamp', name: 'Street lamp', cost: 800 },
  { type: 'palm', name: 'Palm tree', cost: 900 },
  { type: 'statue', name: 'Stone statue', cost: 1500 },
  { type: 'fountain', name: 'Fountain', cost: 3000 },
]

// ── Recipe filters ──────────────────────────────────────────────────────────

export type Filter = 'cheap' | 'cosy' | 'outdoors' | 'inSeason'

export const FILTERS: { id: Filter; label: string; icon: string }[] = [
  { id: 'cheap', label: 'Cheap', icon: '🔔' },
  { id: 'cosy', label: 'Cosy', icon: '🧣' },
  { id: 'outdoors', label: 'Outdoors', icon: '🌳' },
  { id: 'inSeason', label: 'In season', icon: '🍃' },
]

export function matches(recipe: Recipe, filters: Filter[], season: Season): boolean {
  return filters.every((f) => {
    switch (f) {
      case 'cheap':
        return recipe.cost <= (1 as Cost)
      case 'cosy':
        return recipe.setting === 'indoor'
      case 'outdoors':
        return recipe.setting === 'outdoor'
      case 'inSeason':
        return recipe.season === season
    }
  })
}

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)

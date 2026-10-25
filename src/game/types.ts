// Shapes mirror the planned Firestore documents (islands/{id}/...), so Phase 2 can sync them as they are.

export type Hemisphere = 'north' | 'south'
export type Season = 'spring' | 'summer' | 'autumn' | 'winter'
export type TimeOfDay = 'dawn' | 'day' | 'dusk' | 'night'
export type Category = 'aquarium' | 'insects' | 'fossils' | 'gallery'
export type Setting = 'indoor' | 'outdoor'
/** 0 = free, 1–3 = $ to $$$. */
export type Cost = 0 | 1 | 2 | 3
/**
 * A resident: their Firebase uid once signed in. Local mode, and a partner who hasn't joined yet,
 * use placeholder ids ('p1', 'p2') that are swapped for the real uid on joining.
 */
export type PlayerId = string
export type ThemePref = 'auto' | 'light' | 'dark'

export interface Member {
  id: PlayerId
  name: string
}

export interface Island {
  name: string
  hemisphere: Hemisphere
  /** Always two: you and your partner (a placeholder until they join). */
  members: Member[]
  /** Signed-in residents; security rules only let these read or write the island. */
  memberUids: string[]
  milesBalance: number
  createdAt: number
  /** Set while waiting for the partner to join; removed once they have. */
  inviteCode?: string
}

export interface Recipe {
  id: string
  title: string
  icon: string
  cost: Cost
  durationMins: number
  setting: Setting
  season?: Season
  category: Category
  materials: string[]
  source: 'starter' | 'bottle' | 'custom'
  createdBy?: PlayerId
}

export interface Memory {
  id: string
  recipeId?: string
  title: string
  icon: string
  category: Category
  /** yyyy-mm-dd */
  date: string
  place: string
  note: string
  ratings: Record<PlayerId, number>
  blathersLine: string
  /** A small JPEG data URL for display cases; the full photo lives in photos/{memoryId}. */
  thumb?: string
  hasPhoto?: boolean
  /** Id of the island item this date added. */
  itemAwarded?: string
  createdBy: PlayerId
  createdAt: number
}

export interface Reward {
  id: string
  title: string
  icon: string
  cost: number
  createdBy?: PlayerId
}

export interface Redemption {
  id: string
  rewardId: string
  title: string
  cost: number
  uid: PlayerId
  at: number
}

export type ItemType =
  | 'tree'
  | 'palm'
  | 'flower'
  | 'bush'
  | 'shell'
  | 'beachChair'
  | 'bench'
  | 'lamp'
  | 'mailbox'
  | 'easel'
  | 'statue'
  | 'pinwheel'
  | 'fountain'
  | 'pumpkin'

export interface IslandItem {
  id: string
  type: ItemType
  x: number
  y: number
  source: 'starter' | 'date' | 'event' | 'shop'
  /** Small variation (flower colour, tree shape) so repeats don't look identical. */
  variant: number
  memoryId?: string
  createdAt: number
}

export interface MilesEntry {
  id: string
  amount: number
  label: string
  at: number
}

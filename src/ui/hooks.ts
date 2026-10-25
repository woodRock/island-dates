import { useEffect, useState } from 'react'
import { seasonOf, timeOfDay } from '../game/clock'
import type { PlayerId } from '../game/types'
import { useIsland } from '../store'

/** The current time, refreshed every minute and whenever the app comes back to the foreground. */
export function useNow(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return now
}

export function useClock() {
  const now = useNow()
  const hemisphere = useIsland((s) => s.island?.hemisphere ?? 'south')
  return { now, season: seasonOf(now, hemisphere), tod: timeOfDay(now) }
}

export function useMemberName(): (id: PlayerId) => string {
  const members = useIsland((s) => s.island?.members)
  return (id) => members?.find((m) => m.id === id)?.name ?? '?'
}

export const miles = (n: number) => n.toLocaleString()

/** A memory's full photo, fetched on demand; shows the thumbnail while it loads. */
export function useMemoryPhoto(memoryId: string | undefined, hasPhoto: boolean | undefined, load: (id: string) => Promise<string | null>) {
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    setSrc(null)
    if (!memoryId || !hasPhoto) return
    let live = true
    void load(memoryId).then((data) => live && setSrc(data))
    return () => {
      live = false
    }
  }, [memoryId, hasPhoto, load])
  return src
}

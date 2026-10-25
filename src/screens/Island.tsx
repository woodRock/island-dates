import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { prettyDay, SEASON_ICON, SEASON_LABEL } from '../game/clock'
import { announcements, ITEM_LABEL, withArticle } from '../game/text'
import type { IslandItem } from '../game/types'
import { isDonated, useIsland } from '../store'
import { IslandScene, SeasonParticles } from '../ui/IslandArt'
import { Toast, Villager } from '../ui/kit'
import { miles, useClock } from '../ui/hooks'
import { Settings } from './Settings'

export function IslandHome() {
  const island = useIsland((s) => s.island)!
  const memories = useIsland((s) => s.memories)
  const recipes = useIsland((s) => s.recipes)
  const items = useIsland((s) => s.islandItems)
  const freshItemId = useIsland((s) => s.freshItemId)
  const clearFresh = useIsland((s) => s.clearFresh)
  const openLog = useIsland((s) => s.openLog)
  const logging = useIsland((s) => s.logging)
  const me = useIsland((s) => s.me)
  const { now, season, tod } = useClock()
  const [msgIndex, setMsgIndex] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const hideToast = useCallback(() => setToast(null), [])

  const messages = useMemo(() => announcements(island, memories, recipes, now, me), [island, memories, recipes, now, me])
  const message = messages[msgIndex % messages.length]

  // Let the newest item finish popping in, then treat it as part of the island.
  // Held back while the log sheet is open, so it pops in once the celebration is closed.
  useEffect(() => {
    if (!freshItemId || logging) return
    const id = setTimeout(clearFresh, 1500)
    return () => clearTimeout(id)
  }, [freshItemId, logging, clearFresh])

  const onItemTap = (it: IslandItem) => {
    const memory = it.memoryId ? memories.find((m) => m.id === it.memoryId) : undefined
    const what = ITEM_LABEL[it.type]
    setToast(
      memory
        ? `This ${what} grew from "${memory.title}", ${prettyDay(memory.date)}`
        : it.source === 'starter'
          ? `This ${what} was here when you moved in`
          : `${withArticle(what).replace(/^a/, 'A')} from ${it.source === 'shop' ? "Nook's Cranny" : 'a seasonal event'}`,
    )
  }

  const donated = memories.filter((m) => isDonated(m, island.members)).length

  return (
    <div className="screen island-screen">
      <header className="island-head">
        <div>
          <h1>{island.name}</h1>
          <div className="chip season">
            {SEASON_ICON[season]} {SEASON_LABEL[season]} ·{' '}
            {now.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
          </div>
        </div>
        <button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings">
          ⚙️
        </button>
      </header>

      <AnimatePresence mode="wait">
        <motion.div key={message.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} transition={{ duration: 0.2 }}>
          <Villager who="isabelle" onClick={() => setMsgIndex((i) => i + 1)}>
            {message.text}
            {messages.length > 1 && <span className="more-dots"> ▸</span>}
          </Villager>
        </motion.div>
      </AnimatePresence>

      <div className="island-frame">
        <IslandScene items={logging ? items.filter((it) => it.id !== freshItemId) : items} season={season} tod={tod} freshItemId={freshItemId} onItemTap={onItemTap} />
        <SeasonParticles season={season} />
      </div>

      <div className="stats">
        <div className="stat">
          <b>{memories.length}</b>
          <span>dates</span>
        </div>
        <div className="stat miles">
          <b>{miles(island.milesBalance)}</b>
          <span>Nook Miles</span>
        </div>
        <div className="stat">
          <b>{donated}</b>
          <span>in museum</span>
        </div>
      </div>

      <motion.button className="btn primary big log-btn" whileTap={{ scale: 0.96 }} onClick={() => openLog()}>
        ✏️ Log a date
      </motion.button>

      <Toast message={toast} onDone={hideToast} />
      <Settings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}

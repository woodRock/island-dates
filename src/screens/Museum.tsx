import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { prettyDay } from '../game/clock'
import { BLATHERS_WAITING, ITEM_LABEL, WING, withArticle } from '../game/text'
import type { Category, Memory, Recipe } from '../game/types'
import { isDonated, useIsland } from '../store'
import { ItemBadge } from '../ui/IslandArt'
import { Bells, Sheet, Villager } from '../ui/kit'
import { useClock, useMemoryPhoto } from '../ui/hooks'
import { PhotoPicker, Polaroid } from '../ui/Photo'
import { RecipeFacts } from './Recipes'

const WINGS: Category[] = ['aquarium', 'insects', 'fossils', 'gallery']
/** How many empty "?" cases to show at most, so the wing stays a nudge rather than a to-do list. */
const MAX_MYSTERY = 6

export function Museum() {
  const memories = useIsland((s) => s.memories)
  const recipes = useIsland((s) => s.recipes)
  const members = useIsland((s) => s.island!.members)
  const [wing, setWing] = useState<Category>('aquarium')
  const [openId, setOpenId] = useState<string | null>(null)
  const [hint, setHint] = useState<Recipe | null>(null)

  const inWing = memories.filter((m) => m.category === wing).sort((a, b) => b.date.localeCompare(a.date))
  const tried = new Set(memories.map((m) => m.recipeId))
  const untried = recipes.filter((r) => r.category === wing && !tried.has(r.id))
  const mysteries = untried.slice(0, Math.max(3, MAX_MYSTERY - inWing.length))
  const donated = memories.filter((m) => isDonated(m, members)).length
  const open = memories.find((m) => m.id === openId) ?? null

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Museum</h1>
        <p className="sub">
          {donated} donated
          {memories.length > donated && ` · ${memories.length - donated} waiting for ratings`}
        </p>
      </header>

      <div className="wing-tabs" role="tablist">
        {WINGS.map((w) => {
          const count = memories.filter((m) => m.category === w).length
          return (
            <button key={w} role="tab" aria-selected={wing === w} className={`wing-tab wing-${w} ${wing === w ? 'on' : ''}`} onClick={() => setWing(w)}>
              <span className="wing-icon">{WING[w].icon}</span>
              <span>{WING[w].name}</span>
              <small>{count}</small>
            </button>
          )
        })}
      </div>
      <p className="wing-blurb">{WING[wing].blurb}</p>

      {inWing.length === 0 && (
        <Villager who="blathers">
          Hoo! This wing is ever so quiet. I do hope you'll bring me something for the {WING[wing].name.toLowerCase()} soon. No hurry, of course!
        </Villager>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={wing} className="case-grid" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
          {inWing.map((m, i) => (
            <motion.button
              key={m.id}
              className={`case filled wing-${wing} ${isDonated(m, members) ? '' : 'awaiting'} ${m.thumb ? 'photo' : ''}`}
              onClick={() => setOpenId(m.id)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              {m.thumb ? <img className="case-thumb" src={m.thumb} alt="" /> : <span className="case-icon">{m.icon}</span>}
              <span className="case-title">{m.title}</span>
              <span className="case-date">{prettyDay(m.date)}</span>
              {!isDonated(m, members) && <span className="case-flag">needs a rating</span>}
            </motion.button>
          ))}
          {mysteries.map((r) => (
            <button key={r.id} className="case mystery" onClick={() => setHint(r)} aria-label="Undiscovered">
              <span className="case-icon">?</span>
            </button>
          ))}
        </motion.div>
      </AnimatePresence>
      {untried.length > mysteries.length && <p className="hint center">…and {untried.length - mysteries.length} more undiscovered in this wing.</p>}

      <MemoryDetail memory={open} onClose={() => setOpenId(null)} />
      <MysteryHint recipe={hint} onClose={() => setHint(null)} />
    </div>
  )
}

function MemoryDetail({ memory, onClose }: { memory: Memory | null; onClose(): void }) {
  const island = useIsland((s) => s.island)!
  const items = useIsland((s) => s.islandItems)
  const rateMemory = useIsland((s) => s.rateMemory)
  const deleteMemory = useIsland((s) => s.deleteMemory)
  const setPhoto = useIsland((s) => s.setPhoto)
  const loadPhoto = useIsland((s) => s.loadPhoto)
  const mode = useIsland((s) => s.mode)
  const me = useIsland((s) => s.me)
  const photo = useMemoryPhoto(memory?.id, memory?.hasPhoto, loadPhoto)
  const { season } = useClock()
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    setConfirm(false)
  }, [memory?.id])
  const item = memory && items.find((it) => it.id === memory.itemAwarded)

  return (
    <Sheet open={!!memory} onClose={onClose} title={memory && `${memory.icon} ${memory.title}`}>
      {memory && (
        <div className="memory-detail">
          {memory.hasPhoto ? (
            <div className="photo-chosen">
              <Polaroid src={photo ?? memory.thumb ?? ''} caption={memory.place || undefined} />
              <button className="btn small ghost" onClick={() => setPhoto(memory.id, null)}>
                Remove photo
              </button>
            </div>
          ) : (
            <PhotoPicker value={null} onChange={(p) => p && setPhoto(memory.id, p)} />
          )}
          <div className="facts">
            <span className="chip">📅 {prettyDay(memory.date)}</span>
            {memory.place && <span className="chip">📍 {memory.place}</span>}
            <span className={`chip wing-chip wing-${memory.category}`}>
              {WING[memory.category].icon} {WING[memory.category].name}
            </span>
          </div>
          {memory.note && <p className="note">“{memory.note}”</p>}
          <div className="ratings-side">
            {island.members.map((m) => {
              // Signed in, you can only rate for yourself.
              const mine = mode === 'local' || m.id === me
              return (
                <div key={m.id} className="rating-card">
                  <span>{mode === 'cloud' && mine ? 'You' : m.name}</span>
                  <Bells size={22} value={memory.ratings[m.id] ?? 0} onChange={mine ? (v) => rateMemory(memory.id, m.id, v) : undefined} />
                  {memory.ratings[m.id] == null && <small>{mine ? 'Tap to rate' : 'Not rated yet'}</small>}
                </div>
              )
            })}
          </div>
          <Villager who="blathers">{isDonated(memory, island.members) ? memory.blathersLine : BLATHERS_WAITING}</Villager>
          {item && (
            <div className="awarded">
              <ItemBadge type={item.type} variant={item.variant} season={season} size={44} />
              <span>Grew {withArticle(ITEM_LABEL[item.type])} on the island</span>
            </div>
          )}
          {confirm ? (
            <div className="row-2">
              <button className="btn" onClick={() => setConfirm(false)}>
                Keep it
              </button>
              <button
                className="btn danger"
                onClick={() => {
                  deleteMemory(memory.id)
                  onClose()
                }}
              >
                Remove memory
              </button>
            </div>
          ) : (
            <button className="btn ghost small" onClick={() => setConfirm(true)}>
              Remove this memory…
            </button>
          )}
        </div>
      )}
    </Sheet>
  )
}

function MysteryHint({ recipe, onClose }: { recipe: Recipe | null; onClose(): void }) {
  const openLog = useIsland((s) => s.openLog)
  return (
    <Sheet open={!!recipe} onClose={onClose} title="An empty display case">
      {recipe && (
        <div className="recipe-detail">
          <Villager who="blathers">
            Hoo… I've heard whispers of a rare specimen called <b>{recipe.title}</b> {recipe.icon}. It would look splendid right here!
          </Villager>
          <RecipeFacts recipe={recipe} />
          <button
            className="btn primary big"
            onClick={() => {
              onClose()
              openLog(recipe.id)
            }}
          >
            ✏️ We did this! Log it
          </button>
        </div>
      )}
    </Sheet>
  )
}

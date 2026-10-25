import { motion } from 'framer-motion'
import { useEffect, useState, type FormEvent } from 'react'
import { isoDay } from '../game/clock'
import { BLATHERS_WAITING, ITEM_LABEL, WING } from '../game/text'
import type { Category, PlayerId } from '../game/types'
import type { PreparedPhoto } from '../lib/photos'
import { isDonated, useIsland, type LogResult } from '../store'
import { ItemBadge } from '../ui/IslandArt'
import { Bells, Sheet, Villager } from '../ui/kit'
import { useClock } from '../ui/hooks'
import { PhotoPicker } from '../ui/Photo'

const CATEGORIES: Category[] = ['aquarium', 'insects', 'fossils', 'gallery']

export function LogDate() {
  const logging = useIsland((s) => s.logging)
  const closeLog = useIsland((s) => s.closeLog)
  const setTab = useIsland((s) => s.setTab)
  const [result, setResult] = useState<LogResult | null>(null)

  useEffect(() => {
    if (logging) setResult(null)
  }, [logging])

  const finish = () => {
    if (result) setTab('island')
    closeLog()
  }

  return (
    <Sheet open={!!logging} onClose={finish} title={result ? 'Thank you for the donation!' : 'Log a date'}>
      {logging && (result ? <Celebration result={result} onDone={finish} /> : <LogForm recipeId={logging.recipeId} onLogged={setResult} />)}
    </Sheet>
  )
}

function LogForm({ recipeId, onLogged }: { recipeId?: string; onLogged(r: LogResult): void }) {
  const island = useIsland((s) => s.island)!
  const recipes = useIsland((s) => s.recipes)
  const logDate = useIsland((s) => s.logDate)
  const mode = useIsland((s) => s.mode)
  const me = useIsland((s) => s.me)
  const start = recipes.find((r) => r.id === recipeId)

  const [fromRecipe, setFromRecipe] = useState(start?.id ?? '')
  const [title, setTitle] = useState(start?.title ?? '')
  const [icon, setIcon] = useState(start?.icon ?? '💛')
  const [category, setCategory] = useState<Category>(start?.category ?? 'insects')
  const [date, setDate] = useState(isoDay(new Date()))
  const [place, setPlace] = useState('')
  const [note, setNote] = useState('')
  const [ratings, setRatings] = useState<Record<PlayerId, number>>({})
  const [photo, setPhoto] = useState<PreparedPhoto | null>(null)
  const [by, setBy] = useState<PlayerId>(me)

  // Signed in, each of you rates on your own phone; in local mode one phone rates for both.
  const raters = mode === 'cloud' ? island.members.filter((m) => m.id === me) : island.members
  const partner = island.members.find((m) => m.id !== me)

  const chooseRecipe = (id: string) => {
    setFromRecipe(id)
    const r = recipes.find((x) => x.id === id)
    if (r) {
      setTitle(r.title)
      setIcon(r.icon)
      setCategory(r.category)
    } else {
      setIcon('💛')
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    const clean = Object.fromEntries(Object.entries(ratings).filter(([, v]) => v > 0))
    onLogged(
      logDate(
        { recipeId: fromRecipe || undefined, title: title.trim(), icon, category, date, place: place.trim(), note: note.trim(), ratings: clean },
        mode === 'cloud' ? me : by,
        photo ?? undefined,
      ),
    )
  }

  const sorted = [...recipes].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <form className="form" onSubmit={submit}>
      <label>
        <span>Which recipe?</span>
        <select value={fromRecipe} onChange={(e) => chooseRecipe(e.target.value)}>
          <option value="">Something off-recipe ✨</option>
          {sorted.map((r) => (
            <option key={r.id} value={r.id}>
              {r.icon} {r.title}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>What did you do?</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Dumplings and a night market" />
      </label>
      <div className="field">
        <span>Museum wing</span>
        <div className="segmented wrap">
          {CATEGORIES.map((c) => (
            <button type="button" key={c} className={category === c ? 'on' : ''} onClick={() => setCategory(c)}>
              {WING[c].icon} {WING[c].name}
            </button>
          ))}
        </div>
      </div>
      <div className="row-2">
        <label>
          <span>When</span>
          <input type="date" value={date} max={isoDay(new Date())} onChange={(e) => setDate(e.target.value || isoDay(new Date()))} />
        </label>
        <label>
          <span>Where</span>
          <input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="e.g. Oriental Bay" />
        </label>
      </div>
      <label>
        <span>A little note</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="The best bit was…" />
      </label>
      <PhotoPicker value={photo} onChange={setPhoto} />
      <div className="ratings-edit">
        {raters.map((m) => (
          <div key={m.id} className="rating-row">
            <span>{mode === 'cloud' ? 'Your rating' : m.name}</span>
            <Bells value={ratings[m.id] ?? 0} onChange={(v) => setRatings((r) => ({ ...r, [m.id]: v }))} />
          </div>
        ))}
        <p className="hint">
          {mode === 'cloud'
            ? `${partner?.name ?? 'Your partner'} adds their rating from their own phone.`
            : 'Not sure yet? Either of you can rate it later from the museum.'}
        </p>
      </div>
      {mode === 'local' && (
        <div className="field">
          <span>Logged by</span>
          <div className="segmented">
            {island.members.map((m) => (
              <button type="button" key={m.id} className={by === m.id ? 'on' : ''} onClick={() => setBy(m.id)}>
                {m.name}
              </button>
            ))}
          </div>
        </div>
      )}
      <button className="btn primary big" disabled={!title.trim()}>
        🦉 Donate to the museum
      </button>
    </form>
  )
}

function Celebration({ result, onDone }: { result: LogResult; onDone(): void }) {
  const members = useIsland((s) => s.island!.members)
  const { season } = useClock()
  const { memory, item, miles } = result
  return (
    <div className="celebration">
      <motion.div className="celebration-item" initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 9, delay: 0.15 }}>
        <ItemBadge type={item.type} variant={item.variant} season={season} size={110} />
      </motion.div>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="celebration-line">
        A new {ITEM_LABEL[item.type]} appeared on your island!
      </motion.p>
      <motion.div className="miles-pill" initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
        +{miles} Nook Miles
      </motion.div>
      <Villager who="blathers">{isDonated(memory, members) ? memory.blathersLine : BLATHERS_WAITING}</Villager>
      <button className="btn primary big" onClick={onDone}>
        Back to the island 🏝️
      </button>
    </div>
  )
}

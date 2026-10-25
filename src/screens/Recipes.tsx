import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { SEASON_ICON, SEASON_LABEL } from '../game/clock'
import { FILTERS, matches, type Filter } from '../game/logic'
import { COST_LABEL, durationLabel, RECIPE_ICONS } from '../game/recipes'
import { WING } from '../game/text'
import type { Category, Cost, Recipe, Season, Setting } from '../game/types'
import { useIsland } from '../store'
import { Sheet, Villager } from '../ui/kit'
import { useClock } from '../ui/hooks'

const WING_ORDER: Category[] = ['aquarium', 'insects', 'fossils', 'gallery']

export function Recipes() {
  const recipes = useIsland((s) => s.recipes)
  const memories = useIsland((s) => s.memories)
  const { season } = useClock()
  const [filters, setFilters] = useState<Filter[]>([])
  const [open, setOpen] = useState<Recipe | null>(null)
  const [editing, setEditing] = useState<Partial<Recipe> | null>(null)
  const [surprise, setSurprise] = useState(false)

  // Your own ideas first, then the starter pool grouped by museum wing.
  const shown = useMemo(
    () =>
      recipes
        .filter((r) => matches(r, filters, season))
        .sort(
          (a, b) =>
            Number(a.source === 'starter') - Number(b.source === 'starter') ||
            WING_ORDER.indexOf(a.category) - WING_ORDER.indexOf(b.category) ||
            a.title.localeCompare(b.title),
        ),
    [recipes, filters, season],
  )
  const timesDone = (id: string) => memories.filter((m) => m.recipeId === id).length
  const toggle = (f: Filter) => setFilters((fs) => (fs.includes(f) ? fs.filter((x) => x !== f) : [...fs, f]))

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>DIY Recipes</h1>
        <p className="sub">{recipes.length} date ideas on the workbench</p>
      </header>

      <div className="row-2">
        <motion.button className="btn primary" whileTap={{ scale: 0.95 }} onClick={() => setSurprise(true)} disabled={shown.length === 0}>
          🎁 Surprise us
        </motion.button>
        <motion.button className="btn" whileTap={{ scale: 0.95 }} onClick={() => setEditing({})}>
          🔨 Craft new
        </motion.button>
      </div>

      <div className="chips" role="group" aria-label="Filters">
        {FILTERS.map((f) => (
          <button key={f.id} className={`chip toggle ${filters.includes(f.id) ? 'on' : ''}`} onClick={() => toggle(f.id)} aria-pressed={filters.includes(f.id)}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <Villager who="isabelle">Hmm, nothing on the workbench matches all of those. Try loosening a filter, or craft a brand-new idea!</Villager>
      ) : (
        <motion.div className="recipe-grid" layout>
          <AnimatePresence initial={false}>
            {shown.map((r) => (
              <motion.button
                key={r.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`recipe-card wing-${r.category}`}
                onClick={() => setOpen(r)}
              >
                <span className="recipe-icon">{r.icon}</span>
                <span className="recipe-title">{r.title}</span>
                <span className="recipe-meta">
                  {COST_LABEL[r.cost]} · {durationLabel(r.durationMins)}
                  {r.season && ` · ${SEASON_ICON[r.season]}`}
                </span>
                {timesDone(r.id) > 0 && <span className="done-badge">✓{timesDone(r.id) > 1 ? ` ${timesDone(r.id)}` : ''}</span>}
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <RecipeDetail
        recipe={open}
        times={open ? timesDone(open.id) : 0}
        onClose={() => setOpen(null)}
        onEdit={(r) => {
          setOpen(null)
          setEditing(r)
        }}
      />
      <RecipeEditor draft={editing} onClose={() => setEditing(null)} />
      <SurprisePick open={surprise} pool={shown} onClose={() => setSurprise(false)} onPick={(r) => {
          setSurprise(false)
          setOpen(r)
        }} />
    </div>
  )
}

export function RecipeFacts({ recipe }: { recipe: Recipe }) {
  return (
    <div className="facts">
      <span className="chip">{COST_LABEL[recipe.cost]}</span>
      <span className="chip">⏱ {durationLabel(recipe.durationMins)}</span>
      <span className="chip">{recipe.setting === 'indoor' ? '🏠 Indoors' : '🌳 Outdoors'}</span>
      {recipe.season && (
        <span className="chip">
          {SEASON_ICON[recipe.season]} {SEASON_LABEL[recipe.season]}
        </span>
      )}
      <span className={`chip wing-chip wing-${recipe.category}`}>
        {WING[recipe.category].icon} {WING[recipe.category].name}
      </span>
    </div>
  )
}

function RecipeDetail({ recipe, times, onClose, onEdit }: { recipe: Recipe | null; times: number; onClose(): void; onEdit(r: Recipe): void }) {
  const openLog = useIsland((s) => s.openLog)
  const deleteRecipe = useIsland((s) => s.deleteRecipe)
  const [confirm, setConfirm] = useState(false)
  useEffect(() => {
    setConfirm(false)
  }, [recipe])

  return (
    <Sheet open={!!recipe} onClose={onClose} title={recipe && `${recipe.icon} ${recipe.title}`}>
      {recipe && (
        <div className="recipe-detail">
          <RecipeFacts recipe={recipe} />
          {recipe.materials.length > 0 && (
            <div className="materials">
              <h3>Materials</h3>
              <ul>
                {recipe.materials.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="sub">{times === 0 ? "You haven't crafted this one yet." : `Crafted ${times} time${times > 1 ? 's' : ''}.`}</p>
          <button
            className="btn primary big"
            onClick={() => {
              onClose()
              openLog(recipe.id)
            }}
          >
            ✏️ We did this! Log it
          </button>
          <div className="row-2">
            <button className="btn" onClick={() => onEdit(recipe)}>
              Edit
            </button>
            {confirm ? (
              <button
                className="btn danger"
                onClick={() => {
                  deleteRecipe(recipe.id)
                  onClose()
                }}
              >
                Really remove?
              </button>
            ) : (
              <button className="btn ghost" onClick={() => setConfirm(true)}>
                Remove idea
              </button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  )
}

const CATEGORIES: Category[] = ['aquarium', 'insects', 'fossils', 'gallery']
const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter']
const DURATIONS = [30, 60, 90, 120, 180, 240, 1440]

function RecipeEditor({ draft, onClose }: { draft: Partial<Recipe> | null; onClose(): void }) {
  const saveRecipe = useIsland((s) => s.saveRecipe)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(RECIPE_ICONS[0])
  const [cost, setCost] = useState<Cost>(0)
  const [durationMins, setDuration] = useState(120)
  const [setting, setSetting] = useState<Setting>('outdoor')
  const [season, setSeason] = useState<Season | undefined>()
  const [category, setCategory] = useState<Category>('insects')
  const [materials, setMaterials] = useState('')

  useEffect(() => {
    if (!draft) return
    setTitle(draft.title ?? '')
    setIcon(draft.icon ?? RECIPE_ICONS[0])
    setCost(draft.cost ?? 0)
    setDuration(draft.durationMins ?? 120)
    setSetting(draft.setting ?? 'outdoor')
    setSeason(draft.season)
    setCategory(draft.category ?? 'insects')
    setMaterials((draft.materials ?? []).join(', '))
  }, [draft])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    saveRecipe({
      id: draft?.id,
      title: title.trim(),
      icon,
      cost,
      durationMins,
      setting,
      ...(season ? { season } : { season: undefined }),
      category,
      materials: materials
        .split(',')
        .map((m) => m.trim())
        .filter(Boolean),
      createdBy: draft?.createdBy ?? useIsland.getState().me,
    })
    onClose()
  }

  return (
    <Sheet open={!!draft} onClose={onClose} title={draft?.id ? 'Edit recipe' : 'Craft a new recipe'}>
      <form className="form" onSubmit={submit}>
        <label>
          <span>Date idea</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sunrise coffee at the lookout" autoFocus />
        </label>
        <div className="field">
          <span>Icon</span>
          <div className="icon-picker">
            {RECIPE_ICONS.map((i) => (
              <button type="button" key={i} className={icon === i ? 'on' : ''} onClick={() => setIcon(i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Cost</span>
          <div className="segmented">
            {([0, 1, 2, 3] as Cost[]).map((c) => (
              <button type="button" key={c} className={cost === c ? 'on' : ''} onClick={() => setCost(c)}>
                {COST_LABEL[c]}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>How long</span>
          <div className="segmented wrap">
            {DURATIONS.map((d) => (
              <button type="button" key={d} className={durationMins === d ? 'on' : ''} onClick={() => setDuration(d)}>
                {durationLabel(d)}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Where</span>
          <div className="segmented">
            <button type="button" className={setting === 'indoor' ? 'on' : ''} onClick={() => setSetting('indoor')}>
              🏠 Indoors
            </button>
            <button type="button" className={setting === 'outdoor' ? 'on' : ''} onClick={() => setSetting('outdoor')}>
              🌳 Outdoors
            </button>
          </div>
        </div>
        <div className="field">
          <span>Best season (optional)</span>
          <div className="segmented">
            {SEASONS.map((s) => (
              <button type="button" key={s} className={season === s ? 'on' : ''} onClick={() => setSeason(season === s ? undefined : s)}>
                {SEASON_ICON[s]}
              </button>
            ))}
          </div>
        </div>
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
        <label>
          <span>Materials (optional, comma-separated)</span>
          <input value={materials} onChange={(e) => setMaterials(e.target.value)} placeholder="Blanket, thermos, playlist" />
        </label>
        <button className="btn primary big" disabled={!title.trim()}>
          {draft?.id ? 'Save recipe' : '🔨 Craft it!'}
        </button>
      </form>
    </Sheet>
  )
}

function SurprisePick({ open, pool, onClose, onPick }: { open: boolean; pool: Recipe[]; onClose(): void; onPick(r: Recipe): void }) {
  const [current, setCurrent] = useState<Recipe | null>(null)
  const [spinning, setSpinning] = useState(false)

  const spin = () => {
    if (pool.length === 0) return
    setSpinning(true)
    let n = 0
    const id = setInterval(() => {
      setCurrent(pool[Math.floor(Math.random() * pool.length)])
      if (++n >= 9) {
        clearInterval(id)
        setSpinning(false)
      }
    }, 90)
  }

  useEffect(() => {
    if (open) spin()
    // Only re-spin when the sheet opens, not when the pool shifts underneath it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  return (
    <Sheet open={open} onClose={onClose} title="Surprise!">
      {current && (
        <div className="surprise">
          <motion.div
            key={spinning ? current.id : `${current.id}-landed`}
            className="surprise-card"
            initial={{ scale: spinning ? 0.9 : 0.6, rotate: spinning ? 0 : -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: spinning ? 30 : 10 }}
          >
            <span className="surprise-icon">{current.icon}</span>
            <h3>{current.title}</h3>
            {!spinning && <RecipeFacts recipe={current} />}
          </motion.div>
          {!spinning && (
            <>
              <Villager who="isabelle">Ooh, how about this one? It sounds wonderful!</Villager>
              <div className="row-2">
                <button className="btn" onClick={spin}>
                  🔄 Another
                </button>
                <button className="btn primary" onClick={() => onPick(current)}>
                  Let's do it!
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}

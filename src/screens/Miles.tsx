import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { DECOR_SHOP, MILES_PER_DATE, type DecorOffer } from '../game/logic'
import { NOOK_REDEEM } from '../game/text'
import type { PlayerId, Reward } from '../game/types'
import { useIsland } from '../store'
import { ItemBadge } from '../ui/IslandArt'
import { Sheet, Toast, Villager } from '../ui/kit'
import { miles, useClock, useMemberName } from '../ui/hooks'

type Section = 'rewards' | 'decor' | 'history'
const REWARD_ICONS = ['🎁', '🥞', '🎬', '🫧', '💆', '🥡', '🍫', '🛁', '☕', '🌹', '🎮', '😴']

export function Miles() {
  const island = useIsland((s) => s.island)!
  const allRewards = useIsland((s) => s.rewards)
  const rewards = [...allRewards].sort((a, b) => a.cost - b.cost)
  const [section, setSection] = useState<Section>('rewards')
  const [redeeming, setRedeeming] = useState<Reward | null>(null)
  const [editing, setEditing] = useState<Partial<Reward> | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const hideToast = useCallback(() => setToast(null), [])

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Nook Miles</h1>
      </header>
      <motion.div className="miles-card" layout>
        <span className="miles-label">Balance</span>
        <motion.b key={island.milesBalance} initial={{ scale: 1.15 }} animate={{ scale: 1 }}>
          {miles(island.milesBalance)}
        </motion.b>
        <span className="miles-sub">+{MILES_PER_DATE} for every date you log</span>
      </motion.div>

      <div className="segmented tabs">
        {(['rewards', 'decor', 'history'] as Section[]).map((s) => (
          <button key={s} className={section === s ? 'on' : ''} onClick={() => setSection(s)}>
            {s === 'rewards' ? '🎁 Rewards' : s === 'decor' ? '🪴 Decor' : '📜 History'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
          {section === 'rewards' && (
            <div className="list">
              {rewards.map((r) => {
                const short = r.cost - island.milesBalance
                return (
                  <div key={r.id} className="reward">
                    <button className="reward-main" onClick={() => setEditing(r)} aria-label={`Edit ${r.title}`}>
                      <span className="reward-icon">{r.icon}</span>
                      <span className="reward-text">
                        <b>{r.title}</b>
                        <small>{miles(r.cost)} miles</small>
                      </span>
                    </button>
                    <button className="btn small primary" disabled={short > 0} onClick={() => setRedeeming(r)}>
                      {short > 0 ? `${miles(short)} to go` : 'Redeem'}
                    </button>
                  </div>
                )
              })}
              <button className="btn dashed" onClick={() => setEditing({})}>
                ＋ Add a reward
              </button>
            </div>
          )}
          {section === 'decor' && <DecorShop onBought={setToast} />}
          {section === 'history' && <History />}
        </motion.div>
      </AnimatePresence>

      <RedeemSheet reward={redeeming} onClose={() => setRedeeming(null)} onDone={setToast} />
      <RewardEditor draft={editing} onClose={() => setEditing(null)} />
      <Toast message={toast} onDone={hideToast} />
    </div>
  )
}

function RedeemSheet({ reward, onClose, onDone }: { reward: Reward | null; onClose(): void; onDone(msg: string): void }) {
  const island = useIsland((s) => s.island)!
  const redeem = useIsland((s) => s.redeem)
  const me = useIsland((s) => s.me)
  const [by, setBy] = useState<PlayerId>(me)
  return (
    <Sheet open={!!reward} onClose={onClose} title="Redeem a reward">
      {reward && (
        <div className="form">
          <div className="redeem-hero">
            <span>{reward.icon}</span>
            <b>{reward.title}</b>
            <small>{miles(reward.cost)} Nook Miles</small>
          </div>
          <div className="field">
            <span>Who's treating themselves?</span>
            <div className="segmented">
              {island.members.map((m) => (
                <button key={m.id} type="button" className={by === m.id ? 'on' : ''} onClick={() => setBy(m.id)}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>
          <button
            className="btn primary big"
            onClick={() => {
              if (redeem(reward.id, by)) onDone(NOOK_REDEEM[Math.floor(Math.random() * NOOK_REDEEM.length)])
              onClose()
            }}
          >
            Redeem for {miles(reward.cost)}
          </button>
        </div>
      )}
    </Sheet>
  )
}

function RewardEditor({ draft, onClose }: { draft: Partial<Reward> | null; onClose(): void }) {
  const saveReward = useIsland((s) => s.saveReward)
  const deleteReward = useIsland((s) => s.deleteReward)
  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState(REWARD_ICONS[0])
  const [cost, setCost] = useState('1000')

  useEffect(() => {
    if (!draft) return
    setTitle(draft.title ?? '')
    setIcon(draft.icon ?? REWARD_ICONS[0])
    setCost(String(draft.cost ?? 1000))
  }, [draft])

  const value = Math.max(0, Math.round(Number(cost) || 0))
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim() || value <= 0) return
    saveReward({ id: draft?.id, title: title.trim(), icon, cost: value, createdBy: draft?.createdBy ?? useIsland.getState().me })
    onClose()
  }

  return (
    <Sheet open={!!draft} onClose={onClose} title={draft?.id ? 'Edit reward' : 'New reward'}>
      <form className="form" onSubmit={submit}>
        <label>
          <span>Reward</span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sleep-in Sunday" />
        </label>
        <div className="field">
          <span>Icon</span>
          <div className="icon-picker">
            {REWARD_ICONS.map((i) => (
              <button type="button" key={i} className={icon === i ? 'on' : ''} onClick={() => setIcon(i)}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <label>
          <span>Cost in Nook Miles</span>
          <input inputMode="numeric" value={cost} onChange={(e) => setCost(e.target.value.replace(/[^0-9]/g, ''))} />
        </label>
        <button className="btn primary big" disabled={!title.trim() || value <= 0}>
          Save reward
        </button>
        {draft?.id && (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              deleteReward(draft.id!)
              onClose()
            }}
          >
            Remove this reward
          </button>
        )}
      </form>
    </Sheet>
  )
}

function DecorShop({ onBought }: { onBought(msg: string): void }) {
  const balance = useIsland((s) => s.island!.milesBalance)
  const buyDecor = useIsland((s) => s.buyDecor)
  const { season } = useClock()
  const [confirm, setConfirm] = useState<DecorOffer | null>(null)
  return (
    <>
      <Villager who="nook">Hm? Looking to spruce up the island? Everything here pops right into place, yes yes!</Villager>
      <div className="decor-grid">
        {DECOR_SHOP.map((d) => (
          <button key={d.type} className="decor" disabled={balance < d.cost} onClick={() => setConfirm(d)}>
            <ItemBadge type={d.type} season={season} size={52} />
            <b>{d.name}</b>
            <small>{miles(d.cost)}</small>
          </button>
        ))}
      </div>
      <Sheet open={!!confirm} onClose={() => setConfirm(null)} title="Nook's Cranny">
        {confirm && (
          <div className="form">
            <div className="redeem-hero">
              <ItemBadge type={confirm.type} season={season} size={90} />
              <b>{confirm.name}</b>
              <small>{miles(confirm.cost)} Nook Miles</small>
            </div>
            <button
              className="btn primary big"
              onClick={() => {
                if (buyDecor(confirm)) onBought(`${confirm.name} placed on the island!`)
                setConfirm(null)
              }}
            >
              Buy and place it
            </button>
          </div>
        )}
      </Sheet>
    </>
  )
}

function History() {
  const log = [...useIsland((s) => s.milesLog)].sort((a, b) => b.at - a.at)
  const redemptions = [...useIsland((s) => s.redemptions)].sort((a, b) => b.at - a.at)
  const name = useMemberName()
  if (log.length === 0) return <Villager who="nook">No miles yet! Log your first date and they'll start rolling in.</Villager>
  return (
    <div className="list">
      {redemptions.length > 0 && (
        <div className="card">
          <h3>Who redeemed what</h3>
          <ul className="history">
            {redemptions.slice(0, 20).map((r) => (
              <li key={r.id}>
                <span>
                  <b>{name(r.uid)}</b> · {r.title}
                </span>
                <small>{new Date(r.at).toLocaleDateString()}</small>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card">
        <h3>Miles log</h3>
        <ul className="history">
          {log.map((e) => (
            <li key={e.id}>
              <span>{e.label}</span>
              <b className={e.amount > 0 ? 'plus' : 'minus'}>
                {e.amount > 0 ? '+' : '−'}
                {miles(Math.abs(e.amount))}
              </b>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

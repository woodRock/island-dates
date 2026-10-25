import { motion } from 'framer-motion'
import { useMemo, useState, type FormEvent } from 'react'
import type { Hemisphere, Island } from '../game/types'
import { cleanCode, cloud, type Invite } from '../lib/backend'
import { readLocalIsland, useIsland } from '../store'
import { IslandScene } from '../ui/IslandArt'
import { useClock } from '../ui/hooks'
import { Villager } from '../ui/kit'

type Step = 'choose' | 'create' | 'join' | 'import'

/** Shown when there's no island yet: start one, join your partner's with a code, or bring the one on this phone. */
export function Welcome() {
  const mode = useIsland((s) => s.mode)
  const user = useIsland((s) => s.user)
  const signOut = useIsland((s) => s.signOut)
  const local = useMemo(() => (mode === 'cloud' ? readLocalIsland() : null), [mode])
  const [step, setStep] = useState<Step>(mode === 'cloud' ? 'choose' : 'create')
  const { tod } = useClock()

  return (
    <div className="welcome">
      <motion.div className="welcome-art" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <IslandScene items={[]} season="spring" tod={tod} freshItemId={null} />
      </motion.div>

      {step === 'choose' && (
        <>
          <Villager who="nook">
            Hm? Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! Are you starting a brand-new island, or moving in with someone who already has one?
          </Villager>
          <div className="card form">
            <button className="btn primary big" onClick={() => setStep('create')}>
              🏝️ Start a new island
            </button>
            <button className="btn big" onClick={() => setStep('join')}>
              ✉️ I have an invite code
            </button>
            {local && (
              <button className="btn" onClick={() => setStep('import')}>
                📦 Bring {local.island!.name} from this phone
              </button>
            )}
          </div>
        </>
      )}
      {step === 'create' && <CreateIsland onBack={mode === 'cloud' ? () => setStep('choose') : undefined} />}
      {step === 'join' && <JoinIsland onBack={() => setStep('choose')} />}
      {step === 'import' && local && <ImportIsland local={local.island!} onBack={() => setStep('choose')} />}

      {mode === 'cloud' && (
        <button className="btn ghost small" onClick={signOut}>
          Signed in as {user?.email ?? user?.name}. Sign out
        </button>
      )}
    </div>
  )
}

function useSubmit() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const run = async (fn: () => Promise<void>, fallback: string) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      console.error(err)
      setError(fallback)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, setError, run }
}

function CreateIsland({ onBack }: { onBack?(): void }) {
  const createIsland = useIsland((s) => s.createIsland)
  const user = useIsland((s) => s.user)
  const [a, setA] = useState(user?.name?.split(' ')[0] ?? '')
  const [b, setB] = useState('')
  const [name, setName] = useState('')
  const [hemisphere, setHemisphere] = useState<Hemisphere>('south')
  const { busy, error, run } = useSubmit()
  const ready = a.trim() && b.trim() && name.trim()

  return (
    <>
      <Villager who="nook">Splendid! Before we get you settled on your very own island, I'll need a few small details.</Villager>
      <form
        className="card form"
        onSubmit={(e) => {
          e.preventDefault()
          if (ready) void run(() => createIsland(name.trim(), [a.trim(), b.trim()], hemisphere), "Hm, the island couldn't be set up. Check your connection and try again?")
        }}
      >
        <div className="row-2">
          <label>
            <span>Your name</span>
            <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Resident one" autoComplete="off" />
          </label>
          <label>
            <span>Your partner's name</span>
            <input value={b} onChange={(e) => setB(e.target.value)} placeholder="Resident two" autoComplete="off" />
          </label>
        </div>
        <label>
          <span>Island name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kōwhai" autoComplete="off" />
        </label>
        <div className="field">
          <span>Hemisphere</span>
          <div className="segmented">
            {(['south', 'north'] as const).map((h) => (
              <button type="button" key={h} className={hemisphere === h ? 'on' : ''} onClick={() => setHemisphere(h)}>
                {h === 'south' ? 'Southern' : 'Northern'}
              </button>
            ))}
          </div>
        </div>
        <button className="btn primary big" disabled={!ready || busy}>
          {busy ? 'Packing boxes…' : 'Move in 🏝️'}
        </button>
        {error && <p className="form-error">{error}</p>}
        {onBack && (
          <button type="button" className="btn ghost small" onClick={onBack}>
            Back
          </button>
        )}
      </form>
    </>
  )
}

function JoinIsland({ onBack }: { onBack(): void }) {
  const joinIsland = useIsland((s) => s.joinIsland)
  const [code, setCode] = useState('')
  const [invite, setInvite] = useState<Invite | null>(null)
  const [name, setName] = useState('')
  const { busy, error, setError, run } = useSubmit()

  const look = (e: FormEvent) => {
    e.preventDefault()
    void run(async () => {
      const found = await cloud!.lookupInvite(code)
      if (!found) setError("Hm, I can't find an island with that code. Double-check it with your partner?")
      else {
        setInvite(found)
        setName(found.partnerName)
      }
    }, "I couldn't check that code just now. Are you online?")
  }

  if (invite) {
    return (
      <>
        <Villager who="nook">
          Ah, {invite.islandName}! {invite.inviterName} has a spot all ready for you. What should the residents call you?
        </Villager>
        <form
          className="card form"
          onSubmit={(e) => {
            e.preventDefault()
            void run(() => joinIsland(invite, name.trim()), "Hm, I couldn't move you in. The code may already have been used.")
          }}
        >
          <label>
            <span>Your name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <button className="btn primary big" disabled={busy || !name.trim()}>
            {busy ? 'Moving in…' : `Move in to ${invite.islandName} 🏝️`}
          </button>
          {error && <p className="form-error">{error}</p>}
          <button type="button" className="btn ghost small" onClick={() => setInvite(null)}>
            Back
          </button>
        </form>
      </>
    )
  }

  return (
    <>
      <Villager who="nook">Moving in with someone, hm? Ask them for the six-letter code under Island settings.</Villager>
      <form className="card form" onSubmit={look}>
        <label>
          <span>Invite code</span>
          <input
            className="code-input"
            value={code}
            onChange={(e) => setCode(cleanCode(e.target.value).slice(0, 6))}
            placeholder="ABC234"
            autoCapitalize="characters"
            autoComplete="off"
            inputMode="text"
          />
        </label>
        <button className="btn primary big" disabled={busy || code.length !== 6}>
          Find the island
        </button>
        {error && <p className="form-error">{error}</p>}
        <button type="button" className="btn ghost small" onClick={onBack}>
          Back
        </button>
      </form>
    </>
  )
}

function ImportIsland({ local, onBack }: { local: Island; onBack(): void }) {
  const importLocalIsland = useIsland((s) => s.importLocalIsland)
  const [as, setAs] = useState(local.members[0].id)
  const { busy, error, run } = useSubmit()
  return (
    <>
      <Villager who="nook">
        I'll have your whole island, {local.name}, shipped over. Every recipe, memory and mile! Which resident are you?
      </Villager>
      <div className="card form">
        <div className="segmented">
          {local.members.map((m) => (
            <button key={m.id} type="button" className={as === m.id ? 'on' : ''} onClick={() => setAs(m.id)}>
              {m.name}
            </button>
          ))}
        </div>
        <button className="btn primary big" disabled={busy} onClick={() => run(() => importLocalIsland(as), "Hm, the move didn't finish. Check your connection and try again?")}>
          {busy ? 'Shipping boxes…' : 'Move it to the cloud ☁️'}
        </button>
        {error && <p className="form-error">{error}</p>}
        <button type="button" className="btn ghost small" onClick={onBack}>
          Back
        </button>
      </div>
    </>
  )
}

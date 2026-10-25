import { useEffect, useState } from 'react'
import type { Hemisphere, ThemePref } from '../game/types'
import { useIsland } from '../store'
import { Sheet } from '../ui/kit'

export function Settings({ open, onClose }: { open: boolean; onClose(): void }) {
  const island = useIsland((s) => s.island)!
  const theme = useIsland((s) => s.theme)
  const updateIsland = useIsland((s) => s.updateIsland)
  const setTheme = useIsland((s) => s.setTheme)
  const mode = useIsland((s) => s.mode)
  const user = useIsland((s) => s.user)
  const me = useIsland((s) => s.me)
  const signOut = useIsland((s) => s.signOut)
  const [copied, setCopied] = useState(false)
  const partner = island.members.find((m) => m.id !== me)
  const [name, setName] = useState(island.name)
  const [a, setA] = useState(island.members[0].name)
  const [b, setB] = useState(island.members[1].name)

  // Start from the saved names each time the sheet opens.
  useEffect(() => {
    const current = useIsland.getState().island
    if (!open || !current) return
    setName(current.name)
    setA(current.members[0].name)
    setB(current.members[1].name)
  }, [open])

  const save = () => {
    if (name.trim() && a.trim() && b.trim()) updateIsland({ name: name.trim() }, [a.trim(), b.trim()])
    onClose()
  }

  return (
    <Sheet open={open} onClose={save} title="Island settings">
      <div className="form">
        <label>
          <span>Island name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="row-2">
          <label>
            <span>Resident one</span>
            <input value={a} onChange={(e) => setA(e.target.value)} />
          </label>
          <label>
            <span>Resident two</span>
            <input value={b} onChange={(e) => setB(e.target.value)} />
          </label>
        </div>
        <div className="field">
          <span>Hemisphere</span>
          <div className="segmented">
            {(['south', 'north'] as Hemisphere[]).map((h) => (
              <button key={h} type="button" className={island.hemisphere === h ? 'on' : ''} onClick={() => updateIsland({ hemisphere: h })}>
                {h === 'south' ? 'Southern' : 'Northern'}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <span>Appearance</span>
          <div className="segmented">
            {(['auto', 'light', 'dark'] as ThemePref[]).map((t) => (
              <button key={t} type="button" className={theme === t ? 'on' : ''} onClick={() => setTheme(t)}>
                {t === 'auto' ? 'Match phone' : t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
        <button className="btn primary" onClick={save}>
          Done
        </button>
        {island.inviteCode && (
          <div className="invite card">
            <h3>Invite {partner?.name ?? 'your partner'}</h3>
            <p className="hint">They sign in on their phone, tap “I have an invite code” and enter:</p>
            <div className="invite-code">{island.inviteCode}</div>
            <button
              type="button"
              className="btn"
              onClick={async () => {
                const text = `Move in with me on ${island.name}! Open Island Dates, sign in, and use invite code ${island.inviteCode}`
                const url = location.origin + import.meta.env.BASE_URL
                try {
                  if (navigator.share) await navigator.share({ title: 'Island Dates', text, url })
                  else {
                    await navigator.clipboard.writeText(`${text}\n${url}`)
                    setCopied(true)
                  }
                } catch {
                  /* share sheet dismissed */
                }
              }}
            >
              {copied ? 'Copied!' : '📮 Share the invite'}
            </button>
          </div>
        )}
        {mode === 'cloud' && (
          <div className="danger-zone">
            <p>Signed in as {user?.email ?? user?.name}</p>
            <button type="button" className="btn ghost small" onClick={signOut}>
              Sign out
            </button>
          </div>
        )}
        <CloseIsland key={String(open)} />
      </div>
    </Sheet>
  )
}

/** Deleting the island for good, behind typing its name, e.g. if the two of you go separate ways. */
function CloseIsland() {
  const island = useIsland((s) => s.island)!
  const mode = useIsland((s) => s.mode)
  const deleteIsland = useIsland((s) => s.deleteIsland)
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const matches = typed.trim() === island.name.trim()

  if (!open) {
    return (
      <div className="danger-zone">
        <button type="button" className="btn ghost small" onClick={() => setOpen(true)}>
          Close this island…
        </button>
      </div>
    )
  }

  return (
    <div className="danger-zone card">
      <h3>Close {island.name}</h3>
      <p>
        {mode === 'cloud'
          ? `This deletes the island for both of you: every memory, photo, recipe, reward and mile. It can't be undone.`
          : `This deletes every memory, recipe, reward and mile on this phone. It can't be undone.`}
      </p>
      <label className="form">
        <span>
          Type <b>{island.name}</b> to confirm
        </span>
        <input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" autoCapitalize="off" spellCheck={false} />
      </label>
      <div className="row-2">
        <button type="button" className="btn" onClick={() => setOpen(false)} disabled={busy}>
          Keep it
        </button>
        <button
          type="button"
          className="btn danger"
          disabled={!matches || busy}
          onClick={async () => {
            setBusy(true)
            setError('')
            try {
              await deleteIsland()
            } catch (err) {
              console.error(err)
              setError("The island couldn't be closed. Check your connection and try again.")
              setBusy(false)
            }
          }}
        >
          {busy ? 'Closing…' : 'Delete forever'}
        </button>
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

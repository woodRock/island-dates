import { useEffect, useState } from 'react'
import type { Hemisphere, ThemePref } from '../game/types'
import { useIsland } from '../store'
import { Sheet } from '../ui/kit'

export function Settings({ open, onClose }: { open: boolean; onClose(): void }) {
  const island = useIsland((s) => s.island)!
  const theme = useIsland((s) => s.theme)
  const updateIsland = useIsland((s) => s.updateIsland)
  const setTheme = useIsland((s) => s.setTheme)
  const resetIsland = useIsland((s) => s.resetIsland)
  const mode = useIsland((s) => s.mode)
  const user = useIsland((s) => s.user)
  const me = useIsland((s) => s.me)
  const signOut = useIsland((s) => s.signOut)
  const [copied, setCopied] = useState(false)
  const partner = island.members.find((m) => m.id !== me)
  const [name, setName] = useState(island.name)
  const [a, setA] = useState(island.members[0].name)
  const [b, setB] = useState(island.members[1].name)
  const [confirmReset, setConfirmReset] = useState(false)

  // Start from the saved names each time the sheet opens.
  useEffect(() => {
    const current = useIsland.getState().island
    if (!open || !current) return
    setName(current.name)
    setA(current.members[0].name)
    setB(current.members[1].name)
    setConfirmReset(false)
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
        {mode === 'local' && (
          <div className="danger-zone">
            {confirmReset ? (
              <>
                <p>This clears every recipe, memory and mile on this phone. It can't be undone.</p>
                <div className="row-2">
                  <button className="btn" onClick={() => setConfirmReset(false)}>
                    Keep my island
                  </button>
                  <button className="btn danger" onClick={resetIsland}>
                    Start over
                  </button>
                </div>
              </>
            ) : (
              <button className="btn ghost small" onClick={() => setConfirmReset(true)}>
                Start a new island…
              </button>
            )}
          </div>
        )}
      </div>
    </Sheet>
  )
}

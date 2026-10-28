import { motion } from 'framer-motion'
import { useState, type FormEvent } from 'react'
import { cloud } from '../lib/backend'
import { IslandScene } from '../ui/IslandArt'
import { useClock } from '../ui/hooks'
import { Villager } from '../ui/kit'

const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': "Hm, that email and password don't match an account.",
  'auth/invalid-email': "That doesn't look like an email address.",
  'auth/email-already-in-use': 'There is already an account with that email. Try signing in instead!',
  'auth/weak-password': 'Passwords need at least 6 characters.',
  'auth/popup-closed-by-user': '',
  'auth/cancelled-popup-request': '',
  'auth/network-request-failed': "I can't reach the airport right now. Check your connection?",
  'auth/missing-email': 'Pop your email address in first.',
  'auth/too-many-requests': "That's a lot of tries! Wait a few minutes, then have another go.",
  'auth/unauthorized-domain': "This web address isn't allowed to sign in yet (add it under Firebase Auth → Authorized domains).",
}
const authMessage = (err: unknown) => {
  const code = (err as { code?: string }).code ?? ''
  return code in MESSAGES ? MESSAGES[code] : 'Something went wrong signing in. Please try again.'
}

export function SignIn() {
  const { season, tod } = useClock()
  const [mode, setMode] = useState<'choose' | 'signIn' | 'register' | 'reset'>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)

  const go = (next: typeof mode) => {
    setMode(next)
    setError('')
    setResetSent(false)
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (err) {
      setError(authMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'reset') {
      void run(async () => {
        await cloud!.resetPassword(email.trim())
        setResetSent(true)
      })
      return
    }
    void run(() => (mode === 'register' ? cloud!.register(email.trim(), password, name.trim()) : cloud!.signIn(email.trim(), password)))
  }

  return (
    <div className="welcome">
      <motion.div className="welcome-art" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <IslandScene items={[]} season={season} tod={tod} freshItemId={null} />
      </motion.div>
      <Villager who="nook">
        Welcome to Dodo Airlines' island getaway package! Just sign in, hm? Then you and your partner can share one island.
      </Villager>

      <div className="card form">
        {mode === 'choose' ? (
          <>
            <button className="btn primary big" disabled={busy} onClick={() => run(() => cloud!.signInWithGoogle())}>
              Continue with Google
            </button>
            <div className="row-2">
              <button className="btn" onClick={() => go('signIn')}>
                Email sign in
              </button>
              <button className="btn" onClick={() => go('register')}>
                New account
              </button>
            </div>
          </>
        ) : mode === 'reset' ? (
          <form className="form" onSubmit={submit}>
            {resetSent ? (
              <p className="notice">
                If there's an account for <b>{email.trim()}</b>, a link to choose a new password is on its way. It can take a minute, so check
                your spam folder too.
              </p>
            ) : (
              <>
                <p className="hint">Enter your email and I'll send you a link to choose a new password.</p>
                <label>
                  <span>Email</span>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
                </label>
                <button className="btn primary big" disabled={busy || !email.trim()}>
                  {busy ? 'Sending…' : 'Send reset link'}
                </button>
              </>
            )}
            <button type="button" className="btn ghost small" onClick={() => go('signIn')}>
              Back to sign in
            </button>
          </form>
        ) : (
          <form className="form" onSubmit={submit}>
            {mode === 'register' && (
              <label>
                <span>Your name</span>
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              </label>
            )}
            <label>
              <span>Email</span>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label>
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              />
            </label>
            <button className="btn primary big" disabled={busy || !email.trim() || !password}>
              {mode === 'register' ? 'Create account' : 'Sign in'}
            </button>
            {mode === 'signIn' && (
              <button type="button" className="btn ghost small" onClick={() => go('reset')}>
                Forgot password?
              </button>
            )}
            <button type="button" className="btn ghost small" onClick={() => go('choose')}>
              Back
            </button>
          </form>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}

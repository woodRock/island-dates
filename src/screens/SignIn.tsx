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
  'auth/unauthorized-domain': "This web address isn't allowed to sign in yet (add it under Firebase Auth → Authorized domains).",
}
const authMessage = (err: unknown) => {
  const code = (err as { code?: string }).code ?? ''
  return code in MESSAGES ? MESSAGES[code] : 'Something went wrong signing in. Please try again.'
}

export function SignIn() {
  const { season, tod } = useClock()
  const [mode, setMode] = useState<'choose' | 'signIn' | 'register'>('choose')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
              <button className="btn" onClick={() => setMode('signIn')}>
                Email sign in
              </button>
              <button className="btn" onClick={() => setMode('register')}>
                New account
              </button>
            </div>
          </>
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
            <button type="button" className="btn ghost small" onClick={() => setMode('choose')}>
              Back
            </button>
          </form>
        )}
        {error && <p className="form-error">{error}</p>}
      </div>
    </div>
  )
}

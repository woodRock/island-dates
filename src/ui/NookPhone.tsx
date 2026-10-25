import { motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useIsland, type Tab } from '../store'

const TABS: { id: Tab; label: string; colour: string; icon: ReactElement }[] = [
  {
    id: 'island',
    label: 'Island',
    colour: '#6cc27a',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <ellipse cx="12" cy="18" rx="9" ry="3" fill="#f6e3a8" />
        <path d="M12 17c0-4 .5-7 2-10" stroke="#a77b52" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M14 7c-3-2-6-1-7 1 2-.5 4 0 7-1zm0 0c2-2 5-2 6 0-2-.5-4 0-6 0zm0 0c1-2 0-4-2-5 .5 2 1 3 2 5z" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'recipes',
    label: 'Recipes',
    colour: '#f2a65a',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M5 19 15 9" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        <rect x="12" y="3.5" width="9" height="5" rx="1.5" transform="rotate(45 16.5 6)" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'museum',
    label: 'Museum',
    colour: '#8f7ad6',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden fill="#fff">
        <path d="M12 3 3 8h18z" />
        <rect x="5" y="9.5" width="2.4" height="7" rx="1" />
        <rect x="10.8" y="9.5" width="2.4" height="7" rx="1" />
        <rect x="16.6" y="9.5" width="2.4" height="7" rx="1" />
        <rect x="3.5" y="17.5" width="17" height="2.5" rx="1" />
      </svg>
    ),
  },
  {
    id: 'miles',
    label: 'Nook Miles',
    colour: '#4fb3d9',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M4 7h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4z" fill="#fff" />
        <path d="M12 9.5l.9 1.9 2 .2-1.5 1.4.4 2-1.8-1-1.8 1 .4-2-1.5-1.4 2-.2z" fill="#4fb3d9" />
      </svg>
    ),
  },
]

export function NookPhone() {
  const tab = useIsland((s) => s.tab)
  const setTab = useIsland((s) => s.setTab)
  return (
    <nav className="nookphone" aria-label="NookPhone">
      {TABS.map((t) => {
        const active = t.id === tab
        return (
          <button key={t.id} className={`phone-app ${active ? 'active' : ''}`} onClick={() => setTab(t.id)} aria-current={active ? 'page' : undefined}>
            <motion.span className="app-tile" style={{ background: t.colour }} animate={{ y: active ? -4 : 0, scale: active ? 1.08 : 1 }} whileTap={{ scale: 0.9 }}>
              {t.icon}
            </motion.span>
            <span className="app-label">{t.label}</span>
          </button>
        )
      })}
    </nav>
  )
}

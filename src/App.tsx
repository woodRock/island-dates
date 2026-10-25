import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { IslandHome } from './screens/Island'
import { LogDate } from './screens/LogDate'
import { Miles } from './screens/Miles'
import { Museum } from './screens/Museum'
import { Recipes } from './screens/Recipes'
import { SignIn } from './screens/SignIn'
import { Welcome } from './screens/Welcome'
import { useIsland } from './store'
import { NookPhone } from './ui/NookPhone'

const SCREENS = { island: IslandHome, recipes: Recipes, museum: Museum, miles: Miles }

export default function App() {
  const phase = useIsland((s) => s.phase)
  const init = useIsland((s) => s.init)
  const syncError = useIsland((s) => s.syncError)
  const clearSyncError = useIsland((s) => s.clearSyncError)
  const tab = useIsland((s) => s.tab)
  const theme = useIsland((s) => s.theme)

  useEffect(init, [init])

  useEffect(() => {
    if (theme === 'auto') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
  }, [theme])

  // A fresh tab starts at the top rather than wherever the last one was scrolled to.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [tab])

  if (phase === 'loading')
    return (
      <div className="splash" aria-label="Loading">
        <motion.span animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}>
          🏝️
        </motion.span>
      </div>
    )
  if (phase === 'signedOut') return <SignIn />
  if (phase === 'noIsland') return <Welcome />
  const Screen = SCREENS[tab]
  return (
    <div className="app">
      {syncError && (
        <button className="sync-error" onClick={clearSyncError}>
          ⚠️ Couldn't sync a change: {syncError} <u>OK</u>
        </button>
      )}
      <main>
        <AnimatePresence mode="wait">
          <motion.div key={tab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <Screen />
          </motion.div>
        </AnimatePresence>
      </main>
      <NookPhone />
      <LogDate />
    </div>
  )
}

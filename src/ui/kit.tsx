import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose(): void; title?: ReactNode; children: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sheet-grip" />
            {title && (
              <div className="sheet-head">
                <h2>{title}</h2>
                <button className="icon-btn" onClick={onClose} aria-label="Close">
                  ✕
                </button>
              </div>
            )}
            <div className="sheet-body">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** A 1–5 rating shown as little bells. 0 means not rated yet. */
export function Bells({ value, onChange, size = 26 }: { value: number; onChange?(v: number): void; size?: number }) {
  return (
    <div className={`bells ${onChange ? 'editable' : ''}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <motion.button
          key={n}
          type="button"
          disabled={!onChange}
          className={n <= value ? 'on' : ''}
          style={{ fontSize: size }}
          whileTap={onChange ? { scale: 1.35 } : undefined}
          onClick={() => onChange?.(n === value ? 0 : n)}
          aria-label={`${n}`}
        >
          <BellIcon />
        </motion.button>
      ))}
    </div>
  )
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden>
      <path d="M12 3c-3.6 0-6 2.8-6 6.4v3.4L4.2 16c-.4.7.1 1.5.9 1.5h13.8c.8 0 1.3-.8.9-1.5L18 12.8V9.4C18 5.8 15.6 3 12 3z" />
      <circle cx="12" cy="19.6" r="2" />
    </svg>
  )
}

export function Villager({ who, children, onClick }: { who: 'isabelle' | 'blathers' | 'nook' | 'kk'; children: ReactNode; onClick?(): void }) {
  const faces = { isabelle: '🐶', blathers: '🦉', nook: '🦝', kk: '🎸' }
  const names = { isabelle: 'Isabelle', blathers: 'Blathers', nook: 'Tom Nook', kk: 'K.K.' }
  return (
    <div className={`villager ${who} ${onClick ? 'tappable' : ''}`} onClick={onClick}>
      <div className="villager-face" aria-hidden>
        {faces[who]}
      </div>
      <div className="villager-bubble">
        <div className="villager-name">{names[who]}</div>
        <div className="villager-text">{children}</div>
      </div>
    </div>
  )
}

export function Toast({ message, onDone }: { message: string | null; onDone(): void }) {
  useEffect(() => {
    if (!message) return
    const id = setTimeout(onDone, 2600)
    return () => clearTimeout(id)
  }, [message, onDone])
  return (
    <AnimatePresence>
      {message && (
        <motion.div className="toast" initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

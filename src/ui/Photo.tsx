import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { preparePhoto, type PreparedPhoto } from '../lib/photos'

/** Picks a photo from the camera roll (or camera) and shrinks it for upload. */
export function PhotoPicker({ value, onChange }: { value: PreparedPhoto | null; onChange(p: PreparedPhoto | null): void }) {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (file: File | undefined) => {
    if (!file) return
    setBusy(true)
    setError('')
    try {
      onChange(await preparePhoto(file))
    } catch (err) {
      console.error(err)
      setError("Hm, that photo wouldn't load. Try another one?")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <div className="photo-picker">
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
      {value ? (
        <div className="photo-chosen">
          <Polaroid src={value.full} />
          <div className="row-2">
            <button type="button" className="btn small" onClick={() => input.current?.click()}>
              Change
            </button>
            <button type="button" className="btn small ghost" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn dashed" disabled={busy} onClick={() => input.current?.click()}>
          {busy ? 'Developing the photo…' : '📷 Add a photo'}
        </button>
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export function Polaroid({ src, caption, tilt = -1.5 }: { src: string; caption?: string; tilt?: number }) {
  return (
    <motion.figure className="polaroid" style={{ rotate: tilt }} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}>
      <img src={src} alt="" />
      {caption && <figcaption>{caption}</figcaption>}
    </motion.figure>
  )
}

// Photos are stored as JPEG data URLs in Firestore (no Cloud Storage), so they're shrunk on the phone first.
// A Firestore document holds at most 1 MiB; the full photo aims well under that.

const FULL_EDGE = 1100
const THUMB_EDGE = 180
const FULL_BUDGET = 700_000

async function draw(file: Blob, edge: number): Promise<HTMLCanvasElement> {
  // from-image applies the camera's EXIF rotation, so portrait phone photos stay upright.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas
}

export interface PreparedPhoto {
  full: string
  thumb: string
}

export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const canvas = await draw(file, FULL_EDGE)
  let quality = 0.78
  let full = canvas.toDataURL('image/jpeg', quality)
  while (full.length > FULL_BUDGET && quality > 0.4) {
    quality -= 0.1
    full = canvas.toDataURL('image/jpeg', quality)
  }
  const thumb = (await draw(file, THUMB_EDGE)).toDataURL('image/jpeg', 0.65)
  return { full, thumb }
}

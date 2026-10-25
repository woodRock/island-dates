// Rasterizes the app icon (a leaf over a sandbar on green) to PNG without dependencies.
import { writeFileSync } from 'node:fs'
import { deflateSync } from 'node:zlib'

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
const crc = (buf) => {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
  const td = Buffer.concat([Buffer.from(type), data])
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td))
  return Buffer.concat([len, td, c])
}

const GREEN = [108, 194, 122], SAND = [243, 223, 168], LEAF = [255, 250, 240]
const a = (-40 * Math.PI) / 180

// Colour at a point in the 64×64 icon space; the full-bleed square suits maskable icons too.
function colourAt(x, y) {
  // Undo the leaf's rotation about (32, 28).
  const dx = x - 32, dy = y - 28
  const lx = 32 + dx * Math.cos(-a) - dy * Math.sin(-a)
  const ly = 28 + dx * Math.sin(-a) + dy * Math.cos(-a)
  // The leaf is the lens between two circles; the vein is a thin strip down its middle.
  const inLens = (lx - 46) ** 2 + (ly - 28) ** 2 < 19.5 ** 2 && (lx - 18) ** 2 + (ly - 28) ** 2 < 19.5 ** 2
  if (Math.abs(lx - 32) < 1.2 && ly > 14 && ly < 50) return GREEN
  if (inLens) return LEAF
  if (((x - 32) / 22) ** 2 + ((y - 50) / 7) ** 2 < 1) return SAND
  return GREEN
}

function icon(size, file) {
  const u = size / 64, ss = 3
  const raw = Buffer.alloc((size * 3 + 1) * size)
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0
    for (let x = 0; x < size; x++) {
      const sum = [0, 0, 0]
      for (let sy = 0; sy < ss; sy++) for (let sx = 0; sx < ss; sx++) {
        const c = colourAt((x + (sx + 0.5) / ss) / u, (y + (sy + 0.5) / ss) / u)
        for (let i = 0; i < 3; i++) sum[i] += c[i]
      }
      const o = y * (size * 3 + 1) + 1 + x * 3
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(sum[i] / (ss * ss))
    }
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8; ihdr[9] = 2
  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ])
  writeFileSync(new URL(`../public/${file}`, import.meta.url), png)
}

icon(192, 'icon-192.png')
icon(512, 'icon-512.png')
icon(180, 'apple-touch-icon.png')

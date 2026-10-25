import { motion } from 'framer-motion'
import { useMemo, type ReactElement } from 'react'
import { GRASS, HOUSE, SAND, VIEW } from '../game/logic'
import type { IslandItem, ItemType, Season, TimeOfDay } from '../game/types'

interface ArtProps {
  variant: number
  season: Season
  night: boolean
}

const TREE_LEAVES: Record<Season, [string, string]> = {
  spring: ['#f7b8cc', '#fbd3df'],
  summer: ['#4ea84a', '#6cc25f'],
  autumn: ['#e2873a', '#f0a54a'],
  winter: ['#3f8a58', '#58a26c'],
}
const FLOWER_COLOURS = ['#ff8fa3', '#ffd166', '#fdfdfd', '#b49ddf']

const Shadow = ({ w = 10 }: { w?: number }) => <ellipse cx={0} cy={0} rx={w} ry={w * 0.32} fill="rgba(30,60,30,0.22)" />

function Tree({ variant, season }: ArtProps) {
  const [dark, light] = TREE_LEAVES[season]
  const tall = variant % 2 === 0
  return (
    <g>
      <Shadow w={11} />
      <rect x={-2.5} y={-14} width={5} height={14} rx={2} fill="#8a5a3b" />
      <circle cx={0} cy={tall ? -24 : -21} r={tall ? 12 : 11} fill={dark} />
      <circle cx={-5} cy={tall ? -27 : -24} r={6} fill={light} />
      <circle cx={6} cy={tall ? -21 : -18} r={5} fill={light} opacity={0.8} />
      {season === 'winter' && <path d={`M-10 ${tall ? -29 : -26} q10 -10 20 0 q-10 -4 -20 0z`} fill="#fff" />}
      {season === 'summer' && variant === 1 && (
        <>
          <circle cx={-4} cy={-18} r={2.2} fill="#ff6b5b" />
          <circle cx={5} cy={-25} r={2.2} fill="#ff6b5b" />
        </>
      )}
    </g>
  )
}

function Palm() {
  return (
    <g>
      <Shadow w={9} />
      <path d="M0 0 C 2 -10 -1 -20 3 -30" stroke="#a77b52" strokeWidth={4} fill="none" strokeLinecap="round" />
      {[-60, -20, 20, 60, 160, 200].map((a) => (
        <ellipse key={a} cx={3} cy={-30} rx={11} ry={3.2} fill="#4caf63" transform={`rotate(${a} 3 -30) translate(9 0)`} />
      ))}
      <circle cx={2} cy={-28} r={2.4} fill="#7a5130" />
      <circle cx={5} cy={-27} r={2.4} fill="#7a5130" />
    </g>
  )
}

function Flower({ variant, season }: ArtProps) {
  if (season === 'winter') {
    return (
      <g>
        <Shadow w={6} />
        <circle cx={0} cy={-4} r={4.5} fill="#f4f8fb" />
        <circle cx={-1.5} cy={-5.5} r={1.5} fill="#ff6b8a" />
      </g>
    )
  }
  const colour = FLOWER_COLOURS[variant % FLOWER_COLOURS.length]
  const heads = [
    [-5, -6],
    [3, -9],
    [5, -3],
  ]
  return (
    <g>
      <Shadow w={7} />
      {heads.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <line x1={0} y1={0} x2={0} y2={-y} stroke="#4f9a46" strokeWidth={1.2} />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={0} cy={-2.4} r={2} fill={colour} transform={`rotate(${a})`} />
          ))}
          <circle r={1.3} fill="#f6c343" />
        </g>
      ))}
    </g>
  )
}

function Bush({ season, variant }: ArtProps) {
  const fill = season === 'autumn' ? '#c9783a' : season === 'winter' ? '#4f8a5e' : '#4ba354'
  return (
    <g>
      <Shadow w={11} />
      <circle cx={-5} cy={-6} r={6.5} fill={fill} />
      <circle cx={5} cy={-6} r={6.5} fill={fill} />
      <circle cx={0} cy={-10} r={7} fill={fill} />
      <circle cx={-2} cy={-12} r={3} fill="#fff" opacity={0.18} />
      {season === 'spring' && (
        <>
          <circle cx={-5} cy={-9} r={1.6} fill={FLOWER_COLOURS[variant % 4]} />
          <circle cx={4} cy={-12} r={1.6} fill={FLOWER_COLOURS[(variant + 1) % 4]} />
          <circle cx={6} cy={-5} r={1.6} fill={FLOWER_COLOURS[variant % 4]} />
        </>
      )}
      {season === 'winter' && <path d="M-11 -9 q11 -12 22 0 q-11 -5 -22 0z" fill="#fff" />}
    </g>
  )
}

function Shell({ variant }: ArtProps) {
  const fill = ['#f8c8c0', '#fbe3c4', '#f3b6d0', '#fff1e0'][variant % 4]
  return (
    <g>
      <Shadow w={6} />
      <path d="M-6 -1 Q0 -12 6 -1 Z" fill={fill} stroke="#d99a8f" strokeWidth={0.8} />
      {[-3, 0, 3].map((x) => (
        <line key={x} x1={0} y1={-1} x2={x * 1.4} y2={-7} stroke="#d99a8f" strokeWidth={0.7} />
      ))}
    </g>
  )
}

function BeachChair({ variant }: ArtProps) {
  const stripe = ['#ff8a80', '#64b5f6', '#ffd166', '#81c784'][variant % 4]
  return (
    <g>
      <Shadow w={10} />
      <path d="M-8 0 L-4 -10 M8 0 L4 -10" stroke="#9c6b43" strokeWidth={1.6} />
      <path d="M-9 -9 L7 -14 L9 -6 L-7 -2 Z" fill="#fff" />
      <path d="M-8 -6.5 L8 -11 L8.5 -8.6 L-7.4 -4.2 Z" fill={stripe} />
    </g>
  )
}

function Bench() {
  return (
    <g>
      <Shadow w={12} />
      <rect x={-10} y={-5} width={2} height={5} fill="#6e4a2f" />
      <rect x={8} y={-5} width={2} height={5} fill="#6e4a2f" />
      <rect x={-12} y={-7} width={24} height={3} rx={1} fill="#b9814f" />
      <rect x={-12} y={-14} width={24} height={3} rx={1} fill="#c99260" />
      <rect x={-12} y={-10.5} width={24} height={2.5} rx={1} fill="#b9814f" />
    </g>
  )
}

function Lamp({ night }: ArtProps) {
  return (
    <g>
      <Shadow w={5} />
      <rect x={-1.2} y={-26} width={2.4} height={26} fill="#4d5560" />
      <path d="M-5 -26 L5 -26 L3 -32 L-3 -32 Z" fill="#4d5560" />
      <rect x={-3} y={-31} width={6} height={5} fill={night ? '#ffe9a3' : '#fff6d6'} />
    </g>
  )
}

function Mailbox() {
  return (
    <g>
      <Shadow w={6} />
      <rect x={-1} y={-12} width={2} height={12} fill="#8a5a3b" />
      <rect x={-6} y={-19} width={12} height={8} rx={4} fill="#5aa7d6" />
      <rect x={4} y={-22} width={1.5} height={6} fill="#ff6b5b" />
    </g>
  )
}

function Easel({ variant }: ArtProps) {
  const paint = ['#ff8fa3', '#64b5f6', '#ffd166', '#81c784']
  return (
    <g>
      <Shadow w={8} />
      <path d="M-6 0 L0 -24 L6 0 M0 -24 L0 0" stroke="#9c6b43" strokeWidth={1.6} fill="none" />
      <rect x={-8} y={-21} width={16} height={13} rx={1} fill="#fffaf0" stroke="#9c6b43" strokeWidth={1} />
      <circle cx={-3} cy={-15} r={3} fill={paint[variant % 4]} />
      <path d="M-1 -11 Q3 -18 6 -12" stroke={paint[(variant + 1) % 4]} strokeWidth={2} fill="none" />
    </g>
  )
}

function Statue() {
  return (
    <g>
      <Shadow w={8} />
      <rect x={-7} y={-8} width={14} height={8} rx={1.5} fill="#b9b4aa" />
      <circle cx={0} cy={-15} r={6} fill="#d6d1c6" />
      <circle cx={0} cy={-23} r={3.6} fill="#d6d1c6" />
      <rect x={-7} y={-8} width={14} height={2} fill="#a7a197" />
    </g>
  )
}

function Pinwheel({ variant }: ArtProps) {
  const cols = ['#ff8a80', '#ffd166', '#64b5f6', '#81c784']
  return (
    <g>
      <Shadow w={4} />
      <rect x={-0.8} y={-20} width={1.6} height={20} fill="#9c6b43" />
      <g transform="translate(0 -20)">
        <g className="spin">
          {[0, 90, 180, 270].map((a, i) => (
            <path key={a} d="M0 0 L0 -7 L5 -4 Z" fill={cols[(i + variant) % 4]} transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r={1.2} fill="#fff" />
      </g>
    </g>
  )
}

function Fountain() {
  return (
    <g>
      <Shadow w={16} />
      <ellipse cx={0} cy={-4} rx={15} ry={5} fill="#b9b4aa" />
      <ellipse cx={0} cy={-5} rx={12} ry={3.5} fill="#7fc8ea" />
      <rect x={-2} y={-16} width={4} height={11} fill="#cfc9be" />
      <ellipse cx={0} cy={-16} rx={6} ry={2} fill="#cfc9be" />
      <path className="splash" d="M0 -17 q-4 -6 -7 -1 M0 -17 q4 -6 7 -1 M0 -17 v-6" stroke="#bfe6f7" strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </g>
  )
}

function Pumpkin() {
  return (
    <g>
      <Shadow w={8} />
      <ellipse cx={-3.5} cy={-5} rx={4.5} ry={5} fill="#f08a2b" />
      <ellipse cx={3.5} cy={-5} rx={4.5} ry={5} fill="#f08a2b" />
      <ellipse cx={0} cy={-5} rx={4.5} ry={5.5} fill="#f59a3b" />
      <rect x={-0.8} y={-13} width={1.8} height={3.5} rx={0.8} fill="#5d8a3a" />
    </g>
  )
}

const ART: Record<ItemType, (p: ArtProps) => ReactElement> = {
  tree: Tree,
  palm: Palm,
  flower: Flower,
  bush: Bush,
  shell: Shell,
  beachChair: BeachChair,
  bench: Bench,
  lamp: Lamp,
  mailbox: Mailbox,
  easel: Easel,
  statue: Statue,
  pinwheel: Pinwheel,
  fountain: Fountain,
  pumpkin: Pumpkin,
}

export function ItemArt({ type, ...props }: ArtProps & { type: ItemType }) {
  const Art = ART[type]
  return <Art {...props} />
}

/** One item drawn on its own, e.g. in the shop or a donation card. */
export function ItemBadge({ type, variant = 0, season, size = 56 }: { type: ItemType; variant?: number; season: Season; size?: number }) {
  return (
    <svg viewBox="-20 -38 40 42" width={size} height={size} aria-hidden>
      <ItemArt type={type} variant={variant} season={season} night={false} />
    </svg>
  )
}

// ── The island ──────────────────────────────────────────────────────────────

const SKY: Record<TimeOfDay, [string, string]> = {
  dawn: ['#f9c5a6', '#fbe6c8'],
  day: ['#8fd3f4', '#cdeefb'],
  dusk: ['#f39a7b', '#c99ac9'],
  night: ['#1d2550', '#3a3f78'],
}
const SEA: Record<TimeOfDay, [string, string]> = {
  dawn: ['#7fc6d9', '#5aaec8'],
  day: ['#6fd0e0', '#3fa9cf'],
  dusk: ['#7a9fc6', '#5579a8'],
  night: ['#25406e', '#182c52'],
}
const GRASS_FILL: Record<Season, [string, string]> = {
  spring: ['#8fd36e', '#6fb755'],
  summer: ['#6cc456', '#4fa544'],
  autumn: ['#b9c45a', '#95a443'],
  winter: ['#eef4f6', '#cfdde3'],
}

function House({ night }: { night: boolean }) {
  return (
    <g transform={`translate(${HOUSE.x} ${HOUSE.y})`}>
      <ellipse cx={0} cy={0} rx={30} ry={7} fill="rgba(30,60,30,0.2)" />
      <rect x={-24} y={-34} width={48} height={34} rx={3} fill="#fbeed3" />
      <path d="M-31 -32 L0 -56 L31 -32 Z" fill="#d9705a" />
      <path d="M-31 -32 L0 -56 L31 -32" stroke="#b85a47" strokeWidth={3} fill="none" strokeLinejoin="round" />
      <rect x={-6} y={-20} width={12} height={20} rx={5} fill="#9c6b43" />
      <circle cx={3.5} cy={-10} r={1.2} fill="#f6c343" />
      <rect x={-19} y={-26} width={9} height={9} rx={2} fill={night ? '#ffe08a' : '#bfe6f7'} />
      <rect x={10} y={-26} width={9} height={9} rx={2} fill={night ? '#ffe08a' : '#bfe6f7'} />
      <rect x={12} y={-52} width={6} height={10} fill="#a35b4a" />
    </g>
  )
}

function Path() {
  const stones = [8, 22, 36, 50, 64, 78, 90]
  return (
    <g>
      {stones.map((dy, i) => (
        <ellipse key={dy} cx={HOUSE.x + (i % 2 ? 3 : -3)} cy={HOUSE.y + 4 + dy * 0.9} rx={6} ry={2.6} fill="#e9d6a6" opacity={0.9} />
      ))}
    </g>
  )
}

function Sky({ tod }: { tod: TimeOfDay }) {
  const stars = useMemo(
    () => Array.from({ length: 26 }, (_, i) => ({ x: (i * 97) % VIEW.w, y: (i * 37) % 70, r: i % 3 === 0 ? 1.3 : 0.8 })),
    [],
  )
  const sun: Record<TimeOfDay, [number, number]> = { dawn: [70, 66], day: [320, 30], dusk: [330, 64], night: [310, 30] }
  const [sx, sy] = sun[tod]
  return (
    <g>
      {tod === 'night' ? (
        <>
          {stars.map((s, i) => (
            <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fffbe6" className="twinkle" style={{ animationDelay: `${(i % 7) * 0.5}s` }} />
          ))}
          <circle cx={sx} cy={sy} r={12} fill="#fdf3c4" />
          <circle cx={sx + 5} cy={sy - 3} r={11} fill={SKY.night[0]} />
        </>
      ) : (
        <>
          <circle cx={sx} cy={sy} r={tod === 'day' ? 14 : 18} fill={tod === 'day' ? '#fff3b0' : '#ffd38a'} opacity={0.95} />
          <g className="drift" fill="#fff" opacity={tod === 'day' ? 0.9 : 0.55}>
            <ellipse cx={80} cy={28} rx={22} ry={7} />
            <ellipse cx={96} cy={23} rx={13} ry={7} />
            <ellipse cx={210} cy={46} rx={18} ry={5} />
          </g>
        </>
      )}
    </g>
  )
}

export interface SceneProps {
  items: IslandItem[]
  season: Season
  tod: TimeOfDay
  freshItemId: string | null
  onItemTap?(item: IslandItem): void
}

export function IslandScene({ items, season, tod, freshItemId, onItemTap }: SceneProps) {
  const night = tod === 'night'
  const [skyTop, skyBottom] = SKY[tod]
  const [seaTop, seaBottom] = SEA[tod]
  const [grassLight, grassDark] = GRASS_FILL[season]
  const sorted = [...items].sort((a, b) => a.y - b.y)
  const lamps = items.filter((it) => it.type === 'lamp')
  // The house is drawn among the items so things in front of it overlap it.
  const before = sorted.filter((it) => it.y < HOUSE.y)
  const after = sorted.filter((it) => it.y >= HOUSE.y)

  const renderItem = (it: IslandItem) => {
    const fresh = it.id === freshItemId
    return (
      <g key={it.id} transform={`translate(${it.x} ${it.y})`} onClick={() => onItemTap?.(it)} className="island-item">
        <motion.g
          initial={fresh ? { scale: 0, y: -14 } : false}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 11, delay: fresh ? 0.35 : 0 }}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 100%' }}
        >
          <ItemArt type={it.type} variant={it.variant} season={season} night={night} />
        </motion.g>
      </g>
    )
  }

  return (
    <svg viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} className="island-svg" role="img" aria-label="Your island">
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={skyTop} />
          <stop offset="1" stopColor={skyBottom} />
        </linearGradient>
        <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={seaTop} />
          <stop offset="1" stopColor={seaBottom} />
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stopColor="#ffe9a3" stopOpacity={0.75} />
          <stop offset="1" stopColor="#ffe9a3" stopOpacity={0} />
        </radialGradient>
      </defs>

      <rect width={VIEW.w} height={VIEW.h} fill="url(#sky)" />
      <Sky tod={tod} />
      <rect y={78} width={VIEW.w} height={VIEW.h - 78} fill="url(#sea)" />
      <g className="waves" stroke="#fff" strokeOpacity={night ? 0.15 : 0.35} strokeWidth={1.5} fill="none" strokeLinecap="round">
        <path d="M20 96 q8 -4 16 0 M120 88 q8 -4 16 0 M300 100 q8 -4 16 0 M360 90 q8 -4 16 0" />
        <path d="M10 300 q8 -4 16 0 M370 290 q8 -4 16 0 M30 250 q8 -4 16 0 M350 240 q8 -4 16 0" />
      </g>

      <ellipse {...SAND} rx={SAND.rx + 6} ry={SAND.ry + 6} fill="#fff" opacity={night ? 0.12 : 0.35} className="foam" />
      <ellipse {...SAND} fill={season === 'winter' ? '#efe6d2' : '#f3dfa8'} />
      <ellipse cx={GRASS.cx} cy={GRASS.cy + 7} rx={GRASS.rx + 2} ry={GRASS.ry + 1} fill={grassDark} />
      <ellipse {...GRASS} fill={grassLight} />
      <ellipse cx={GRASS.cx - 30} cy={GRASS.cy - 20} rx={60} ry={22} fill="#fff" opacity={0.08} />

      <Path />
      {before.map(renderItem)}
      <House night={night} />
      {after.map(renderItem)}

      {night && (
        <>
          <rect width={VIEW.w} height={VIEW.h} fill="#0f1640" opacity={0.32} pointerEvents="none" />
          {lamps.map((l) => (
            <circle key={l.id} cx={l.x} cy={l.y - 28} r={22} fill="url(#glow)" pointerEvents="none" />
          ))}
          <circle cx={HOUSE.x - 15} cy={HOUSE.y - 22} r={14} fill="url(#glow)" pointerEvents="none" />
          <circle cx={HOUSE.x + 15} cy={HOUSE.y - 22} r={14} fill="url(#glow)" pointerEvents="none" />
        </>
      )}
      {tod === 'dusk' && <rect width={VIEW.w} height={VIEW.h} fill="#ff9a6b" opacity={0.12} pointerEvents="none" />}
    </svg>
  )
}

/** Falling petals, leaves or snow over the island. Summer stays clear. */
export function SeasonParticles({ season }: { season: Season }) {
  if (season === 'summer') return null
  const glyph = { spring: 'petal', autumn: 'leaf', winter: 'snow' }[season]
  return (
    <div className="particles" aria-hidden>
      {Array.from({ length: 12 }, (_, i) => (
        <span
          key={i}
          className={`particle ${glyph}`}
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i * 1.3) % 9}s`, animationDuration: `${8 + (i % 5)}s` }}
        />
      ))}
    </div>
  )
}

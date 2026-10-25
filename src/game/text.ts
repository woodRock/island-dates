import { daysBetween, isBlossomTime, parseDay, seasonOf, timeOfDay } from './clock'
import type { Category, Island, Memory, PlayerId, Recipe } from './types'

const pick = <T,>(list: T[], seed: number): T => list[Math.abs(seed) % list.length]

export function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return h
}

// ── Blathers ────────────────────────────────────────────────────────────────

const BLATHERS: Record<Category, string[]> = {
  aquarium: [
    'Hoo! {title}, you say? Splendid! I shall fetch a fresh tank at once.',
    'Hoo hoo! Salt in the air and sand in your shoes. A most refreshing donation!',
    'Ah, the water! I prefer to admire it from a dry perch, but this is marvellous.',
    'Hoo! A splash of {title}! The aquarium positively glimmers.',
    'Wonderful! I can almost hear the waves lapping at {place}.',
  ],
  insects: [
    'Hoo… {title}. I confess the creepy-crawlies alarm me, but the memory is lovely.',
    'Fresh air and wandering feet! I shall label this one with great care.',
    'Hoo! The great outdoors, preserved forever. Do mind the ants.',
    'A fine specimen of a day! I believe it hums ever so gently.',
    'Hoo hoo! {place} under open skies. How delightfully wild.',
  ],
  fossils: [
    'Hoo! A classic, beautifully preserved. Some things only improve with age!',
    'Ah, {title} again? Splendid! Every good collection has its cornerstones.',
    'A true fossil of a date. I mean that as the highest compliment, of course!',
    'Hoo! I shall dust this one off and put it in pride of place.',
    'Old favourites are the bedrock of any museum. Truly marvellous.',
  ],
  gallery: [
    'Hoo! {title}? How cultured! The gallery is all the richer for it.',
    'Exquisite! I shall hang this one where the light falls just so.',
    'A masterpiece of an evening. I am quite moved, hoo hoo.',
    'Hoo! Art, music, a little drama… the gallery wing approves.',
    'Splendid! I shall write a small placard: "{title}, at {place}".',
  ],
}

export function blathersLine(memory: Pick<Memory, 'id' | 'title' | 'category' | 'place'>): string {
  const template = pick(BLATHERS[memory.category], hash(memory.id))
  return (
    template
      .replace('{title}', memory.title)
      .replace('{place}', memory.place.trim() || 'that spot')
      // A filled-in name or place can land at the start of a sentence.
      .replace(/(^|[!?.…]\s+)([a-z])/g, (_, lead: string, c: string) => lead + c.toUpperCase())
  )
}

export const BLATHERS_WAITING = 'Hoo! I shall keep this safe until you have both shared your rating.'

// ── Isabelle ────────────────────────────────────────────────────────────────

export interface Announcement {
  id: string
  text: string
}

/** Every message that applies right now, most relevant first. Tapping the card cycles through them. */
export function announcements(island: Island, memories: Memory[], recipes: Recipe[], now: Date, me: PlayerId): Announcement[] {
  const out: Announcement[] = []
  const [a, b] = island.members.map((m) => m.name)
  const partner = island.members.find((m) => m.id !== me) ?? island.members[1]
  const season = seasonOf(now, island.hemisphere)
  const tod = timeOfDay(now)
  const last = memories.reduce<string | null>((best, m) => (!best || m.date > best ? m.date : best), null)
  const unratedByMe = memories.find((m) => island.members.some((p) => p.id === me) && m.ratings[me] == null)
  const unratedByPartner = memories.find((m) => m.ratings[partner.id] == null)

  if (island.inviteCode) {
    out.push({ id: 'invite', text: `Your island is all set up! Send ${partner.name} the invite code ${island.inviteCode} (it's in Island settings ⚙️) so they can move in.` })
  }

  if (memories.length === 0) {
    out.push({ id: 'first', text: `Welcome to ${island.name}, ${a} and ${b}! Your museum is empty and full of possibility. Pick a recipe whenever you're ready.` })
  } else if (last) {
    const days = daysBetween(parseDay(last), now)
    if (days === 0) out.push({ id: 'today', text: `A date today! The whole island is smiling. Don't forget to donate it to the museum.` })
    else if (days >= 7) out.push({ id: 'since', text: `It's been ${days} days since your last date… no rush at all! A cosy one at home counts too.` })
  }

  if (now.getDay() === 6) out.push({ id: 'kk', text: `K.K. Slider plays tonight! Perfect excuse for a music night: records, a gig, or a kitchen dance.` })

  if (isBlossomTime(now, island.hemisphere)) {
    out.push({ id: 'blossom', text: `The cherry blossoms are out! Perfect picnic weather.` })
  } else {
    const seasonal: Record<typeof season, string> = {
      spring: `Spring is here and everything's blooming. A garden stroll, perhaps?`,
      summer: `Summer sun! A swim, a picnic, or a long evening outdoors would be just the thing.`,
      autumn: `The leaves are turning and mushrooms are popping up. Cosy cooking season!`,
      winter: `Brr, it's chilly out! Blanket forts and hot drinks are highly recommended.`,
    }
    out.push({ id: `season-${season}`, text: seasonal[season] })
  }

  if (unratedByMe) {
    out.push({ id: 'rate-me', text: `Blathers is waiting patiently for your rating on "${unratedByMe.title}". Whenever you're ready!` })
  } else if (unratedByPartner) {
    out.push({ id: 'rate-partner', text: `Blathers is waiting for ${partner.name} to rate "${unratedByPartner.title}" before it goes on display.` })
  }

  const inSeason = recipes.filter((r) => r.season === season)
  if (inSeason.length > 0) {
    const r = pick(inSeason, now.getDate())
    out.push({ id: 'idea', text: `Today's idea from the noticeboard: ${r.icon} ${r.title}.` })
  }

  const greetings: Record<typeof tod, string> = {
    dawn: `Good morning! You two are up early. The island looks lovely at sunrise.`,
    day: `${now.getHours() < 12 ? 'Good morning' : 'Good afternoon'}! The island is looking wonderful today.`,
    dusk: `The sun is setting over ${island.name}. Such pretty skies this evening!`,
    night: `It's a quiet night on the island. Sweet dreams when you get there!`,
  }
  out.push({ id: 'greeting', text: greetings[tod] })
  return out
}

// ── Tom Nook / misc ─────────────────────────────────────────────────────────

export const NOOK_REDEEM = [
  'Yes, yes! A fine choice. Enjoy, hm?',
  'Hm? Splendid! Those miles were well earned.',
  'Wonderful! Treat yourself. That is what miles are for!',
]

export const ITEM_LABEL: Record<string, string> = {
  tree: 'tree',
  palm: 'palm tree',
  flower: 'flower',
  bush: 'bush',
  shell: 'seashell',
  beachChair: 'beach chair',
  bench: 'bench',
  lamp: 'street lamp',
  mailbox: 'mailbox',
  easel: 'easel',
  statue: 'statue',
  pinwheel: 'pinwheel',
  fountain: 'fountain',
  pumpkin: 'pumpkin',
}

/** "a lamp", "an easel". */
export const withArticle = (word: string) => `${/^[aeiou]/i.test(word) ? 'an' : 'a'} ${word}`

export const WING: Record<Category, { name: string; icon: string; blurb: string }> = {
  aquarium: { name: 'Aquarium', icon: '🐟', blurb: 'Beaches, swims and anything with a splash' },
  insects: { name: 'Insects', icon: '🦋', blurb: 'Walks, hikes, picnics and starry skies' },
  fossils: { name: 'Fossils', icon: '🦴', blurb: 'The classics you love to repeat' },
  gallery: { name: 'Gallery', icon: '🖼️', blurb: 'Galleries, gigs, crafts and cinema' },
}

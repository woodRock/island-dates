import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { cloud, type Invite, type IslandContents, type Sink, type User } from './lib/backend'
import type { PreparedPhoto } from './lib/photos'
import { MILES_PER_DATE, itemForDate, placeItem, uid, type DecorOffer } from './game/logic'
import { starterRecipes } from './game/recipes'
import { blathersLine } from './game/text'
import type { Category, Hemisphere, Island, IslandItem, Member, Memory, PlayerId, Recipe, Redemption, Reward, ThemePref } from './game/types'

export type Tab = 'island' | 'recipes' | 'museum' | 'miles'
/** loading → signedOut (cloud only) → noIsland → ready */
export type Phase = 'loading' | 'signedOut' | 'noIsland' | 'ready'

export interface LogInput {
  recipeId?: string
  title: string
  icon: string
  category: Category
  date: string
  place: string
  note: string
  ratings: Record<PlayerId, number>
}

export interface LogResult {
  memory: Memory
  item: IslandItem
  miles: number
}

/** Everything that belongs to the island: in Firestore when signed in, otherwise in this browser. */
interface IslandData extends IslandContents {
  island: Island | null
}

interface State extends IslandData {
  mode: 'local' | 'cloud'
  phase: Phase
  user: User | null
  islandId: string | null
  /** Who is using this phone: your uid when signed in; in local mode, whichever resident is picked. */
  me: PlayerId
  syncError: string | null
  /** Full-size photos fetched so far, by memory id. */
  photos: Record<string, string>
  theme: ThemePref
  tab: Tab
  /** The item that should pop in next time the island is shown. */
  freshItemId: string | null
  /** Opens the log sheet; a recipe id pre-fills it. */
  logging: { recipeId?: string } | null

  init(): void
  setTab(tab: Tab): void
  openLog(recipeId?: string): void
  closeLog(): void
  clearFresh(): void
  clearSyncError(): void

  createIsland(name: string, names: [string, string], hemisphere: Hemisphere): Promise<void>
  joinIsland(invite: Invite, name: string): Promise<void>
  signOut(): Promise<void>
  updateIsland(patch: Partial<Pick<Island, 'name' | 'hemisphere'>>, names?: [string, string]): void
  setTheme(theme: ThemePref): void
  resetIsland(): void

  saveRecipe(recipe: Omit<Recipe, 'id' | 'source'> & { id?: string }): void
  deleteRecipe(id: string): void

  logDate(input: LogInput, by: PlayerId, photo?: PreparedPhoto): LogResult
  rateMemory(id: string, player: PlayerId, rating: number): void
  deleteMemory(id: string): void
  setPhoto(memoryId: string, photo: PreparedPhoto | null): void
  loadPhoto(memoryId: string): Promise<string | null>

  saveReward(reward: Omit<Reward, 'id'> & { id?: string }): void
  deleteReward(id: string): void
  redeem(rewardId: string, by: PlayerId): boolean
  buyDecor(offer: DecorOffer): boolean
}

const defaultRewards = (): Reward[] => [
  { id: uid(), title: 'Breakfast in bed', icon: '🥞', cost: 2000 },
  { id: uid(), title: 'Partner picks the movie', icon: '🎬', cost: 800 },
  { id: uid(), title: 'Night off from dishes', icon: '🫧', cost: 1200 },
  { id: uid(), title: 'A long back rub', icon: '💆', cost: 1500 },
  { id: uid(), title: 'Choose the takeaway', icon: '🥡', cost: 1000 },
]

/** A few plants that were already here when you moved in, so a new island isn't bare. */
function starterItems(): IslandItem[] {
  const items: IslandItem[] = []
  for (const [type, variant] of [['tree', 0], ['tree', 1], ['bush', 0], ['flower', 1], ['tree', 2]] as const) {
    items.push({ id: uid(), type, variant, ...placeItem(type, items), source: 'starter', createdAt: Date.now() })
  }
  return items
}

const noContents = (): IslandContents => ({ recipes: [], memories: [], rewards: [], redemptions: [], islandItems: [], milesLog: [] })
const empty = (): IslandData => ({ island: null, ...noContents() })

export const isDonated = (m: Memory, members: Member[]) => members.every((p) => m.ratings[p.id] != null)

const LOCAL_KEY = 'island-dates'
const photoKey = (id: string) => `island-dates.photo.${id}`

let initialized = false
let unwatch: (() => void) | null = null
let cloudSink: Sink | null = null

export const useIsland = create<State>()(
  persist(
    (set, get) => {
      const fail = (err: Error) => {
        console.error('Sync failed', err)
        set({ syncError: err.message })
      }

      // In local mode writes go straight into the store (which persists to localStorage).
      const localSink: Sink = {
        put(col, item) {
          const list = get()[col] as { id: string }[]
          const next = list.some((x) => x.id === item.id) ? list.map((x) => (x.id === item.id ? item : x)) : [item, ...list]
          set({ [col]: next } as Partial<State>)
        },
        patch(col, id, fields) {
          const apply = (x: Record<string, unknown>) => {
            const next = { ...x, ...fields }
            for (const [k, v] of Object.entries(fields)) if (v === null) delete next[k]
            return next
          }
          set({ [col]: (get()[col] as { id: string }[]).map((x) => (x.id === id ? apply(x) : x)) } as Partial<State>)
        },
        remove(col, id) {
          set({ [col]: (get()[col] as { id: string }[]).filter((x) => x.id !== id) } as Partial<State>)
        },
        rate(memoryId, player, rating) {
          set({
            memories: get().memories.map((m) => {
              if (m.id !== memoryId) return m
              const ratings = { ...m.ratings, [player]: rating }
              if (!rating) delete ratings[player]
              return { ...m, ratings }
            }),
          })
        },
        addMiles(entry) {
          const { island, milesLog } = get()
          if (!island) return
          set({ island: { ...island, milesBalance: island.milesBalance + entry.amount }, milesLog: [entry, ...milesLog].slice(0, 150) })
        },
        updateIsland(patch) {
          const { island } = get()
          if (island) set({ island: { ...island, ...patch } })
        },
        setPhoto(memoryId, dataUrl) {
          try {
            if (dataUrl) localStorage.setItem(photoKey(memoryId), dataUrl)
            else localStorage.removeItem(photoKey(memoryId))
          } catch {
            set({ syncError: 'This browser is out of space for photos.' })
          }
        },
      }
      const sink = () => cloudSink ?? localSink

      const attach = (islandId: string) => {
        unwatch?.()
        cloudSink = cloud!.sink(islandId, fail)
        set({ islandId, me: get().user!.uid })
        unwatch = cloud!.watchIsland(
          islandId,
          (patch) => {
            if (patch.island === null) {
              // The island is gone: stop listening and offer to start or join one instead.
              detach()
              set({ phase: 'noIsland', syncError: null })
              return
            }
            set(patch as Partial<State>)
            if (patch.island) set({ phase: 'ready' })
          },
          fail,
        )
      }
      const detach = () => {
        unwatch?.()
        unwatch = null
        cloudSink = null
        set({ ...empty(), islandId: null, photos: {} })
      }

      const addMiles = (amount: number, label: string) => sink().addMiles({ id: uid(), amount, label, at: Date.now() })

      const seedIsland = (name: string, members: Member[], hemisphere: Hemisphere): IslandData => ({
        island: { name, hemisphere, members, memberUids: [], milesBalance: 0, createdAt: Date.now() },
        ...noContents(),
        recipes: starterRecipes(),
        rewards: defaultRewards(),
        islandItems: starterItems(),
      })

      const upload = async ({ island, ...contents }: IslandData) => {
        const { user } = get()
        if (!cloud || !user || !island) return
        const { name, hemisphere, members, milesBalance, createdAt } = island
        attach(await cloud.createIsland(user, { name, hemisphere, members, milesBalance, createdAt }, contents))
      }

      return {
        ...empty(),
        mode: cloud ? 'cloud' : 'local',
        phase: 'loading',
        user: null,
        islandId: null,
        me: 'p1',
        syncError: null,
        photos: {},
        theme: 'auto',
        tab: 'island',
        freshItemId: null,
        logging: null,

        init() {
          if (initialized) return
          initialized = true
          if (!cloud) {
            set({ phase: get().island ? 'ready' : 'noIsland' })
            return
          }
          cloud.onAuth(async (user) => {
            detach()
            set({ user, phase: user ? 'loading' : 'signedOut' })
            if (!user) return
            try {
              const islandId = await cloud!.myIslandId(user.uid)
              if (islandId) attach(islandId)
              else set({ phase: 'noIsland' })
            } catch (err) {
              fail(err as Error)
              set({ phase: 'noIsland' })
            }
          })
        },

        setTab: (tab) => set({ tab }),
        openLog: (recipeId) => set({ logging: { recipeId } }),
        closeLog: () => set({ logging: null }),
        clearFresh: () => set({ freshItemId: null }),
        clearSyncError: () => set({ syncError: null }),

        async createIsland(name, [a, b], hemisphere) {
          const me = get().user?.uid ?? 'p1'
          const data = seedIsland(
            name,
            [
              { id: me, name: a },
              { id: 'p2', name: b },
            ],
            hemisphere,
          )
          if (cloud) await upload(data)
          else set({ ...data, phase: 'ready', me })
        },

        async joinIsland(invite, name) {
          const { user } = get()
          if (!cloud || !user) return
          await cloud.joinIsland(user, invite, name)
          attach(invite.islandId)
        },

        async signOut() {
          await cloud?.signOut()
        },

        updateIsland(patch, names) {
          const { island } = get()
          if (!island) return
          sink().updateIsland(names ? { ...patch, members: island.members.map((m, i) => ({ ...m, name: names[i] ?? m.name })) } : patch)
        },

        setTheme: (theme) => set({ theme }),
        resetIsland: () => set({ ...empty(), tab: 'island', phase: 'noIsland' }),

        saveRecipe({ id, ...fields }) {
          const existing = id && get().recipes.find((r) => r.id === id)
          sink().put('recipes', existing ? { ...existing, ...fields } : { ...fields, id: uid(), source: 'custom' })
        },
        deleteRecipe: (id) => sink().remove('recipes', id),

        logDate(input, by, photo) {
          const { memories, islandItems } = get()
          const id = uid()
          const inWing = memories.filter((m) => m.category === input.category).length
          const type = itemForDate(input.category, inWing)
          const item: IslandItem = {
            id: uid(),
            type,
            ...placeItem(type, islandItems),
            source: 'date',
            variant: Math.abs(id.charCodeAt(0) + id.charCodeAt(1)) % 4,
            memoryId: id,
            createdAt: Date.now(),
          }
          const memory: Memory = {
            ...input,
            id,
            blathersLine: blathersLine({ id, ...input }),
            itemAwarded: item.id,
            createdBy: by,
            createdAt: Date.now(),
            ...(photo ? { thumb: photo.thumb, hasPhoto: true } : {}),
          }
          if (photo) {
            sink().setPhoto(id, photo.full)
            set({ photos: { ...get().photos, [id]: photo.full } })
          }
          sink().put('memories', memory)
          sink().put('islandItems', item)
          set({ freshItemId: item.id })
          addMiles(MILES_PER_DATE, `Date: ${input.title}`)
          return { memory, item, miles: MILES_PER_DATE }
        },

        // A rating of 0 clears it.
        rateMemory: (id, player, rating) => sink().rate(id, player, rating),

        // Miles already earned are kept: removing a memory should never feel like a penalty.
        deleteMemory(id) {
          const memory = get().memories.find((m) => m.id === id)
          sink().remove('memories', id)
          get()
            .islandItems.filter((it) => it.memoryId === id)
            .forEach((it) => sink().remove('islandItems', it.id))
          if (memory?.hasPhoto) sink().setPhoto(id, null)
        },

        setPhoto(memoryId, photo) {
          sink().setPhoto(memoryId, photo?.full ?? null)
          sink().patch('memories', memoryId, photo ? { thumb: photo.thumb, hasPhoto: true } : { thumb: null, hasPhoto: false })
          const photos = { ...get().photos }
          if (photo) photos[memoryId] = photo.full
          else delete photos[memoryId]
          set({ photos })
        },

        async loadPhoto(memoryId) {
          const { photos, islandId } = get()
          if (photos[memoryId]) return photos[memoryId]
          let data: string | null = null
          try {
            data = cloud && islandId ? await cloud.loadPhoto(islandId, memoryId) : localStorage.getItem(photoKey(memoryId))
          } catch (err) {
            fail(err as Error)
          }
          if (data) set({ photos: { ...get().photos, [memoryId]: data } })
          return data
        },

        saveReward({ id, ...fields }) {
          const existing = id && get().rewards.find((r) => r.id === id)
          sink().put('rewards', existing ? { ...existing, ...fields } : { ...fields, id: uid() })
        },
        deleteReward: (id) => sink().remove('rewards', id),

        redeem(rewardId, by) {
          const { island, rewards } = get()
          const reward = rewards.find((r) => r.id === rewardId)
          if (!island || !reward || island.milesBalance < reward.cost) return false
          const name = island.members.find((m) => m.id === by)?.name ?? ''
          const redemption: Redemption = { id: uid(), rewardId, title: reward.title, cost: reward.cost, uid: by, at: Date.now() }
          sink().put('redemptions', redemption)
          addMiles(-reward.cost, `${name} redeemed: ${reward.title}`)
          return true
        },

        buyDecor(offer) {
          const { island, islandItems } = get()
          if (!island || island.milesBalance < offer.cost) return false
          const item: IslandItem = {
            id: uid(),
            type: offer.type,
            ...placeItem(offer.type, islandItems),
            source: 'shop',
            variant: islandItems.length % 4,
            createdAt: Date.now(),
          }
          sink().put('islandItems', item)
          set({ freshItemId: item.id })
          addMiles(-offer.cost, `Bought: ${offer.name}`)
          return true
        },
      }
    },
    cloud
      ? // Signed in, the island lives in Firestore (with its own offline cache); only preferences are kept here.
        { name: 'island-dates-prefs', partialize: ({ theme }) => ({ theme }) }
      : {
          name: LOCAL_KEY,
          version: 2,
          // v1 islands predate sign-in, so they have no signed-in residents yet.
          migrate: (saved) => {
            const s = saved as Partial<IslandData>
            return { ...s, island: s.island && { ...s.island, memberUids: s.island.memberUids ?? [] } } as State
          },
          partialize: ({ island, recipes, memories, rewards, redemptions, islandItems, milesLog, theme }) => ({
            island,
            recipes,
            memories,
            rewards,
            redemptions,
            islandItems,
            milesLog,
            theme,
          }),
        },
  ),
)

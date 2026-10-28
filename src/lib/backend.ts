import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
} from 'firebase/auth'
import {
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  increment,
  initializeFirestore,
  limit,
  onSnapshot,
  orderBy,
  persistentLocalCache,
  persistentMultipleTabManager,
  query,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import type { Island, IslandItem, Member, Memory, MilesEntry, PlayerId, Recipe, Redemption, Reward } from '../game/types'

export interface User {
  uid: string
  email: string | null
  name: string | null
}

export interface Collections {
  recipes: Recipe
  memories: Memory
  rewards: Reward
  redemptions: Redemption
  islandItems: IslandItem
  milesLog: MilesEntry
}
export type Col = keyof Collections
export const COLLECTIONS: Col[] = ['recipes', 'memories', 'rewards', 'redemptions', 'islandItems', 'milesLog']

export type IslandContents = { [K in Col]: Collections[K][] }

/** Everything the store writes. Cloud writes go to Firestore, whose snapshots then update the store. */
export interface Sink {
  put<K extends Col>(col: K, item: Collections[K]): void
  /** Updates just these fields; null removes one. */
  patch(col: Col, id: string, fields: Record<string, unknown>): void
  remove(col: Col, id: string): void
  rate(memoryId: string, player: PlayerId, rating: number): void
  addMiles(entry: MilesEntry): void
  updateIsland(patch: Partial<Island>): void
  setPhoto(memoryId: string, dataUrl: string | null): void
}

export interface Invite {
  code: string
  islandId: string
  islandName: string
  inviterName: string
  partnerName: string
}

export interface Cloud {
  onAuth(cb: (u: User | null) => void): () => void
  signInWithGoogle(): Promise<void>
  signIn(email: string, password: string): Promise<void>
  register(email: string, password: string, name: string): Promise<void>
  /** Emails a link for choosing a new password, which returns to the app afterwards. */
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>
  myIslandId(uid: string): Promise<string | null>
  createIsland(user: User, island: Omit<Island, 'memberUids' | 'inviteCode'>, contents: IslandContents): Promise<string>
  lookupInvite(code: string): Promise<Invite | null>
  joinIsland(user: User, invite: Invite, name: string): Promise<void>
  /** Permanently deletes the island and everything on it, for both residents. */
  deleteIsland(user: User, islandId: string): Promise<void>
  watchIsland(islandId: string, cb: (patch: Partial<IslandContents> & { island?: Island | null }) => void, onError: (e: Error) => void): () => void
  sink(islandId: string, onError: (e: Error) => void): Sink
  loadPhoto(islandId: string, memoryId: string): Promise<string | null>
}

const env = import.meta.env
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

// No 0/O or 1/I/L, so codes read cleanly off a screen.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
export const makeInviteCode = () =>
  Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join('')
export const cleanCode = (code: string) => code.toUpperCase().replace(/[^A-Z0-9]/g, '')

/** Firestore batches hold at most 500 writes. */
async function inBatches(db: Firestore, ops: ((b: ReturnType<typeof writeBatch>) => void)[]) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db)
    ops.slice(i, i + 450).forEach((op) => op(batch))
    await batch.commit()
  }
}

function cloudBackend(app: FirebaseApp): Cloud {
  const auth = getAuth(app)
  // Persistent cache: the island works offline and syncs when back online.
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    // Optional fields (like a recipe with no season) are undefined; Firestore rejects those otherwise.
    ignoreUndefinedProperties: true,
  })
  const islandRef = (id: string) => doc(db, 'islands', id)
  const sub = (id: string, col: Col | 'photos') => collection(db, 'islands', id, col)

  const toUser = (u: { uid: string; email: string | null; displayName: string | null }): User => ({
    uid: u.uid,
    email: u.email,
    name: u.displayName,
  })

  return {
    onAuth: (cb) => onAuthStateChanged(auth, (u) => cb(u ? toUser(u) : null)),

    async signInWithGoogle() {
      const provider = new GoogleAuthProvider()
      try {
        await signInWithPopup(auth, provider)
      } catch (err) {
        // Some installed-app browsers block popups; a full-page redirect still works there.
        if ((err as { code?: string }).code === 'auth/popup-blocked') await signInWithRedirect(auth, provider)
        else throw err
      }
    },
    signIn: async (email, pw) => void (await signInWithEmailAndPassword(auth, email, pw)),
    async register(email, pw, name) {
      const { user } = await createUserWithEmailAndPassword(auth, email, pw)
      if (name) await updateProfile(user, { displayName: name })
    },
    resetPassword: (email) => sendPasswordResetEmail(auth, email, { url: location.origin + import.meta.env.BASE_URL }),
    signOut: () => signOut(auth),

    async myIslandId(uid) {
      const snap = await getDoc(doc(db, 'users', uid))
      return (snap.data()?.islandId as string | undefined) ?? null
    },

    async createIsland(user, island, contents) {
      const ref = doc(collection(db, 'islands'))
      const code = makeInviteCode()
      const me = island.members.find((m) => m.id === user.uid)
      const partner = island.members.find((m) => m.id !== user.uid)
      const batch = writeBatch(db)
      batch.set(ref, { ...island, memberUids: [user.uid], inviteCode: code })
      batch.set(doc(db, 'invites', code), {
        islandId: ref.id,
        islandName: island.name,
        inviterName: me?.name ?? '',
        partnerName: partner?.name ?? '',
        createdAt: Date.now(),
      })
      batch.set(doc(db, 'users', user.uid), { islandId: ref.id })
      await batch.commit()

      // The island has to exist (with us as a member) before rules allow writing inside it.
      const ops = COLLECTIONS.flatMap((col) =>
        (contents[col] as { id: string }[]).map((item) => (b: ReturnType<typeof writeBatch>) => b.set(doc(sub(ref.id, col), item.id), item)),
      )
      await inBatches(db, ops)
      return ref.id
    },

    async lookupInvite(raw) {
      const code = cleanCode(raw)
      if (code.length !== 6) return null
      const snap = await getDoc(doc(db, 'invites', code))
      return snap.exists() ? ({ code, ...snap.data() } as Invite) : null
    },

    async joinIsland(user, invite, name) {
      const ref = islandRef(invite.islandId)
      // Rules only allow a non-member to add themselves, and only to an island with one resident.
      await updateDoc(ref, { memberUids: arrayUnion(user.uid) })
      await setDoc(doc(db, 'users', user.uid), { islandId: invite.islandId })

      // Now a member: take over the placeholder the inviter set up for us.
      const island = (await getDoc(ref)).data() as Island
      const placeholder = island.members.find((m) => !island.memberUids.includes(m.id))
      const members: Member[] = island.members.map((m) => (m === placeholder ? { id: user.uid, name: name || m.name } : m))
      await updateDoc(ref, { members, inviteCode: deleteField() })

      if (placeholder) {
        const ph = placeholder.id
        const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = []
        for (const d of (await getDocs(sub(invite.islandId, 'memories'))).docs) {
          const m = d.data() as Memory
          const patch: DocumentData = {}
          if (m.ratings?.[ph] != null) {
            patch[`ratings.${user.uid}`] = m.ratings[ph]
            patch[`ratings.${ph}`] = deleteField()
          }
          if (m.createdBy === ph) patch.createdBy = user.uid
          if (Object.keys(patch).length) ops.push((b) => b.update(d.ref, patch))
        }
        for (const col of ['recipes', 'rewards'] as const) {
          for (const d of (await getDocs(sub(invite.islandId, col))).docs) {
            if (d.data().createdBy === ph) ops.push((b) => b.update(d.ref, { createdBy: user.uid }))
          }
        }
        for (const d of (await getDocs(sub(invite.islandId, 'redemptions'))).docs) {
          if (d.data().uid === ph) ops.push((b) => b.update(d.ref, { uid: user.uid }))
        }
        await inBatches(db, ops)
      }
      await deleteDoc(doc(db, 'invites', invite.code))
    },

    async deleteIsland(user, islandId) {
      const island = (await getDoc(islandRef(islandId))).data() as Island | undefined
      // Contents first: rules check membership against the island doc, so it has to go last.
      const ops: ((b: ReturnType<typeof writeBatch>) => void)[] = []
      for (const col of [...COLLECTIONS, 'photos'] as const) {
        for (const d of (await getDocs(sub(islandId, col))).docs) ops.push((b) => b.delete(d.ref))
      }
      await inBatches(db, ops)
      if (island?.inviteCode) await deleteDoc(doc(db, 'invites', island.inviteCode))
      await deleteDoc(islandRef(islandId))
      await deleteDoc(doc(db, 'users', user.uid))
    },

    watchIsland(islandId, cb, onError) {
      const unsubs = [
        onSnapshot(
          islandRef(islandId),
          (s) => {
            // Offline with nothing cached yet looks like a missing island; wait for the server instead.
            if (!s.exists() && s.metadata.fromCache) return
            cb({ island: (s.data() as Island | undefined) ?? null })
          },
          // Rules deny reading an island that's been deleted (or that you don't live on): treat it as gone.
          (err) => ((err as { code?: string }).code === 'permission-denied' ? cb({ island: null }) : onError(err)),
        ),
        ...COLLECTIONS.map((col) => {
          const q = col === 'milesLog' ? query(sub(islandId, col), orderBy('at', 'desc'), limit(150)) : sub(islandId, col)
          return onSnapshot(q, (s) => cb({ [col]: s.docs.map((d) => d.data()) }), onError)
        }),
      ]
      return () => unsubs.forEach((u) => u())
    },

    // Writes aren't awaited: the local cache applies them at once (and offline), and the server catches up.
    sink(islandId, onError) {
      const fail = (p: Promise<unknown>) => void p.catch(onError)
      return {
        put: (col, item) => fail(setDoc(doc(sub(islandId, col), item.id), item)),
        patch: (col, id, fields) =>
          fail(
            updateDoc(
              doc(sub(islandId, col), id),
              Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v === null ? deleteField() : v])),
            ),
          ),
        remove: (col, id) => fail(deleteDoc(doc(sub(islandId, col), id))),
        // A field path, so the two of you rating at once can't overwrite each other.
        rate: (memoryId, player, rating) =>
          fail(updateDoc(doc(sub(islandId, 'memories'), memoryId), { [`ratings.${player}`]: rating > 0 ? rating : deleteField() })),
        addMiles(entry) {
          const batch = writeBatch(db)
          batch.set(doc(sub(islandId, 'milesLog'), entry.id), entry)
          batch.update(islandRef(islandId), { milesBalance: increment(entry.amount) })
          fail(batch.commit())
        },
        updateIsland: (patch) => fail(updateDoc(islandRef(islandId), patch)),
        setPhoto: (memoryId, dataUrl) =>
          fail(dataUrl ? setDoc(doc(sub(islandId, 'photos'), memoryId), { data: dataUrl }) : deleteDoc(doc(sub(islandId, 'photos'), memoryId))),
      }
    },

    async loadPhoto(islandId, memoryId) {
      const snap = await getDoc(doc(sub(islandId, 'photos'), memoryId))
      return (snap.data()?.data as string | undefined) ?? null
    },
  }
}

/** Null when Firebase isn't configured: the app then runs in local mode, saving to this browser only. */
export const cloud: Cloud | null = config.apiKey && config.projectId ? cloudBackend(initializeApp(config)) : null

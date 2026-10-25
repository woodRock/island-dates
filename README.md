# Island Dates

A cosy date night app for two, inspired by Animal Crossing: New Horizons, installable as a phone app (PWA).
It's a personal fan project: all the art is original SVG, and it isn't affiliated with Nintendo.

```bash
npm install
npm run dev
```

Intended to be served by GitHub Pages from `docs/` at https://woodrock.github.io/island-dates/.
To publish, run `npm run build` (it writes to `docs/`) and commit the result.

## Saves and sync

- **Cloud mode** (when `.env.local` is present): the Firebase project `island-dates-k3wa` (see `.env.example`).
  Sign in with Google or email/password. One of you starts the island; the other joins with the six-letter
  invite code from Island settings. Everything syncs live through Firestore and works offline.
- **Local mode** (no Firebase config): the island stays in this browser (`localStorage`, key `island-dates`),
  with one phone rating for both residents.

Firestore layout:

| Path | Holds |
|---|---|
| `users/{uid}` | `islandId`: which island you live on |
| `invites/{code}` | Island id and names; readable by code only, deleted once your partner joins |
| `islands/{id}` | Name, hemisphere, `members`, `memberUids`, `milesBalance` (updated with atomic increments), `inviteCode` |
| `islands/{id}/recipes`, `memories`, `rewards`, `redemptions`, `islandItems`, `milesLog` | The island's contents |
| `islands/{id}/photos/{memoryId}` | The full photo as a JPEG data URL (memories keep a small `thumb`) |

Photos are resized on the phone (about 1100px, under 700 KB) and stored in Firestore rather than Cloud Storage,
so the project stays on the free Spark plan.

`firestore.rules` lets only an island's residents read or write it, and lets a second person add themselves
(and nothing else) to an island with one resident. Deploy with `firebase deploy --only firestore`.
Before signing in from GitHub Pages, add `woodrock.github.io` under Firebase console → Authentication →
Settings → Authorized domains.

## Screens

Ratings are per person: signed in, you rate on your phone and your partner on theirs, and a date is
donated to the museum once both of you have.

| Screen | What it does |
|---|---|
| Island | SVG island that follows the real season (hemisphere-aware) and time of day; Isabelle's tappable announcements; stats; Log a date |
| Recipes | 48 starter date ideas, filters (cheap / cosy / outdoors / in season), Surprise us, Craft new, edit/remove |
| Museum | Four wings; display cases with photo thumbnails, plus "?" cases for untried ideas; polaroid photo per memory |
| Nook Miles | +500 per date; reward shop you define and redeem (logs who); decorations bought with miles |

Game rules live in `src/game/logic.ts`, villager lines in `src/game/text.ts`, the island art in `src/ui/IslandArt.tsx`.

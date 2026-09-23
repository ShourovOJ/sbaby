# sbaby: daily play-and-milestone planner for babies aged 0–24 months

## Context
A working parent has little time with their baby and wants each session to count. The app should:
1. Know the baby's exact age in days.
2. Give **today's checklist of play games** (several per day, not one), each suited to the baby's age and designed to be fun for the baby.
3. While or after playing each game, let the parent tick a **"watch for" checklist**: what the baby actually did (e.g. "followed the rattle with eyes", "reached for it", "laughed").
4. Turn those observations into **growth monitoring**: milestones get flagged as "emerging" or "achieved", and the parent sees progress by development area over time.

**The core loop:** open app → today's game checklist → play game → tick what the baby did → growth updates.

The repo `ShourovOJ/sbaby` has only `docs/PLAN.md` on branch `claude/baby-activity-tracker-c3slt2`. This is a new project.
**Decisions made:** web app / PWA, data stored on the device only, English only, growth tracking = developmental milestones, UI uses the **sbaby design system** (uploaded PDF, see "Design system" below).

---

## Design system (sbaby)
**What the PDF actually contains:** one page with four development-area tokens. Each area has a solid color, a light tint for card backgrounds, and a dark shade for text. The page background is warm cream. The headings use a rounded geometric sans (looks like **Poppins** SemiBold), and token names are set in a monospace font. Cards have large rounded corners (~24px); swatches ~12px.

| Token | Solid | Tint (card bg) | Text (on tint) |
|---|---|---|---|
| `--area-motor` | `#EC7A61` coral | `#FDF3F0` | `#A33B27` |
| `--area-cognitive` | `#6FA8DC` blue | `#EEF3FB` | `#2A5A8A` |
| `--area-language` | `#F6BF55` yellow | `#FEF8E7` | `#7A5710` |
| `--area-social` | `#6FB28C` green | `#EEF6EE` | `#2E6446` |
| `--bg` | `#FFFBF6` cream | | |

The hex values were sampled from the PDF render, because the PDF is an image with no embedded color values. If you have the exact codes, send them and I'll swap them in. It's a one-line change per token.

**This changes the data model, for the better:** the design system has **4 development areas**, not the 6 I had planned. Those 4 match the CDC's own four milestone domains (Movement/Physical, Cognitive, Language/Communication, Social/Emotional). So `Domain = 'motor' | 'cognitive' | 'language' | 'social'`, and every CDC milestone maps 1:1 without any guessing. Fine motor and gross motor both go under Motor; sensory play goes under Cognitive.

**How the area colors are used:** each game card and milestone gets the tint of its area as its background and the area's dark shade for its title, the same pattern as the PDF. The solid color is used for swatches, the area icon, progress bars and chart series. **Brutal truth on contrast:** white text on the yellow (#F6BF55) or the green fails WCAG, so text never sits on a solid color. Text always uses the dark shade on a tint.

**What the PDF doesn't define (so I'll derive it and document it as "derived" for you to override):**
- neutral text and border greys
- a primary action color. I'll use Motor coral for primary buttons, with dark text or a darker coral shade that meets contrast
- type scale: Poppins for headings, Nunito or Inter for body, a 4px spacing scale
- button, checkbox, tri-state "Did it / Not yet / Skip" control, bottom tab bar, sheet and empty-state components
- states (hover, pressed, disabled, focus ring)
- dark mode. **v1 ships light only**, because your palette is light-only.

**Brutal truth:** this is a color key, not a design system. Four swatches won't make screens look consistent on their own. The components I derive will be *my* taste on top of your colors. If you care about the look, give me at least one or two finished screen mockups (Today and Play). Without them, expect a round of visual revisions after the first build.

---

## The hard truths (read before we build)
1. **Doing a game doesn't measure growth. Watching the baby during the game does.** "We did tummy time" tells you nothing about development. "During tummy time she lifted her head to 45°" does. So each game comes with a short **"watch for"** checklist, and those observations are the growth data. What the app must not do is claim the games *caused* the growth. That would be pseudo-science and a liability risk.
2. **The content is the product. The code is not.** Anyone can build a checklist app in a week. What matters is the quality and safety of the ~80 games and ~90 milestones. Milestones will come from the CDC "Learn the Signs. Act Early" 2022 checkpoints (these are set at the age 75% of babies reach them, not 50%). Activities written by us are fine for your own use, **but a pediatrician or early-childhood specialist must review them before any public release.**
3. **On-device only will hurt you specifically.** You're a working father, so your partner probably spends more time with the baby, and she can't see or add to your log. Clearing the browser or losing the phone deletes everything. For v1 we reduce this with JSON export/import. Cloud sync should be the first v2 item if you use the app daily.
4. **PWA reminders on iOS are weak.** Web push only works after the app is added to the Home Screen (iOS 16.4+), and even then it's unreliable. v1 will **not** promise daily reminders.
5. **As a business, this market is crowded** (Kinedu, BabySparks, Lovevery, Huckleberry). An English-only, device-only v1 is a good tool for you. It has no moat. The obvious edge for Ostad's audience is Bangla plus local context (local toys, household items, family structure), and you've deferred that. Fine for v1. Just don't mistake v1 for a product strategy.
6. **Don't write content for all 730 days.** Content is written per **age band**. The "daily" feel comes from the planner rotating activities within a band.

---

## Stack
| Concern | Choice | Why |
|---|---|---|
| App | **Vite + React 18 + TypeScript** SPA | No server needed for device-only data; simplest PWA |
| Routing | React Router | Standard |
| Storage | **IndexedDB via Dexie** (+ `dexie-react-hooks` `useLiveQuery`) | Reliable offline storage, reactive queries |
| PWA | `vite-plugin-pwa` (Workbox) | Installable, offline |
| Styling | Tailwind CSS reading **CSS variable tokens** (`src/styles/tokens.css`) | sbaby tokens live in one file; Tailwind classes like `bg-area-motor-tint` point to them |
| Fonts | Poppins (headings) + Nunito (body), self-hosted via `@fontsource` | Works offline in the PWA; no Google Fonts request at runtime |
| Validation | Zod | Checks content JSON and import files |
| Dates | `date-fns` | Age math |
| Tests | Vitest (unit), Playwright (e2e, Chromium at `/opt/pw-browsers/chromium`) | |

## Project structure
```
src/
  main.tsx, App.tsx, router.tsx
  styles/tokens.css            # sbaby area tokens (solid/tint/text) + derived neutrals, type, spacing, radius
  ui/                          # AreaCard, AreaChip, Button, TriStateCheck, Sheet, ProgressBar, TabBar, EmptyState
  content/
    games.json                 # static game library with watch-for lists
    milestones.json            # CDC 2022 checkpoints
    schema.ts                  # Zod schemas + typed loaders
  domain/
    age.ts                     # ageInDays, corrected age, "4 mo 20 d" formatting, age band
    planner.ts                 # picks today's game checklist
    growth.ts                  # observations → milestone status (emerging / suggest achieved)
    stats.ts                   # streaks, minutes, coverage by development area, milestone progress
  db/
    db.ts                      # Dexie schema + versioning
    repo.ts                    # babies, logs, milestoneRecords, dailyPlans CRUD
    backup.ts                  # export/import JSON (Zod-validated)
  features/
    onboarding/  today/  play/  library/  growth/  progress/  settings/
tests/  e2e/
docs/design-system.md          # sbaby tokens, what was derived, usage rules (text never on a solid color)
```

## Data model
**Static content (bundled JSON):**
- `Game { id, title, ageMinDays, ageMaxDays, domains: Domain[], durationMin, materials[], steps[], whyItHelps, safetyNotes[], watchFor: Observation[] }`
- `Observation { id, text, milestoneId? }`: a behaviour to look for during the game, e.g. "Brings hands to the toy". Most are linked to a CDC milestone.
- `Milestone { id, title, domain, checkpointMonths: 2|4|6|9|12|15|18|24, source: "CDC 2022" }`
- `Domain = 'motor' | 'cognitive' | 'language' | 'social'` (the same four as the design-system tokens and the CDC domains)

**User data (IndexedDB):**
- `Baby { id, name, dob, bornWeeksGestation?, createdAt }`. The gestation field is used for preterm babies (<37 wk): the app uses *corrected age* until 24 months.
- `DailyPlan { babyId, date, gameIds[] }` is saved so today's checklist doesn't change on reload.
- `GameLog { id, babyId, gameId, date, completedAt, durationMin, reaction: 'loved'|'ok'|'fussy', observations: { observationId, result: 'yes'|'not_yet'|'skipped' }[], note? }`
- `MilestoneRecord { id, babyId, milestoneId, status: 'emerging'|'achieved', firstSeenOn, achievedOn?, note? }`
- `Settings { gamesPerDay (default 4, range 3–6) }`

**How observations become growth data (`domain/growth.ts`):**
- If an observation linked to milestone M is ticked "yes" once, M becomes **emerging**.
- If it's ticked "yes" in **2 separate sessions on different days**, the app suggests "Mark as achieved?". The parent confirms, because the parent is the judge, not the app. The parent can also mark any milestone directly.
- "Not yet" results are stored, but they never trigger warnings on their own.

The schema supports multiple babies. v1 UI supports one baby.

## Planner (`domain/planner.ts`), pure function
Input: baby age (corrected), game library, logs from the last 14 days, milestone records.
1. **Eligible** games are those where `ageMinDays ≤ age ≤ ageMaxDays`.
2. **Score** each one:
   - up for development areas under-covered in the last 7 days
   - up if its "watch for" list covers milestones that are not yet achieved, or are only emerging, and are due at the current or next checkpoint. This means the app keeps offering games that test what's about to develop.
   - down if played in the last 3 days
   - small bonus if a past log was "loved"
3. Pick the top N (default 4) while keeping development areas diverse. Break ties with a seed made from `babyId + date`, so results are deterministic and testable.
4. Save the result as `DailyPlan`. A "Swap" button replaces one game with the next best.

## Screens
1. **Onboarding:** baby name, date of birth, "born early?" and weeks. Then shows "Day 142 · 4 months 20 days".
2. **Today (home), the game checklist:**
   - header: day count, age, "2/4 games played today", and a streak
   - a checklist of N game cards. Each card shows the title, minutes, development-area chips, a tick state and a swap button.
3. **Play screen** (tap a game): steps, materials and safety notes at the top, then the **"Watch for" checklist**. Each item has three buttons: ✓ Did it / Not yet / Skip. At the end:
   - pick the reaction (loved / ok / fussy) and duration, then "Done"
   - the game is ticked off on Today
   - if the observations make a milestone emerging or suggest it's achieved, a small card says: "Looks like *Holds head steady* — mark as achieved?"
4. **Library:** all games, filtered by age band and development area. You can play any of them ad hoc, and it's logged the same way.
5. **Growth** (milestones):
   - grouped by CDC checkpoint, current checkpoint first
   - each milestone shows Not seen / Emerging / Achieved, the date, and which games it was observed in
   - "Coming up next" list
   - you can mark any milestone manually
   - if milestones from a *past* checkpoint are still not achieved, a calm note appears: "Worth mentioning at your next pediatric visit". No alarms, no scores.
6. **Progress:**
   - play streak
   - games played and minutes this week and this month
   - coverage by development area (bars, last 7 and 30 days)
   - milestone timeline (achieved on date vs. checkpoint)
   - history log by day, including what was observed
7. **Settings:** edit baby, games per day, export/import backup, delete all data. Plus a disclaimer: "Not medical advice."

## Content scope for v1
- Age bands: 0–1 mo, 1–2, 2–3, 3–4, 4–6, 6–9, 9–12, 12–15, 15–18, 18–24.
- About 7–9 games per band (~80 total), spread across all four development areas (Motor, Cognitive, Language, Social). Each game has 2–4 "watch for" observations and its own safety notes (e.g. tummy time only while awake and supervised, choking-size objects).
- All CDC 2022 milestones for the 2–24-month checkpoints (~90). **Every milestone must be watchable in at least one game.**
- A Zod test checks every content file:
  - ids are unique and age ranges are valid
  - every `milestoneId` a game references exists
  - every milestone is covered by at least one game
  - every band has at least 6 games and covers all 4 development areas

## Build order
0. Write `docs/design-system.md` from the sbaby PDF: the area tokens (table above), the derived tokens marked as derived, and the usage rules.
1. Scaffold (Vite, TS, Tailwind, router, PWA plugin, Vitest, Playwright). Implement `tokens.css`, the Tailwind theme mapping, `ui/` primitives and self-hosted fonts. The app icon is a simple mark on cream using the four area colors.
2. `domain/age.ts` and `db/`, then onboarding.
3. Content JSON, schema and validation test.
4. Planner, Today checklist, Play screen with the watch-for checklist, and logging.
5. `domain/growth.ts` (turns observations into milestone status) and the Growth screen.
6. Progress screen and stats.
7. Library and settings (backup/restore).
8. PWA manifest, icons and offline check. Then commit and push to `claude/baby-activity-tracker-c3slt2`.

## Verification
- **Unit (Vitest):**
  - `age.ts`: leap years, corrected age for a 32-week baby, formatting
  - `planner.ts`: only eligible games, no repeats within 3 days, development-area diversity, deterministic for the same seed
  - `growth.ts`: one "yes" makes a milestone emerging; "yes" on 2 different days triggers the achieved suggestion; two "yes" on the same day does not; "not yet" never raises a flag
  - `stats.ts`: streak across gaps, coverage math
  - content validation
  - backup: export → import gives identical data
- **E2E (Playwright, Chromium):**
  1. Onboard a baby born 140 days ago. Today shows a checklist of 4 games.
  2. Play one: tick 2 watch-for items "Did it", pick "loved", tap Done. The game is ticked on Today (1/4) and the linked milestone shows as Emerging on Growth.
  3. Seed a log from yesterday with the same observation. The "mark as achieved?" suggestion appears; accept it.
  4. Progress shows the right counts and minutes.
  5. Reload the page: everything is still there.
  6. Export, delete all data, import: everything is restored.
- `npm run build`, then `vite preview`, then check the manifest and service worker register and the app loads offline (Playwright `context.setOffline(true)`).
- Manual check at 375px phone width.

## Out of scope for v1 (candidates for v2)
Cloud sync and sharing with a partner, Bangla, weight/height/WHO percentile charts, reliable reminders, multiple babies in the UI, photos per milestone.

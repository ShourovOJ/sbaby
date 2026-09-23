# sbaby: working notes for Claude

sbaby is a daily play planner for parents of babies aged 0–24 months. Each day the parent gets a short **checklist of games** for the baby's exact age. While playing, they tick a **"watch for"** list of what the baby actually did ("Did it / Not yet / Skip"). Those observations track the baby's **developmental milestones** over time.

The owner is Shourov, cofounder and COO at Ostad. He built this for himself first: a working father who wants his limited time with his baby to count. **He wants brutally honest feedback.** Say plainly when something is a bad idea, unproven, or risky.

## Product decisions (already made, don't re-ask)

- **Platform:** web app / PWA (Vite + React). Not native.
- **Data:** stays on the device only (IndexedDB). No accounts, no backend. Backup/restore is a JSON file.
- **Language:** English only for v1.
- **Growth tracking = milestones only.** No weight/height/percentile charts in v1.
- **Four development areas: Motor, Cognitive, Language, Social.** They come from the sbaby design system, and they match the CDC's own four milestone domains one to one. Fine and gross motor both count as Motor; sensory play counts as Cognitive.
- **Milestones:** CDC "Learn the Signs. Act Early." checklists (2022). 100 milestones at 2, 4, 6, 9, 12, 15, 18 and 24 months. Each is something 75% or more of children do by that age.
- **Several games per day** (default 4, adjustable 3–6), shown as a checklist. Never just one activity.
- **How observations become growth:**
  - One "Did it" makes the milestone **emerging**.
  - "Did it" on **two different days** makes the app *suggest* "mark as achieved?". **The parent confirms.** The app never marks a milestone achieved on its own.
  - "Not yet" never raises a warning.
- **Corrected age** for babies born before 37 weeks, used until 24 months (as doctors do).
- **Deployed as a private claude.ai Artifact:** https://claude.ai/artifact/BYZUXRasceSXhNcvPU7MZN. The normal PWA build still works for hosting anywhere else.

## Honest caveats (keep repeating them when relevant)

1. **Nobody medically qualified has reviewed the games.** A pediatrician or early-childhood specialist must review them before sbaby goes to other families. The disclaimer in Settings and on Growth must stay.
2. **Device-only data is the biggest weakness.** A partner can't see the log, and clearing the browser deletes it. On the Artifact, each browser (phone, laptop, partner) has its own separate log. First v2 candidate: cloud sync, e.g. the Artifact `db` capability, with a shared family log.
3. **Games do not *cause* growth.** Never word anything as "this game improves X". Progress by area shows *what was played*, not development.
4. **The design system PDF is only a color key.** Four area colors, Poppins, and a card radius. Everything else in the UI was derived and can be overridden.
5. **The business has no moat as-is.** Kinedu, BabySparks and Lovevery already exist. The real edge for Ostad's market is Bangla plus local context, which has been deferred.
6. **No reliable daily reminders.** iOS web push is weak, and inside claude.ai they aren't possible at all.

## Commands

```bash
npm install
npm run dev              # http://localhost:5173
npm test                 # Vitest unit tests (content, age, planner, growth, stats, repo/backup)
npm run typecheck        # tsc -p .
npm run build            # typecheck + PWA build → dist/
npm run build:artifact   # typecheck + Artifact build → dist-artifact/sbaby.html
npm run test:e2e         # Playwright (builds + serves the PWA; artifact spec builds its own page)
```

In the cloud container, Playwright needs `PW_CHROMIUM_PATH=/opt/pw-browsers/chromium`. Never run `playwright install`.

Before every push, run `npm test`, `npm run build` and the e2e suite, and make sure all pass.

## Stack

React 19, Vite 8 (rolldown), TypeScript 7, Tailwind CSS 4 (CSS-first `@theme`), React Router 8, Dexie 4 + `dexie-react-hooks`, Zod 4, date-fns 4, `vite-plugin-pwa`, Vitest 5, Playwright 1.63. Fonts are self-hosted via `@fontsource` (latin subsets only).

## Layout

| Path | What |
|---|---|
| `src/content/games.ts` | The game library (65 games). Each game has an age range in days, areas, steps, `whyItHelps`, `safetyNotes`, and `watchFor` observations linked to milestone ids |
| `src/content/milestones.ts` | CDC 2022 milestones. Ids look like `m4-head-steady` |
| `src/content/types.ts`, `schema.ts` | Types and Zod schemas (`AREAS`, `CHECKPOINTS`) |
| `src/domain/age.ts` | Age in days, corrected age, `formatAge` ("4 mo 20 d"), `ageSummary` |
| `src/domain/planner.ts` | `planDay` / `swapGame` / `rankGames`: pure and seeded by baby id + date |
| `src/domain/growth.ts` | Observations → `milestoneSignals` → status (`not_seen / emerging / achieved`), `achievedSuggestions`, `outcomeOfLog` |
| `src/domain/stats.ts` | Streak, totals, area coverage, checkpoint progress |
| `src/db/db.ts`, `repo.ts` | Dexie schema and all reads/writes (`ensureDailyPlan`, `swapInPlan`, `addLog`, `markAchieved`, …) |
| `src/db/backup.ts` | Zod-validated JSON export/import. Loaded lazily to keep Zod out of the main bundle |
| `src/app/` | Hooks, layout and tab bar, `GameCard`, `SuggestionCard`, `StorageGate`, `platform.ts` (`saveFile`), `claude.d.ts` |
| `src/features/` | Screens: onboarding (`Welcome`, `BabyForm`), `today`, `play`, `library`, `growth`, `progress`, `settings` |
| `src/ui/` | Design-system components: `Button`/`buttonClass`, `AreaChip`, `AreaSwatch`, `Card`, `TriStateCheck`, `ProgressBar`, `Stepper`, `Sheet`, `ConfirmSheet`, `EmptyState`, `Icon`; `area.ts` holds the static class maps |
| `src/styles/tokens.css` | All design tokens (Tailwind `@theme`) |
| `scripts/artifact-page.mjs` | Turns the artifact build into the publishable page fragment |
| `scripts/gen-icons.mjs` | Renders the PWA icons into `public/` |
| `docs/PLAN.md`, `docs/design-system.md` | Product plan, and the mapping from the design system to code |
| `tests/`, `e2e/` | Unit tests and Playwright specs (`app.spec.ts` = PWA, `artifact.spec.ts` = published page) |

## Design system rules (sbaby)

- Area tokens, as solid / tint (card background) / ink (text on tint):
  - motor `#EC7A61 / #FDF3F0 / #A33B27`
  - cognitive `#6FA8DC / #EEF3FB / #2A5A8A`
  - language `#F6BF55 / #FEF8E7 / #7A5710`
  - social `#6FB28C / #EEF6EE / #2E6446`
  - background cream `#FFFBF6`
- The hex values were sampled from the PDF render. If Shourov sends exact codes, swap them in `tokens.css`.
- **Text never sits on a solid area color.** Always use `-ink` text on a `-tint` background. Solid colors are for dots, swatches, bars and icons only.
- Primary buttons use `#B84A33` (a darker coral, 5.2:1 with white). The original coral fails contrast with white text.
- A card or milestone is tinted by its **first** area. All of its areas show as chips.
- Use tokens and Tailwind classes only, never raw hex in components. Tailwind needs static class names, so per-area classes go through `areaClass` in `src/ui/area.ts`.
- Poppins for headings, Nunito for body. Cards `rounded-card` (24px), swatches `rounded-swatch` (12px).
- **Light theme only.** The design system defines no dark palette, so don't invent one unless asked.

## Code rules

- **Never use `confirm()`, `alert()` or `prompt()`.** Use `ConfirmSheet`. (They're blocked inside Artifacts.)
- **Never start a download with `<a download>` directly.** Use `saveFile()` from `src/app/platform.ts`. It goes through the Artifact `downloads` capability when `window.claude` exists, and uses a normal browser download otherwise.
- All storage access happens inside `StorageGate`, which opens the DB first and shows a clear message if the browser refuses storage.
- The router is `MemoryRouter` in the Artifact build and `HashRouter` in the PWA, chosen by `import.meta.env.MODE`. For "go back", check `location.key === 'default'`, never `window.history`.
- The Play screen is keyed by `location.key` (`FreshPlay` in `App.tsx`), so every visit starts a fresh session.
- Keep domain logic pure in `src/domain/` and put persistence in `src/db/repo.ts`.
- Dates are local `YYYY-MM-DD` strings (`todayISO()` / `toISODate()`). Use `useToday()` in components.
- Accessibility: every control needs an accessible name; toggles use `aria-pressed`, dialogs use `role="dialog"`. The e2e tests select by role and name, so keep labels stable.

## Content rules (games and milestones)

- Write for any parent: gender-neutral ("baby", "they"), no "Daddy/Mummy" in instructions.
- Every game has concrete steps, a one-line "why it helps", safety notes where there is any risk (tummy time supervised, choking-size objects, cords, stairs, water), and 1–4 watch-for items.
- `npm test` enforces:
  - unique ids and valid milestone links
  - every milestone is watchable in at least one game
  - each game's milestones fall within a sensible age window
  - every age band has at least 6 games covering all 4 areas
  - **every day from 0 to 730 has at least 6 eligible games**
- Adding content: edit `src/content/games.ts`, then run `npm test`.
- Planner behaviour (tested):
  - only games eligible for the baby's age
  - no repeats within 3 days while alternatives exist
  - spreads each day across areas
  - prefers games whose watch-for items cover milestones due now or next that aren't yet achieved
  - deterministic per baby per day
  - a day's plan is saved and stays stable

## Deploying to the Artifact

1. `npm run build:artifact` builds `dist-artifact/sbaby.html`: one self-contained fragment starting with `<title>sbaby Play Planner</title>`, with inline CSS, fonts as data URIs and inline JS. It has no doctype/html/head/body tags and no service worker. The script refuses to write the file if any of that is violated.
2. Publish with the Artifact tool:
   - **From this conversation:** republish `dist-artifact/sbaby.html` (same path keeps the URL).
   - **From any other conversation:** read `https://claude.ai/artifact/BYZUXRasceSXhNcvPU7MZN` first, then publish with that `url`. Without the `url` you get a separate new artifact.
   - Keep `capabilities: { downloads: true }`. Omitting `capabilities` on a redeploy keeps it. Don't pass `icon` again (it's "baby").
3. Artifact limits the app is built around:
   - no service worker, so no offline use or install
   - no native dialogs
   - no page-started downloads
   - only plain `#anchor` hashes survive in links
   - storage is per browser and per artifact, and can be missing
   - external scripts only from the CDN allowlist
4. The artifact is private to Shourov. Sharing happens through the page's Share menu. Claude can't change sharing.

## Testing notes

- Use `page.clock.setFixedTime(...)` to control "today". After changing the date, navigate to a different route and reload before checking a new day.
- `page.goto` to the *same* hash URL is a no-op in the browser. Go through another route first.
- `e2e/artifact.spec.ts` runs the exact published fragment on a fake origin, with a stand-in `window.claude` that only serves `downloads`. It also fails on console errors and on any outside request.

## Git

- Work on `claude/baby-activity-tracker-c3slt2` in `ShourovOJ/sbaby`. Commit with clear messages and push with `git push -u origin <branch>`.
- Don't open a pull request unless Shourov asks.
- Keep `docs/PLAN.md` in sync when product decisions change.

## Backlog / likely next asks

- Cloud sync / shared family log (Artifact `db` capability or a backend). This matters most.
- Bangla language and local-context games.
- Pediatric review of all 65 games.
- Weight/height with WHO percentile charts.
- Photos per milestone, multiple babies in the UI, reminders (PWA only).
- A fuller design system from Shourov (screen mockups) to replace the derived components.

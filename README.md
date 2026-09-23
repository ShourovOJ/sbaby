# sbaby

A daily play planner for parents of babies aged 0–24 months.

Open the app and get a short checklist of games for your baby's exact age. While you play, tick what your baby does ("Did it / Not yet / Skip"). Those observations track your baby's milestones over time.

- **65 games**, each with safety notes and a "watch for" checklist
- **100 milestones** from the CDC "Learn the Signs. Act Early." checklists (2022), grouped as Motor, Cognitive, Language and Social
- One "Did it" marks a milestone as *emerging*. "Did it" on two different days prompts "mark as achieved?", and **the parent confirms**.
- Corrected age for babies born before 37 weeks
- Installable PWA that works offline. **All data stays on the device.** Back up and restore with a JSON file.

> **Not medical advice.** The games have not yet been reviewed by a pediatrician. That review must happen before sbaby is offered to other families.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + production build (dist/)
npm test             # unit tests (Vitest)
npm run test:e2e     # end-to-end tests (Playwright; builds and serves the app)
```

If Playwright can't find a browser, set `PW_CHROMIUM_PATH` to a Chromium binary.

### Deploy as a claude.ai Artifact

```bash
npm run build:artifact   # → dist-artifact/sbaby.html (one self-contained page)
```

This build has no service worker, keeps routes in memory, inlines fonts, and saves backups through the Artifact `downloads` capability. It is published with `capabilities: { downloads: true }`. Data stays in the viewer's browser (IndexedDB) for that artifact. `e2e/artifact.spec.ts` runs this exact page.

## Where things are

| Path | What |
|---|---|
| `src/content/` | Game library (`games.ts`), CDC milestones (`milestones.ts`), schemas |
| `src/domain/` | Pure logic: age, daily planner, growth (observations → milestones), stats |
| `src/db/` | IndexedDB (Dexie) storage, backup import/export |
| `src/features/` | Screens: onboarding, Today, Play, Games, Growth, Progress, Settings |
| `src/ui/`, `src/styles/tokens.css` | sbaby design system components and tokens, see [docs/design-system.md](docs/design-system.md) |
| `docs/PLAN.md` | Product and implementation plan |

To add a game, add it to `src/content/games.ts`. `npm test` checks that ids are unique and that milestone links are valid. It also checks that every milestone is covered by at least one game, and that every day from birth to 24 months has at least 6 games.

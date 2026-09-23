import { expect, test } from '@playwright/test'
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

// Runs the exact page that gets published as a claude.ai Artifact: the fragment wrapped in a
// minimal document shell (as the platform does), served from its own origin, with a stand-in
// for the platform's `window.claude` runtime.
const ORIGIN = 'https://sbaby-artifact.test'
let fragment = ''

test.beforeAll(() => {
  execSync('npx vite build --mode artifact && node scripts/artifact-page.mjs', { stdio: 'ignore' })
  fragment = readFileSync('dist-artifact/sbaby.html', 'utf8')
})

test('the published artifact page works on its own, with no outside requests', async ({ page }) => {
  const errors: string[] = []
  const outside: string[] = []
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('request', (r) => !r.url().startsWith(ORIGIN) && !r.url().startsWith('data:') && outside.push(r.url()))

  await page.clock.setFixedTime(new Date('2026-06-01T10:00:00'))
  await page.addInitScript(() => {
    const saved: { filename: string; data: string }[] = []
    Object.assign(window, { __saved: saved })
    // Stand-in for the claude.ai runtime: only `downloads` is served, like the published page.
    Object.defineProperty(window, 'claude', {
      value: Object.freeze({
        use: async (name: string) =>
          name === 'downloads'
            ? Object.freeze({
                save: async (r: { filename: string; data: string }) => {
                  saved.push(r)
                  return { status: 'saved' }
                },
              })
            : null,
      }),
    })
  })
  await page.route(`${ORIGIN}/**`, (route) =>
    route.fulfill({
      contentType: 'text/html',
      body: `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"></head><body>${fragment}</body></html>`,
    }),
  )

  await page.goto(`${ORIGIN}/`)
  await expect(page).toHaveTitle('sbaby Play Planner')
  await page.getByLabel('Baby’s name').fill('Ayaan')
  await page.getByLabel('Date of birth').fill('2026-01-12')
  await page.getByRole('button', { name: 'Start playing' }).click()
  await expect(page.getByRole('heading', { name: 'Day 140' })).toBeVisible()
  await expect(page.getByRole('list', { name: 'Today’s games' }).getByRole('listitem')).toHaveCount(4)

  // Play from the library, then use Back (in-memory history).
  await page.getByRole('link', { name: 'Games', exact: true }).click()
  await page.getByRole('link', { name: 'Swat the toy' }).click()
  await page.getByRole('button', { name: 'Back' }).click()
  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
  await page.getByRole('link', { name: 'Swat the toy' }).click()
  await page.getByRole('group', { name: 'Swings an arm at the toy' }).getByRole('button', { name: 'Did it' }).click()
  await page.getByRole('button', { name: 'Loved it' }).click()
  await page.getByRole('button', { name: 'Done: save' }).click()
  await expect(page.getByText('Starting to show')).toBeVisible()

  // Data survives a reload of the page.
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Day 140' })).toBeVisible()
  await page.getByRole('link', { name: 'Progress' }).click()
  await expect(page.getByText('Games this week').locator('..')).toContainText('1')

  // Backup goes through the platform's downloads capability.
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('button', { name: 'Download backup' }).click()
  await expect(page.getByRole('status')).toContainText('Backup saved')
  const saved = await page.evaluate(() => (window as unknown as { __saved: { filename: string; data: string }[] }).__saved)
  expect(saved[0].filename).toBe('sbaby-backup-2026-06-01.json')
  expect(JSON.parse(saved[0].data).logs).toHaveLength(1)

  // In-page confirmation instead of confirm().
  await page.getByRole('button', { name: 'Delete all data' }).click()
  await page.getByRole('button', { name: 'Cancel' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  expect(errors).toEqual([])
  expect(outside).toEqual([])
})

test('explains itself when the browser refuses storage', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'indexedDB', {
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
  })
  await page.route(`${ORIGIN}/**`, (route) =>
    route.fulfill({ contentType: 'text/html', body: `<!doctype html><html><head><meta charset="utf-8"></head><body>${fragment}</body></html>` }),
  )
  await page.goto(`${ORIGIN}/`)
  await expect(page.getByRole('heading', { name: 'sbaby can’t save here' })).toBeVisible()
})

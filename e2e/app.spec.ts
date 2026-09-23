import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

async function at(page: Page, iso: string) {
  await page.clock.setFixedTime(new Date(`${iso}T10:00:00`))
}

async function onboard(page: Page) {
  await page.goto('/')
  await expect(page).toHaveURL(/#\/welcome$/)
  await page.getByLabel('Baby’s name').fill('Ayaan')
  await page.getByLabel('Date of birth').fill('2026-01-12') // 140 days before 2026-06-01
  await page.getByRole('button', { name: 'Start playing' }).click()
  await expect(page.getByRole('heading', { name: 'Day 140' })).toBeVisible()
}

async function playSwat(page: Page, reaction: string) {
  await page.goto('/#/play/swat-the-toy')
  await expect(page.getByRole('heading', { name: 'Swat the toy' })).toBeVisible()
  await page.getByRole('group', { name: 'Swings an arm at the toy' }).getByRole('button', { name: 'Did it' }).click()
  await page.getByRole('group', { name: 'Reaches out to grab the toy' }).getByRole('button', { name: 'Not yet' }).click()
  await page.getByRole('button', { name: reaction }).click()
  await page.getByRole('button', { name: 'Done: save' }).click()
  await expect(page.getByRole('heading', { name: 'Swat the toy: done!' })).toBeVisible()
}

test('onboard, play, grow, review progress, back up and restore', async ({ page }) => {
  await at(page, '2026-06-01')
  await onboard(page)

  // Today: a checklist of 4 games for a 140-day-old.
  const todayList = page.getByRole('list', { name: 'Today’s games' })
  await expect(todayList.getByRole('listitem')).toHaveCount(4)
  await expect(page.getByText('0 of 4 games played today')).toBeVisible()

  // Play from today's checklist.
  const firstTitle = (await todayList.getByRole('link').first().textContent())!.trim()
  await todayList.getByRole('link').first().click()
  await page.getByRole('button', { name: 'Loved it' }).click()
  await page.getByRole('button', { name: 'Done: save' }).click()
  await page.getByRole('link', { name: 'Back to today' }).click()
  await expect(page.getByText('1 of 4 games played today')).toBeVisible()
  await expect(todayList.getByRole('link', { name: `${firstTitle} (played today)` })).toBeVisible()

  // Swap an unplayed game.
  const before = await todayList.getByRole('link').allTextContents()
  await todayList.getByRole('button', { name: /^Swap / }).first().click()
  await expect.poll(async () => (await todayList.getByRole('link').allTextContents()).join()).not.toBe(before.join())

  // Day 1: "Did it" makes the milestone emerging.
  await playSwat(page, 'Loved it')
  await expect(page.getByText('Uses an arm to swing at toys')).toBeVisible()
  await expect(page.getByText('Starting to show')).toBeVisible()

  // Day 2: seen again on a different day, so sbaby asks to mark it achieved.
  await at(page, '2026-06-02')
  await page.goto('/#/')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Day 141' })).toBeVisible()
  await playSwat(page, 'It was OK')
  await expect(page.getByText('New milestone?')).toBeVisible()
  await page.getByRole('button', { name: 'Mark achieved' }).click()
  await expect(page.getByRole('status')).toHaveText('Marked as achieved: Uses an arm to swing at toys')

  // Growth shows it achieved at the 4-month checkpoint.
  await page.goto('/#/growth')
  await page.getByRole('tab', { name: /^4 months, 1 of 13 achieved$/ }).click()
  const row = page.getByRole('list', { name: '4-month milestones' }).getByRole('button', { name: /Uses an arm to swing at toys/ })
  await expect(row).toContainText('Achieved')

  // Progress totals.
  await page.goto('/#/progress')
  await expect(page.getByText('Games this week').locator('..')).toContainText('3')
  await expect(page.getByText('Day streak').locator('..')).toContainText('2')

  // Survives a reload.
  await page.reload()
  await expect(page.getByText('Games this week').locator('..')).toContainText('3')

  // Back up, wipe, restore.
  await page.goto('/#/settings')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download backup' }).click()])
  const backupPath = await download.path()
  expect(JSON.parse(await readFile(backupPath, 'utf8')).logs).toHaveLength(3)

  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Delete all data' }).click()
  await expect(page).toHaveURL(/#\/welcome$/)

  await page.getByLabel('Backup file').setInputFiles(backupPath)
  await expect(page.getByRole('heading', { name: 'Day 141' })).toBeVisible()
  await page.goto('/#/progress')
  await expect(page.getByText('Games this week').locator('..')).toContainText('3')
})

test('works offline once installed', async ({ page, context }) => {
  await at(page, '2026-06-01')
  await onboard(page)
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Day 140' })).toBeVisible()
  await page.getByRole('link', { name: 'Games', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Games' })).toBeVisible()
})

test('corrected age for a baby born early', async ({ page }) => {
  await at(page, '2026-06-01')
  await page.goto('/')
  await page.getByLabel('Baby’s name').fill('Mira')
  await page.getByLabel('Date of birth').fill('2026-03-03') // 90 days old
  await page.getByLabel('Born early (before 37 weeks)').check()
  await page.getByLabel('Born at').selectOption('32')
  await page.getByRole('button', { name: 'Start playing' }).click()
  await expect(page.getByRole('heading', { name: 'Day 90' })).toBeVisible()
  await expect(page.getByText(/corrected age 1 mo/)).toBeVisible()
})

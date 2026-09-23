import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { exportBackup, importBackup } from '../src/db/backup'
import { SbabyDB } from '../src/db/db'
import { addLog, ensureDailyPlan, getActiveBaby, markAchieved, saveBaby, setGamesPerDay, swapInPlan } from '../src/db/repo'

describe('repo + backup', () => {
  it('creates a stable daily plan, swaps, and round-trips through export/import', async () => {
    const d = new SbabyDB('test-roundtrip')
    const baby = await saveBaby({ name: 'Ayaan', dob: '2026-01-10' }, d)
    expect((await getActiveBaby(d))?.id).toBe(baby.id)

    const plan = await ensureDailyPlan(baby, '2026-06-01', d)
    expect(plan.gameIds).toHaveLength(4)
    expect((await ensureDailyPlan(baby, '2026-06-01', d)).gameIds).toEqual(plan.gameIds)

    const swapped = await swapInPlan(baby, '2026-06-01', plan.gameIds[0], d)
    expect(swapped).toBeTruthy()
    const after = await ensureDailyPlan(baby, '2026-06-01', d)
    expect(after.gameIds[0]).toBe(swapped)
    expect(after.swappedOut).toEqual([plan.gameIds[0]])

    await setGamesPerDay(5, d)
    const bigger = await ensureDailyPlan(baby, '2026-06-01', d)
    expect(bigger.gameIds).toHaveLength(5)
    expect(bigger.gameIds.slice(0, 4)).toEqual(after.gameIds)

    await addLog({ babyId: baby.id, gameId: after.gameIds[0], date: '2026-06-01', durationMin: 5, reaction: 'loved', observations: [] }, d)
    await markAchieved(baby.id, 'm2-looks-face', '2026-03-01', d)

    const backup = await exportBackup(d)
    const json = JSON.parse(JSON.stringify(backup))

    const other = new SbabyDB('test-roundtrip-2')
    await importBackup(json, other)
    const again = await exportBackup(other)
    expect({ ...again, exportedAt: '' }).toEqual({ ...backup, exportedAt: '' })
  })

  it('rejects files that are not sbaby backups', async () => {
    const d = new SbabyDB('test-reject')
    await saveBaby({ name: 'Keep me', dob: '2026-01-10' }, d)
    await expect(importBackup({ app: 'other' }, d)).rejects.toThrow()
    expect((await getActiveBaby(d))?.name).toBe('Keep me')
  })
})

import { describe, expect, it } from 'vitest'
import { games } from '../src/content/games'
import { milestoneById, milestones } from '../src/content/milestones'
import { gameSchema, milestoneSchema } from '../src/content/schema'
import { AREAS } from '../src/content/types'

const BANDS: [number, number][] = [
  [0, 30], [31, 60], [61, 90], [91, 121], [122, 182], [183, 273], [274, 365], [366, 456], [457, 547], [548, 730],
]

describe('content', () => {
  it('every milestone and game matches the schema', () => {
    for (const m of milestones) expect(() => milestoneSchema.parse(m), m.id).not.toThrow()
    for (const g of games) expect(() => gameSchema.parse(g), g.id).not.toThrow()
  })

  it('ids are unique', () => {
    expect(new Set(milestones.map((m) => m.id)).size).toBe(milestones.length)
    expect(new Set(games.map((g) => g.id)).size).toBe(games.length)
    for (const g of games) expect(new Set(g.watchFor.map((o) => o.id)).size, g.id).toBe(g.watchFor.length)
  })

  it('every referenced milestone exists', () => {
    for (const g of games)
      for (const o of g.watchFor) if (o.milestoneId) expect(milestoneById.has(o.milestoneId), `${g.id}/${o.id}`).toBe(true)
  })

  it('every milestone can be watched for in at least one game', () => {
    const covered = new Set(games.flatMap((g) => g.watchFor.map((o) => o.milestoneId)))
    expect(milestones.filter((m) => !covered.has(m.id)).map((m) => m.id)).toEqual([])
  })

  it('a game only watches for milestones due around its age range', () => {
    for (const g of games)
      for (const o of g.watchFor) {
        const m = o.milestoneId && milestoneById.get(o.milestoneId)
        if (!m) continue
        const dueDay = m.checkpointMonths * 30.4375
        // Not so early that the game is over long before the milestone is due…
        expect(dueDay, `${g.id} → ${m.id} due too late`).toBeLessThanOrEqual(g.ageMaxDays + 183)
        // …and not so late that it only catches milestones long overdue.
        expect(g.ageMinDays, `${g.id} → ${m.id} starts too late`).toBeLessThanOrEqual(dueDay + 92)
      }
  })

  it.each(BANDS)('age band %i–%i days has at least 6 games covering all 4 areas', (lo, hi) => {
    const inBand = games.filter((g) => g.ageMinDays <= hi && g.ageMaxDays >= lo)
    expect(inBand.length).toBeGreaterThanOrEqual(6)
    expect(new Set(inBand.flatMap((g) => g.areas))).toEqual(new Set(AREAS))
  })

  it('every single day from birth to 24 months has at least 6 eligible games', () => {
    for (let day = 0; day <= 730; day++) {
      const n = games.filter((g) => g.ageMinDays <= day && day <= g.ageMaxDays).length
      expect(n, `day ${day}`).toBeGreaterThanOrEqual(6)
    }
  })
})

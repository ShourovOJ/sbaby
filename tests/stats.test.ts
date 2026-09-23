import { describe, expect, it } from 'vitest'
import { gameById } from '../src/content/games'
import { milestones } from '../src/content/milestones'
import { areaCoverage, checkpointProgress, logsInLastDays, playStreak, totals } from '../src/domain/stats'
import type { GameLog } from '../src/domain/types'

const l = (date: string, gameId = 'face-to-face-chat', durationMin = 5): GameLog => ({
  id: `${gameId}-${date}-${Math.random()}`, babyId: 'b', gameId, date, completedAt: date, durationMin, reaction: 'ok', observations: [],
})

describe('stats', () => {
  it('counts a streak ending today or yesterday, and breaks on gaps', () => {
    const logs = [l('2026-06-01'), l('2026-06-02'), l('2026-06-04'), l('2026-06-05')]
    expect(playStreak(logs, '2026-06-05')).toBe(2)
    expect(playStreak(logs, '2026-06-06')).toBe(2)
    expect(playStreak(logs, '2026-06-07')).toBe(0)
    expect(playStreak([], '2026-06-07')).toBe(0)
  })

  it('totals games and minutes within a window', () => {
    const logs = [l('2026-05-20', undefined, 10), l('2026-06-01', undefined, 4), l('2026-06-07', undefined, 6)]
    expect(totals(logsInLastDays(logs, '2026-06-07', 7))).toEqual({ games: 2, minutes: 10 })
  })

  it('counts a two-area game in both areas', () => {
    const cov = areaCoverage([l('2026-06-01', 'face-to-face-chat'), l('2026-06-01', 'high-contrast-cards')], gameById)
    expect(cov).toEqual({ motor: 0, cognitive: 1, language: 1, social: 1 })
  })

  it('reports achieved milestones per checkpoint', () => {
    const rec = new Map([['m2-looks-face', { babyId: 'b', milestoneId: 'm2-looks-face', achievedOn: '2026-01-01' }]])
    const p = checkpointProgress(milestones, rec)
    expect(p[0]).toEqual({ checkpoint: 2, achieved: 1, total: 11 })
    expect(p.reduce((s, x) => s + x.total, 0)).toBe(milestones.length)
  })
})

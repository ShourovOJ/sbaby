import { describe, expect, it } from 'vitest'
import { gameById } from '../src/content/games'
import { achievedSuggestions, milestoneSignals, milestoneStatus, outcomeOfLog } from '../src/domain/growth'
import type { GameLog, MilestoneRecord } from '../src/domain/types'

let n = 0
const log = (date: string, result: 'yes' | 'not_yet', gameId = 'tummy-on-chest', obs = 'head-up'): GameLog => ({
  id: `l${n++}`,
  babyId: 'b',
  gameId,
  date,
  completedAt: `${date}T10:00:00Z`,
  durationMin: 5,
  reaction: 'ok',
  observations: [{ observationId: obs, result }],
})
const M = 'm2-head-up-tummy'
const none = new Map<string, MilestoneRecord>()

describe('growth', () => {
  it('one "did it" makes a milestone emerging', () => {
    const s = milestoneSignals([log('2026-01-01', 'yes')], gameById)
    expect(milestoneStatus(M, s, none)).toBe('emerging')
    expect(achievedSuggestions(s, none)).toEqual([])
  })

  it('"did it" on two different days suggests achieved', () => {
    const s = milestoneSignals([log('2026-01-01', 'yes'), log('2026-01-02', 'yes')], gameById)
    expect(achievedSuggestions(s, none)).toEqual([M])
  })

  it('two "did it" on the same day do not suggest achieved', () => {
    const s = milestoneSignals([log('2026-01-01', 'yes'), log('2026-01-01', 'yes')], gameById)
    expect(achievedSuggestions(s, none)).toEqual([])
  })

  it('"not yet" never raises anything', () => {
    const s = milestoneSignals([log('2026-01-01', 'not_yet'), log('2026-01-02', 'not_yet')], gameById)
    expect(milestoneStatus(M, s, none)).toBe('not_seen')
    expect(achievedSuggestions(s, none)).toEqual([])
  })

  it('counts the same milestone observed in different games', () => {
    const s = milestoneSignals(
      [log('2026-01-01', 'yes'), log('2026-01-03', 'yes', 'face-to-face-chat', 'looks-face'), log('2026-01-04', 'yes', 'tummy-on-chest', 'looks')],
      gameById,
    )
    expect(s.get('m2-looks-face')?.gameIds.sort()).toEqual(['face-to-face-chat', 'tummy-on-chest'])
  })

  it('a dismissed suggestion comes back only after a newer "did it"', () => {
    const logs = [log('2026-01-01', 'yes'), log('2026-01-02', 'yes')]
    const dismissed = new Map([[M, { babyId: 'b', milestoneId: M, dismissedOn: '2026-01-02' }]])
    expect(achievedSuggestions(milestoneSignals(logs, gameById), dismissed)).toEqual([])
    logs.push(log('2026-01-05', 'yes'))
    expect(achievedSuggestions(milestoneSignals(logs, gameById), dismissed)).toEqual([M])
  })

  it('achieved milestones are never suggested again', () => {
    const s = milestoneSignals([log('2026-01-01', 'yes'), log('2026-01-02', 'yes')], gameById)
    const rec = new Map([[M, { babyId: 'b', milestoneId: M, achievedOn: '2026-01-02' }]])
    expect(milestoneStatus(M, s, rec)).toBe('achieved')
    expect(achievedSuggestions(s, rec)).toEqual([])
  })

  it('reports what a single log changed', () => {
    const first = log('2026-01-01', 'yes')
    expect(outcomeOfLog(first, [first], gameById, none)).toEqual({ newlyEmerging: [M], suggestions: [] })
    const second = log('2026-01-02', 'yes')
    expect(outcomeOfLog(second, [first, second], gameById, none)).toEqual({ newlyEmerging: [], suggestions: [M] })
  })
})

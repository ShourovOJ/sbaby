import { describe, expect, it } from 'vitest'
import { gameById, games } from '../src/content/games'
import { eligibleGames, planDay, relevantCheckpoints, swapGame, type PlannerInput } from '../src/domain/planner'
import type { GameLog } from '../src/domain/types'

const base = (over: Partial<PlannerInput> = {}): PlannerInput => ({
  ageDays: 140,
  date: '2026-06-01',
  seed: 'baby-1',
  games,
  logs: [],
  statusOf: () => 'not_seen',
  ...over,
})
const playLog = (gameId: string, date: string): GameLog => ({
  id: `${gameId}-${date}`, babyId: 'baby-1', gameId, date, completedAt: date, durationMin: 5, reaction: 'ok', observations: [],
})

describe('planner', () => {
  it('only picks games eligible for the baby’s age', () => {
    for (const age of [0, 45, 140, 300, 500, 729]) {
      const plan = planDay(base({ ageDays: age }), 4)
      expect(plan).toHaveLength(4)
      for (const id of plan) {
        const g = gameById.get(id)!
        expect(g.ageMinDays).toBeLessThanOrEqual(age)
        expect(g.ageMaxDays).toBeGreaterThanOrEqual(age)
      }
    }
  })

  it('is deterministic for the same baby and day, and varies across days', () => {
    expect(planDay(base(), 4)).toEqual(planDay(base(), 4))
    const days = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05']
    const plans = days.map((date) => planDay(base({ date }), 4).join())
    expect(new Set(plans).size).toBeGreaterThan(1)
  })

  it('does not repeat a game played in the last 3 days when alternatives exist', () => {
    const first = planDay(base(), 4)
    const logs = first.map((id) => playLog(id, '2026-05-31'))
    const next = planDay(base({ logs }), 4)
    expect(next.filter((id) => first.includes(id))).toEqual([])
  })

  it('spreads the day across development areas', () => {
    for (const age of [30, 140, 300, 500, 700]) {
      const areas = new Set(planDay(base({ ageDays: age }), 4).flatMap((id) => gameById.get(id)!.areas))
      expect(areas.size, `age ${age}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('stops suggesting games whose milestones are all achieved, in favour of ones still due', () => {
    const plan = planDay(base(), 6)
    const achieved = new Set(plan.flatMap((id) => gameById.get(id)!.watchFor.map((o) => o.milestoneId!)))
    const next = planDay(base({ statusOf: (id) => (achieved.has(id) ? 'achieved' : 'not_seen') }), 6)
    expect(next).not.toEqual(plan)
  })

  it('swap returns a new eligible game that is not already in the plan or swapped out', () => {
    const plan = planDay(base(), 4)
    const next = swapGame(base(), plan, plan[0], [])
    expect(next).toBeTruthy()
    expect(plan).not.toContain(next)
    const again = swapGame(base(), [next!, ...plan.slice(1)], next!, [plan[0]])
    expect([...plan, next]).not.toContain(again)
    expect(eligibleGames(games, 140).map((g) => g.id)).toContain(again)
  })

  it('returns the checkpoints around the baby’s age', () => {
    expect(relevantCheckpoints(10)).toEqual([2])
    expect(relevantCheckpoints(140)).toEqual([4, 6])
    expect(relevantCheckpoints(730)).toEqual([18, 24])
  })
})

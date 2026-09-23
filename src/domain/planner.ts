import { differenceInCalendarDays, parseISO } from 'date-fns'
import { milestoneById } from '../content/milestones'
import { AREAS, CHECKPOINTS, type Area, type Game } from '../content/types'
import { daysToMonths, MAX_AGE_DAYS } from './age'
import type { MilestoneStatus } from './growth'
import { seededRandom } from './random'
import type { GameLog } from './types'

export const DEFAULT_GAMES_PER_DAY = 4
export const MIN_GAMES_PER_DAY = 3
export const MAX_GAMES_PER_DAY = 6

export interface PlannerInput {
  ageDays: number
  date: string
  seed: string
  games: Game[]
  logs: GameLog[]
  statusOf: (milestoneId: string) => MilestoneStatus
}

export function eligibleGames(games: Game[], ageDays: number): Game[] {
  const age = Math.min(Math.max(ageDays, 0), MAX_AGE_DAYS)
  return games.filter((g) => g.ageMinDays <= age && age <= g.ageMaxDays)
}

/** The checkpoint just passed and the one coming up, e.g. 4.5 months → [4, 6]. */
export function relevantCheckpoints(ageDays: number): number[] {
  const months = daysToMonths(ageDays)
  const next = CHECKPOINTS.find((c) => c >= months) ?? CHECKPOINTS[CHECKPOINTS.length - 1]
  const idx = CHECKPOINTS.indexOf(next)
  return idx > 0 ? [CHECKPOINTS[idx - 1], next] : [next]
}

export interface ScoredGame {
  game: Game
  score: number
}

export function rankGames(input: PlannerInput): ScoredGame[] {
  const { ageDays, date, games, logs, statusOf } = input
  const rng = seededRandom(`${input.seed}:${date}`)
  const today = parseISO(date)
  const gameById = new Map(games.map((g) => [g.id, g]))
  const relevant = relevantCheckpoints(ageDays)
  const earliestRelevant = Math.min(...relevant)

  const areaCount7 = Object.fromEntries(AREAS.map((a) => [a, 0])) as Record<Area, number>
  const lastPlayed = new Map<string, { daysAgo: number; reaction: GameLog['reaction'] }>()
  for (const log of logs) {
    const daysAgo = differenceInCalendarDays(today, parseISO(log.date))
    if (daysAgo < 0) continue
    if (daysAgo < 7) for (const a of gameById.get(log.gameId)?.areas ?? []) areaCount7[a]++
    const prev = lastPlayed.get(log.gameId)
    if (!prev || daysAgo < prev.daysAgo) lastPlayed.set(log.gameId, { daysAgo, reaction: log.reaction })
  }

  return eligibleGames(games, ageDays)
    .map((game) => {
      let score = 1

      // Balance development areas across the last week.
      score += game.areas.reduce((s, a) => s + 1.5 / (1 + areaCount7[a]), 0) / game.areas.length

      // Prefer games that let the parent watch for milestones that are due and not yet achieved.
      let milestoneBonus = 0
      for (const obs of game.watchFor) {
        if (!obs.milestoneId) continue
        const status = statusOf(obs.milestoneId)
        if (status === 'achieved') continue
        const cp = milestoneById.get(obs.milestoneId)?.checkpointMonths
        if (cp === undefined) continue
        if (relevant.includes(cp)) milestoneBonus += status === 'emerging' ? 1.5 : 1
        else if (cp < earliestRelevant) milestoneBonus += 0.5
      }
      score += Math.min(milestoneBonus, 3)

      // Avoid repeats; lean towards what the baby enjoyed.
      const last = lastPlayed.get(game.id)
      if (last) {
        if (last.daysAgo < 3) score -= 4
        else if (last.daysAgo < 7) score -= 1
        if (last.reaction === 'loved') score += 0.5
        if (last.reaction === 'fussy') score -= 0.5
      }

      score += rng() * 0.6
      return { game, score }
    })
    .sort((a, b) => b.score - a.score || a.game.id.localeCompare(b.game.id))
}

/** Greedy pick that also spreads development areas within the day, starting from games already chosen. */
function pickDiverse(ranked: ScoredGame[], count: number, exclude: Set<string>, alreadyPicked: Game[] = []): string[] {
  const picked: Game[] = []
  const areaUse = Object.fromEntries(AREAS.map((a) => [a, 0])) as Record<Area, number>
  for (const g of alreadyPicked) for (const a of g.areas) areaUse[a]++
  let pool = ranked.filter((r) => !exclude.has(r.game.id))
  while (picked.length < count && pool.length) {
    let best = pool[0]
    let bestScore = -Infinity
    for (const r of pool) {
      const overlap = r.game.areas.reduce((s, a) => s + areaUse[a], 0) / r.game.areas.length
      const adjusted = r.score - 0.75 * overlap
      if (adjusted > bestScore) {
        best = r
        bestScore = adjusted
      }
    }
    picked.push(best.game)
    for (const a of best.game.areas) areaUse[a]++
    pool = pool.filter((r) => r !== best)
  }
  return picked.map((g) => g.id)
}

export function planDay(input: PlannerInput, count: number): string[] {
  return pickDiverse(rankGames(input), count, new Set())
}

/** Replacement for one game in today's plan, or null if nothing else is eligible. */
export function swapGame(input: PlannerInput, plan: string[], outId: string, swappedOut: string[]): string | null {
  const kept = plan.filter((id) => id !== outId)
  const keptGames = input.games.filter((g) => kept.includes(g.id))
  const [next] = pickDiverse(rankGames(input), 1, new Set([...plan, ...swappedOut, outId]), keptGames)
  return next ?? null
}

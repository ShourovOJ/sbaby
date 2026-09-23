import { addDays, differenceInCalendarDays, parseISO } from 'date-fns'
import { AREAS, CHECKPOINTS, type Area, type Checkpoint, type Game, type Milestone } from '../content/types'
import { toISODate } from './age'
import type { GameLog, MilestoneRecord } from './types'

/** Consecutive days with at least one game, ending today (or yesterday, if today has none yet). */
export function playStreak(logs: GameLog[], today: string): number {
  const days = new Set(logs.map((l) => l.date))
  let cursor = parseISO(today)
  if (!days.has(today)) cursor = addDays(cursor, -1)
  let streak = 0
  while (days.has(toISODate(cursor))) {
    streak++
    cursor = addDays(cursor, -1)
  }
  return streak
}

/** Logs within the last `days` days, today included. */
export function logsInLastDays(logs: GameLog[], today: string, days: number): GameLog[] {
  const t = parseISO(today)
  return logs.filter((l) => {
    const ago = differenceInCalendarDays(t, parseISO(l.date))
    return ago >= 0 && ago < days
  })
}

export function totals(logs: GameLog[]): { games: number; minutes: number } {
  return { games: logs.length, minutes: logs.reduce((s, l) => s + l.durationMin, 0) }
}

/** How many games touched each area. A game in two areas counts for both. */
export function areaCoverage(logs: GameLog[], gameById: Map<string, Game>): Record<Area, number> {
  const out = Object.fromEntries(AREAS.map((a) => [a, 0])) as Record<Area, number>
  for (const l of logs) for (const a of gameById.get(l.gameId)?.areas ?? []) out[a]++
  return out
}

export interface CheckpointProgress {
  checkpoint: Checkpoint
  achieved: number
  total: number
}

export function checkpointProgress(
  milestones: Milestone[],
  records: Map<string, MilestoneRecord>,
): CheckpointProgress[] {
  return CHECKPOINTS.map((checkpoint) => {
    const list = milestones.filter((m) => m.checkpointMonths === checkpoint)
    return {
      checkpoint,
      total: list.length,
      achieved: list.filter((m) => records.get(m.id)?.achievedOn).length,
    }
  })
}

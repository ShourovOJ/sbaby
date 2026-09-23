import type { Game } from '../content/types'
import type { GameLog, MilestoneRecord } from './types'

export type MilestoneStatus = 'not_seen' | 'emerging' | 'achieved'

/** "Did it" on this many different days triggers the "mark as achieved?" suggestion. */
export const SUGGEST_AFTER_DAYS = 2

export interface MilestoneSignal {
  /** Distinct dates the parent ticked "Did it" for an observation linked to this milestone, ascending. */
  yesDates: string[]
  /** Games in which it was observed. */
  gameIds: string[]
}

export function milestoneSignals(logs: GameLog[], gameById: Map<string, Game>): Map<string, MilestoneSignal> {
  const acc = new Map<string, { dates: Set<string>; games: Set<string> }>()
  for (const log of logs) {
    const game = gameById.get(log.gameId)
    if (!game) continue
    for (const r of log.observations) {
      if (r.result !== 'yes') continue
      const obs = game.watchFor.find((o) => o.id === r.observationId)
      if (!obs?.milestoneId) continue
      let entry = acc.get(obs.milestoneId)
      if (!entry) acc.set(obs.milestoneId, (entry = { dates: new Set(), games: new Set() }))
      entry.dates.add(log.date)
      entry.games.add(game.id)
    }
  }
  const out = new Map<string, MilestoneSignal>()
  for (const [id, e] of acc) out.set(id, { yesDates: [...e.dates].sort(), gameIds: [...e.games] })
  return out
}

export function milestoneStatus(
  milestoneId: string,
  signals: Map<string, MilestoneSignal>,
  records: Map<string, MilestoneRecord>,
): MilestoneStatus {
  if (records.get(milestoneId)?.achievedOn) return 'achieved'
  if (signals.get(milestoneId)?.yesDates.length) return 'emerging'
  return 'not_seen'
}

/**
 * Milestones the app should ask "mark as achieved?" about: not yet achieved, seen on at least
 * SUGGEST_AFTER_DAYS different days, and seen again after any earlier "not yet" from the parent.
 */
export function achievedSuggestions(
  signals: Map<string, MilestoneSignal>,
  records: Map<string, MilestoneRecord>,
): string[] {
  const out: string[] = []
  for (const [id, s] of signals) {
    const rec = records.get(id)
    if (rec?.achievedOn) continue
    if (s.yesDates.length < SUGGEST_AFTER_DAYS) continue
    if (rec?.dismissedOn && !s.yesDates.some((d) => d > rec.dismissedOn!)) continue
    out.push(id)
  }
  return out
}

export interface LogOutcome {
  newlyEmerging: string[]
  suggestions: string[]
}

/** What changed because of one saved game log. Drives the result card on the Play screen. */
export function outcomeOfLog(
  log: GameLog,
  allLogs: GameLog[],
  gameById: Map<string, Game>,
  records: Map<string, MilestoneRecord>,
): LogOutcome {
  const before = milestoneSignals(
    allLogs.filter((l) => l.id !== log.id),
    gameById,
  )
  const after = milestoneSignals(
    allLogs.some((l) => l.id === log.id) ? allLogs : [...allLogs, log],
    gameById,
  )
  const game = gameById.get(log.gameId)
  const touched = new Set(
    log.observations
      .filter((r) => r.result === 'yes')
      .map((r) => game?.watchFor.find((o) => o.id === r.observationId)?.milestoneId)
      .filter((x): x is string => !!x),
  )
  const newlyEmerging = [...touched].filter(
    (id) => milestoneStatus(id, before, records) === 'not_seen' && milestoneStatus(id, after, records) === 'emerging',
  )
  const suggestions = achievedSuggestions(after, records).filter((id) => touched.has(id))
  return { newlyEmerging, suggestions }
}

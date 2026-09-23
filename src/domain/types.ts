export interface Baby {
  id: string
  name: string
  dob: string // YYYY-MM-DD
  bornWeeksGestation?: number
  createdAt: string
}

export type ObservationResult = 'yes' | 'not_yet' | 'skipped'
export type Reaction = 'loved' | 'ok' | 'fussy'

export interface GameLog {
  id: string
  babyId: string
  gameId: string
  date: string // YYYY-MM-DD
  completedAt: string // ISO timestamp
  durationMin: number
  reaction: Reaction
  observations: { observationId: string; result: ObservationResult }[]
  note?: string
}

export interface DailyPlan {
  babyId: string
  date: string
  gameIds: string[]
  /** Games swapped out today, so "swap" never offers them again the same day. */
  swappedOut: string[]
}

/** Only parent decisions are stored. "Emerging" is derived from game logs. */
export interface MilestoneRecord {
  babyId: string
  milestoneId: string
  achievedOn?: string
  /** Parent said "not yet" to an achieved suggestion on this date. */
  dismissedOn?: string
  note?: string
}

export interface SettingRow {
  key: string
  value: unknown
}

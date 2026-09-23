import { addDays, addMonths, differenceInCalendarDays, differenceInMonths, format, parseISO } from 'date-fns'

/** The app covers babies from birth to 24 months. */
export const MAX_AGE_DAYS = 730
const FULL_TERM_WEEKS = 40
const PRETERM_BELOW_WEEKS = 37

export interface BabyAgeInput {
  dob: string // YYYY-MM-DD
  bornWeeksGestation?: number
}

/** Local calendar date as YYYY-MM-DD. */
export function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

export function todayISO(): string {
  return toISODate(new Date())
}

export function ageInDays(dob: string, on: string): number {
  return differenceInCalendarDays(parseISO(on), parseISO(dob))
}

/** Days to subtract for a baby born before 37 weeks. Corrected age is used until 24 months. */
export function correctionDays(baby: BabyAgeInput): number {
  const w = baby.bornWeeksGestation
  if (!w || w >= PRETERM_BELOW_WEEKS) return 0
  return (FULL_TERM_WEEKS - w) * 7
}

/** The age used to pick games and judge milestones: corrected for prematurity, never below 0. */
export function developmentalAgeDays(baby: BabyAgeInput, on: string): number {
  const chrono = ageInDays(baby.dob, on)
  if (chrono >= MAX_AGE_DAYS) return chrono
  return Math.max(0, chrono - correctionDays(baby))
}

/** "4 mo 20 d", "3 wk 2 d", "5 d" for an age counted from `from` to `on`. */
export function formatAge(from: string, on: string): string {
  const start = parseISO(from)
  const end = parseISO(on)
  const days = differenceInCalendarDays(end, start)
  if (days < 0) return '0 d'
  const months = differenceInMonths(end, start)
  if (months >= 1) {
    const rest = differenceInCalendarDays(end, addMonths(start, months))
    return rest > 0 ? `${months} mo ${rest} d` : `${months} mo`
  }
  if (days >= 7) {
    const w = Math.floor(days / 7)
    const rest = days % 7
    return rest > 0 ? `${w} wk ${rest} d` : `${w} wk`
  }
  return `${days} d`
}

export interface AgeSummary {
  /** Chronological age in days: "Day 142". */
  day: number
  label: string
  /** Set only for preterm babies. */
  correctedLabel?: string
  developmentalDays: number
  beyondRange: boolean
}

export function ageSummary(baby: BabyAgeInput, on: string): AgeSummary {
  const day = ageInDays(baby.dob, on)
  const correction = correctionDays(baby)
  const developmentalDays = developmentalAgeDays(baby, on)
  return {
    day,
    label: formatAge(baby.dob, on),
    correctedLabel:
      correction > 0 && day < MAX_AGE_DAYS
        ? formatAge(toISODate(addDays(parseISO(baby.dob), correction)), on)
        : undefined,
    developmentalDays,
    beyondRange: day > MAX_AGE_DAYS,
  }
}

/** Age in (average) months, used to line up with milestone checkpoints. */
export function daysToMonths(days: number): number {
  return days / 30.4375
}

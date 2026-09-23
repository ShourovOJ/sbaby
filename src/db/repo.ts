import { gameById, games } from '../content/games'
import { developmentalAgeDays } from '../domain/age'
import { milestoneSignals, milestoneStatus } from '../domain/growth'
import { DEFAULT_GAMES_PER_DAY, planDay, swapGame, type PlannerInput } from '../domain/planner'
import { newId } from '../domain/random'
import type { Baby, DailyPlan, GameLog, MilestoneRecord } from '../domain/types'
import { db, type SbabyDB } from './db'

const ACTIVE_BABY = 'activeBabyId'
const GAMES_PER_DAY = 'gamesPerDay'

export async function getActiveBaby(d: SbabyDB = db): Promise<Baby | undefined> {
  const row = await d.settings.get(ACTIVE_BABY)
  if (typeof row?.value === 'string') return d.babies.get(row.value)
  return d.babies.toCollection().first()
}

export async function saveBaby(input: Omit<Baby, 'id' | 'createdAt'> & { id?: string }, d: SbabyDB = db): Promise<Baby> {
  const existing = input.id ? await d.babies.get(input.id) : undefined
  const baby: Baby = {
    id: existing?.id ?? newId(),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    name: input.name.trim(),
    dob: input.dob,
    bornWeeksGestation: input.bornWeeksGestation,
  }
  await d.transaction('rw', d.babies, d.settings, d.dailyPlans, async () => {
    await d.babies.put(baby)
    await d.settings.put({ key: ACTIVE_BABY, value: baby.id })
    // Age or prematurity may have changed, so today's plan could be wrong.
    if (existing) await d.dailyPlans.where('babyId').equals(baby.id).delete()
  })
  return baby
}

export async function getGamesPerDay(d: SbabyDB = db): Promise<number> {
  const row = await d.settings.get(GAMES_PER_DAY)
  return typeof row?.value === 'number' ? row.value : DEFAULT_GAMES_PER_DAY
}

export async function setGamesPerDay(n: number, d: SbabyDB = db): Promise<void> {
  await d.settings.put({ key: GAMES_PER_DAY, value: n })
}

async function plannerInput(baby: Baby, date: string, d: SbabyDB): Promise<PlannerInput> {
  const [logs, records] = await Promise.all([
    d.logs.where('babyId').equals(baby.id).toArray(),
    recordsMap(baby.id, d),
  ])
  const signals = milestoneSignals(logs, gameById)
  return {
    ageDays: developmentalAgeDays(baby, date),
    date,
    seed: baby.id,
    games,
    logs,
    statusOf: (id) => milestoneStatus(id, signals, records),
  }
}

/** Today's plan, created on first open of the day and then kept stable. */
export async function ensureDailyPlan(baby: Baby, date: string, d: SbabyDB = db): Promise<DailyPlan> {
  const existing = await d.dailyPlans.get([baby.id, date])
  const count = await getGamesPerDay(d)
  if (existing && existing.gameIds.length === count) return existing
  const input = await plannerInput(baby, date, d)
  let gameIds: string[]
  if (existing && existing.gameIds.length > count) {
    gameIds = existing.gameIds.slice(0, count)
  } else if (existing) {
    // Games-per-day went up: keep today's games and add more.
    const extra = planDay(input, count + existing.gameIds.length).filter(
      (id) => !existing.gameIds.includes(id) && !existing.swappedOut.includes(id),
    )
    gameIds = [...existing.gameIds, ...extra].slice(0, count)
  } else {
    gameIds = planDay(input, count)
  }
  const plan: DailyPlan = { babyId: baby.id, date, gameIds, swappedOut: existing?.swappedOut ?? [] }
  await d.dailyPlans.put(plan)
  return plan
}

export async function swapInPlan(baby: Baby, date: string, outId: string, d: SbabyDB = db): Promise<string | null> {
  const plan = await d.dailyPlans.get([baby.id, date])
  if (!plan) return null
  const next = swapGame(await plannerInput(baby, date, d), plan.gameIds, outId, plan.swappedOut)
  if (!next) return null
  await d.dailyPlans.put({
    ...plan,
    gameIds: plan.gameIds.map((id) => (id === outId ? next : id)),
    swappedOut: [...plan.swappedOut, outId],
  })
  return next
}

export async function addLog(log: Omit<GameLog, 'id' | 'completedAt'>, d: SbabyDB = db): Promise<GameLog> {
  const full: GameLog = { ...log, id: newId(), completedAt: new Date().toISOString() }
  await d.logs.add(full)
  return full
}

export async function recordsMap(babyId: string, d: SbabyDB = db): Promise<Map<string, MilestoneRecord>> {
  const rows = await d.milestoneRecords.where('babyId').equals(babyId).toArray()
  return new Map(rows.map((r) => [r.milestoneId, r]))
}

export async function markAchieved(babyId: string, milestoneId: string, on: string, d: SbabyDB = db): Promise<void> {
  const rec = await d.milestoneRecords.get([babyId, milestoneId])
  await d.milestoneRecords.put({ ...rec, babyId, milestoneId, achievedOn: on })
}

export async function unmarkAchieved(babyId: string, milestoneId: string, d: SbabyDB = db): Promise<void> {
  const rec = await d.milestoneRecords.get([babyId, milestoneId])
  if (!rec) return
  const { achievedOn: _drop, ...rest } = rec
  await d.milestoneRecords.put(rest)
}

export async function dismissSuggestion(babyId: string, milestoneId: string, on: string, d: SbabyDB = db): Promise<void> {
  const rec = await d.milestoneRecords.get([babyId, milestoneId])
  await d.milestoneRecords.put({ ...rec, babyId, milestoneId, dismissedOn: on })
}

export async function deleteAllData(d: SbabyDB = db): Promise<void> {
  await d.transaction('rw', d.tables, async () => {
    await Promise.all(d.tables.map((t) => t.clear()))
  })
}

import { useLiveQuery } from 'dexie-react-hooks'
import { createContext, useContext, useEffect, useState } from 'react'
import { gameById } from '../content/games'
import { db } from '../db/db'
import { getActiveBaby, getGamesPerDay, recordsMap } from '../db/repo'
import { todayISO } from '../domain/age'
import { milestoneSignals } from '../domain/growth'
import type { Baby, GameLog, MilestoneRecord } from '../domain/types'

/** undefined while loading, null when no baby has been set up yet. */
export function useActiveBaby(): Baby | null | undefined {
  return useLiveQuery(async () => (await getActiveBaby()) ?? null)
}

export const BabyContext = createContext<Baby | null>(null)

export function useBaby(): Baby {
  const baby = useContext(BabyContext)
  if (!baby) throw new Error('useBaby must be used inside a route that requires a baby')
  return baby
}

/** Today's local date; rolls over at midnight and when the app comes back to the foreground. */
export function useToday(): string {
  const [today, setToday] = useState(todayISO)
  useEffect(() => {
    const check = () => setToday(todayISO())
    const t = setInterval(check, 60_000)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(t)
      document.removeEventListener('visibilitychange', check)
    }
  }, [])
  return today
}

export function useLogs(babyId: string): GameLog[] | undefined {
  return useLiveQuery(() => db.logs.where('babyId').equals(babyId).sortBy('completedAt'), [babyId])
}

export function useRecords(babyId: string): Map<string, MilestoneRecord> | undefined {
  return useLiveQuery(() => recordsMap(babyId), [babyId])
}

export function useGamesPerDay(): number | undefined {
  return useLiveQuery(() => getGamesPerDay())
}

export function useGrowth(babyId: string) {
  const logs = useLogs(babyId)
  const records = useRecords(babyId)
  if (!logs || !records) return undefined
  return { logs, records, signals: milestoneSignals(logs, gameById) }
}

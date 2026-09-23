import { z } from 'zod'
import { db, type SbabyDB } from './db'

const BACKUP_VERSION = 1
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

const backupSchema = z.object({
  app: z.literal('sbaby'),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  babies: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      dob: date,
      bornWeeksGestation: z.number().int().min(22).max(42).optional(),
      createdAt: z.string(),
    }),
  ),
  logs: z.array(
    z.object({
      id: z.string(),
      babyId: z.string(),
      gameId: z.string(),
      date,
      completedAt: z.string(),
      durationMin: z.number().min(0),
      reaction: z.enum(['loved', 'ok', 'fussy']),
      observations: z.array(z.object({ observationId: z.string(), result: z.enum(['yes', 'not_yet', 'skipped']) })),
      note: z.string().optional(),
    }),
  ),
  dailyPlans: z.array(
    z.object({ babyId: z.string(), date, gameIds: z.array(z.string()), swappedOut: z.array(z.string()) }),
  ),
  milestoneRecords: z.array(
    z.object({
      babyId: z.string(),
      milestoneId: z.string(),
      achievedOn: date.optional(),
      dismissedOn: date.optional(),
      note: z.string().optional(),
    }),
  ),
  settings: z.array(z.object({ key: z.string(), value: z.unknown() })),
})

export type Backup = z.infer<typeof backupSchema>

export async function exportBackup(d: SbabyDB = db): Promise<Backup> {
  const [babies, logs, dailyPlans, milestoneRecords, settings] = await Promise.all([
    d.babies.toArray(),
    d.logs.toArray(),
    d.dailyPlans.toArray(),
    d.milestoneRecords.toArray(),
    d.settings.toArray(),
  ])
  return {
    app: 'sbaby',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    babies,
    logs,
    dailyPlans,
    milestoneRecords,
    settings,
  }
}

/** Replaces everything on this device with the backup. Throws if the file is not a valid sbaby backup. */
export async function importBackup(raw: unknown, d: SbabyDB = db): Promise<void> {
  const data = backupSchema.parse(raw)
  await d.transaction('rw', d.tables, async () => {
    await Promise.all(d.tables.map((t) => t.clear()))
    await d.babies.bulkPut(data.babies)
    await d.logs.bulkPut(data.logs)
    await d.dailyPlans.bulkPut(data.dailyPlans)
    await d.milestoneRecords.bulkPut(data.milestoneRecords)
    await d.settings.bulkPut(data.settings)
  })
}

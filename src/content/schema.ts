import { z } from 'zod'
import { AREAS, CHECKPOINTS } from './types'

export const areaSchema = z.enum(AREAS)

export const milestoneSchema = z.object({
  id: z.string().regex(/^m\d+-[a-z0-9-]+$/),
  title: z.string().min(3),
  area: areaSchema,
  checkpointMonths: z.union(CHECKPOINTS.map((c) => z.literal(c))),
})

export const observationSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  text: z.string().min(3),
  milestoneId: z.string().optional(),
})

export const gameSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(3),
    ageMinDays: z.number().int().min(0),
    ageMaxDays: z.number().int().max(730),
    areas: z.array(areaSchema).min(1),
    durationMin: z.number().int().min(1).max(20),
    materials: z.array(z.string()),
    steps: z.array(z.string().min(3)).min(2),
    whyItHelps: z.string().min(10),
    safetyNotes: z.array(z.string()),
    watchFor: z.array(observationSchema).min(1).max(4),
  })
  .refine((g) => g.ageMinDays < g.ageMaxDays, 'ageMinDays must be below ageMaxDays')

export const AREAS = ['motor', 'cognitive', 'language', 'social'] as const
export type Area = (typeof AREAS)[number]

export const AREA_LABEL: Record<Area, string> = {
  motor: 'Motor',
  cognitive: 'Cognitive',
  language: 'Language',
  social: 'Social',
}

export const CHECKPOINTS = [2, 4, 6, 9, 12, 15, 18, 24] as const
export type Checkpoint = (typeof CHECKPOINTS)[number]

export interface Milestone {
  id: string
  title: string
  area: Area
  checkpointMonths: Checkpoint
}

export interface Observation {
  id: string
  text: string
  milestoneId?: string
}

export interface Game {
  id: string
  title: string
  ageMinDays: number
  ageMaxDays: number
  areas: Area[]
  durationMin: number
  materials: string[]
  steps: string[]
  whyItHelps: string
  safetyNotes: string[]
  watchFor: Observation[]
}

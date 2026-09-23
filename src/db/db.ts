import Dexie, { type EntityTable, type Table } from 'dexie'
import type { Baby, DailyPlan, GameLog, MilestoneRecord, SettingRow } from '../domain/types'

export class SbabyDB extends Dexie {
  babies!: EntityTable<Baby, 'id'>
  logs!: EntityTable<GameLog, 'id'>
  dailyPlans!: Table<DailyPlan, [string, string]>
  milestoneRecords!: Table<MilestoneRecord, [string, string]>
  settings!: EntityTable<SettingRow, 'key'>

  constructor(name = 'sbaby') {
    super(name)
    this.version(1).stores({
      babies: 'id',
      logs: 'id, babyId, [babyId+date], gameId',
      dailyPlans: '[babyId+date], babyId',
      milestoneRecords: '[babyId+milestoneId], babyId',
      settings: 'key',
    })
  }
}

export const db = new SbabyDB()

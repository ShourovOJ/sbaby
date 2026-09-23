import { describe, expect, it } from 'vitest'
import { ageInDays, ageSummary, correctionDays, developmentalAgeDays, formatAge } from '../src/domain/age'

describe('age', () => {
  it('counts calendar days, including across a leap day', () => {
    expect(ageInDays('2024-02-28', '2024-03-01')).toBe(2)
    expect(ageInDays('2023-02-28', '2023-03-01')).toBe(1)
    expect(ageInDays('2026-01-01', '2026-01-01')).toBe(0)
  })

  it('formats days, weeks and months', () => {
    expect(formatAge('2026-01-01', '2026-01-06')).toBe('5 d')
    expect(formatAge('2026-01-01', '2026-01-18')).toBe('2 wk 3 d')
    expect(formatAge('2026-01-10', '2026-05-30')).toBe('4 mo 20 d')
    expect(formatAge('2026-01-10', '2026-03-10')).toBe('2 mo')
  })

  it('corrects age for a baby born at 32 weeks', () => {
    const baby = { dob: '2026-01-01', bornWeeksGestation: 32 }
    expect(correctionDays(baby)).toBe(56)
    expect(developmentalAgeDays(baby, '2026-04-01')).toBe(90 - 56)
    expect(ageSummary(baby, '2026-04-01').correctedLabel).toBeDefined()
  })

  it('does not correct full-term babies or go below zero', () => {
    expect(correctionDays({ dob: '2026-01-01', bornWeeksGestation: 38 })).toBe(0)
    expect(correctionDays({ dob: '2026-01-01' })).toBe(0)
    expect(developmentalAgeDays({ dob: '2026-01-01', bornWeeksGestation: 30 }, '2026-01-20')).toBe(0)
  })

  it('stops correcting at 24 months', () => {
    expect(developmentalAgeDays({ dob: '2024-01-01', bornWeeksGestation: 30 }, '2026-01-10')).toBe(740)
  })
})

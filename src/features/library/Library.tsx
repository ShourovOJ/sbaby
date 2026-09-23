import { useState } from 'react'
import { GameCard } from '../../app/GameCard'
import { useBaby, useToday } from '../../app/hooks'
import { games } from '../../content/games'
import { AREA_LABEL, AREAS, type Area } from '../../content/types'
import { developmentalAgeDays, MAX_AGE_DAYS } from '../../domain/age'
import { eligibleGames } from '../../domain/planner'
import { areaClass } from '../../ui/area'
import { cx, EmptyState } from '../../ui/components'

const BANDS: { label: string; from: number; to: number }[] = [
  { label: '0–3 mo', from: 0, to: 91 },
  { label: '3–6 mo', from: 91, to: 183 },
  { label: '6–9 mo', from: 183, to: 274 },
  { label: '9–12 mo', from: 274, to: 365 },
  { label: '12–18 mo', from: 365, to: 548 },
  { label: '18–24 mo', from: 548, to: MAX_AGE_DAYS },
]

type AgeFilter = 'now' | 'all' | number

export function Library() {
  const baby = useBaby()
  const today = useToday()
  const [age, setAge] = useState<AgeFilter>('now')
  const [area, setArea] = useState<Area | null>(null)
  const ageDays = developmentalAgeDays(baby, today)

  let list =
    age === 'now'
      ? eligibleGames(games, ageDays)
      : age === 'all'
        ? games
        : games.filter((g) => g.ageMinDays < BANDS[age].to && g.ageMaxDays >= BANDS[age].from)
  if (area) list = list.filter((g) => g.areas.includes(area))

  const chip = (on: boolean) =>
    cx('shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-semibold', on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink')

  return (
    <main>
      <h1 className="text-2xl text-ink">Games</h1>
      <p className="mt-1 text-sm text-ink-soft">Play any of these, any time. They’re logged just like today’s checklist.</p>

      <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Filter by age">
        <button type="button" aria-pressed={age === 'now'} className={chip(age === 'now')} onClick={() => setAge('now')}>
          For {baby.name} now
        </button>
        {BANDS.map((b, i) => (
          <button key={b.label} type="button" aria-pressed={age === i} className={chip(age === i)} onClick={() => setAge(i)}>
            {b.label}
          </button>
        ))}
        <button type="button" aria-pressed={age === 'all'} className={chip(age === 'all')} onClick={() => setAge('all')}>
          All
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter by development area">
        {AREAS.map((a) => {
          const on = area === a
          const c = areaClass[a]
          return (
            <button
              key={a}
              type="button"
              aria-pressed={on}
              onClick={() => setArea(on ? null : a)}
              className={cx(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold ring-2',
                c.tint,
                c.ink,
                on ? c.ring : 'ring-transparent',
              )}
            >
              <span className={cx('size-2.5 rounded-full', c.solid)} />
              {AREA_LABEL[a]}
            </button>
          )
        })}
      </div>

      <p className="mb-3 mt-5 text-sm font-semibold text-ink-soft">
        {list.length} game{list.length === 1 ? '' : 's'}
      </p>
      {list.length ? (
        <ul className="space-y-3">
          {list.map((g) => (
            <GameCard key={g.id} game={g} showCheck={false} />
          ))}
        </ul>
      ) : (
        <EmptyState title="No games match">Try another age or area.</EmptyState>
      )}
    </main>
  )
}

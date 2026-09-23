import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { useBaby, useGrowth, useToday } from '../../app/hooks'
import { gameById } from '../../content/games'
import { milestones } from '../../content/milestones'
import { AREA_LABEL, AREAS } from '../../content/types'
import { developmentalAgeDays } from '../../domain/age'
import { relevantCheckpoints } from '../../domain/planner'
import { areaCoverage, checkpointProgress, logsInLastDays, playStreak, totals } from '../../domain/stats'
import type { GameLog } from '../../domain/types'
import { areaClass } from '../../ui/area'
import { Card, cx, EmptyState, ProgressBar, SectionTitle } from '../../ui/components'

const REACTION_LABEL = { loved: 'Loved it', ok: 'OK', fussy: 'Fussy' } as const

export function Progress() {
  const baby = useBaby()
  const today = useToday()
  const growth = useGrowth(baby.id)
  const [range, setRange] = useState<7 | 30>(7)
  if (!growth) return null

  const { logs, records } = growth
  const week = totals(logsInLastDays(logs, today, 7))
  const month = totals(logsInLastDays(logs, today, 30))
  const coverage = areaCoverage(logsInLastDays(logs, today, range), gameById)
  const maxCoverage = Math.max(1, ...Object.values(coverage))
  const upTo = relevantCheckpoints(developmentalAgeDays(baby, today)).slice(-1)[0]
  const checkpoints = checkpointProgress(milestones, records).filter((c) => c.checkpoint <= upTo)
  const recent = logsInLastDays(logs, today, 14).slice().reverse()
  const byDay = new Map<string, GameLog[]>()
  for (const l of recent) byDay.set(l.date, [...(byDay.get(l.date) ?? []), l])

  return (
    <main>
      <h1 className="text-2xl text-ink">Progress</h1>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat label="Day streak" value={playStreak(logs, today)} />
        <Stat label="Games this week" value={week.games} />
        <Stat label="Minutes this week" value={week.minutes} />
        <Stat label="Minutes in 30 days" value={month.minutes} />
      </div>

      <SectionTitle
        action={
          <div className="flex rounded-full border border-line bg-surface p-0.5 text-xs font-semibold" role="group" aria-label="Time window">
            {([7, 30] as const).map((w) => (
              <button
                key={w}
                type="button"
                aria-pressed={range === w}
                onClick={() => setRange(w)}
                className={cx('rounded-full px-3 py-1', range === w ? 'bg-ink text-white' : 'text-ink-soft')}
              >
                {w} days
              </button>
            ))}
          </div>
        }
      >
        Play by area
      </SectionTitle>
      <Card>
        <ul className="space-y-3">
          {AREAS.map((a) => (
            <li key={a}>
              <div className="mb-1 flex justify-between text-sm">
                <span className={cx('font-semibold', areaClass[a].ink)}>{AREA_LABEL[a]}</span>
                <span className="text-ink-soft">
                  {coverage[a]} game{coverage[a] === 1 ? '' : 's'}
                </span>
              </div>
              <ProgressBar value={coverage[a]} max={maxCoverage} colorClass={areaClass[a].solid} label={`${AREA_LABEL[a]} games`} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-soft">This shows what you played together, not how {baby.name} is developing. Milestones are on Growth.</p>
      </Card>

      <SectionTitle>Milestones achieved</SectionTitle>
      <Card>
        <ul className="space-y-3">
          {checkpoints.map((c) => (
            <li key={c.checkpoint}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="font-semibold text-ink">By {c.checkpoint} months</span>
                <span className="text-ink-soft">
                  {c.achieved} of {c.total}
                </span>
              </div>
              <ProgressBar value={c.achieved} max={c.total} colorClass="bg-social" label={`${c.checkpoint}-month milestones achieved`} />
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>Last 14 days</SectionTitle>
      {byDay.size === 0 ? (
        <EmptyState title="Nothing logged yet">Play a game from Today and it will show up here.</EmptyState>
      ) : (
        <ol className="space-y-4">
          {[...byDay].map(([date, dayLogs]) => (
            <li key={date}>
              <p className="mb-2 text-sm font-semibold text-ink-soft">
                {date === today ? 'Today' : format(parseISO(date), 'EEEE d MMM')}
              </p>
              <ul className="space-y-2">
                {dayLogs.map((l) => {
                  const g = gameById.get(l.gameId)
                  const did = l.observations.filter((o) => o.result === 'yes').length
                  return (
                    <li key={l.id} className={cx('rounded-2xl px-4 py-3 text-sm', g ? areaClass[g.areas[0]].tint : 'bg-surface')}>
                      <div className="flex justify-between gap-3">
                        <span className={cx('font-semibold', g ? areaClass[g.areas[0]].ink : 'text-ink')}>{g?.title ?? l.gameId}</span>
                        <span className="shrink-0 text-ink-soft">{l.durationMin} min</span>
                      </div>
                      <p className="mt-0.5 text-ink-soft">
                        {REACTION_LABEL[l.reaction]} · {did} of {l.observations.length} watched-for things seen
                      </p>
                      {l.note && <p className="mt-1 text-ink">“{l.note}”</p>}
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-card border border-line bg-surface p-4">
      <p className="font-display text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-sm text-ink-soft">{label}</p>
    </div>
  )
}

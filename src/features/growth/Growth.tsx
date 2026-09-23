import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { Link } from 'react-router'
import { useBaby, useGrowth, useToday } from '../../app/hooks'
import { SuggestionCard } from '../../app/SuggestionCard'
import { gameById, games } from '../../content/games'
import { MILESTONE_SOURCE, milestoneById, milestones } from '../../content/milestones'
import { CHECKPOINTS, type Checkpoint } from '../../content/types'
import { markAchieved, unmarkAchieved } from '../../db/repo'
import { daysToMonths, developmentalAgeDays } from '../../domain/age'
import { achievedSuggestions, milestoneStatus, type MilestoneStatus } from '../../domain/growth'
import { relevantCheckpoints } from '../../domain/planner'
import { areaClass } from '../../ui/area'
import { AreaChip, AreaSwatch, Button, cx, SectionTitle, Sheet } from '../../ui/components'
import { Icon } from '../../ui/Icon'

const STATUS_LABEL: Record<MilestoneStatus, string> = {
  not_seen: 'Not seen yet',
  emerging: 'Emerging',
  achieved: 'Achieved',
}

export function Growth() {
  const baby = useBaby()
  const today = useToday()
  const growth = useGrowth(baby.id)
  const ageDays = developmentalAgeDays(baby, today)
  const [upcoming] = relevantCheckpoints(ageDays).slice(-1)
  const [selected, setSelected] = useState<Checkpoint>(upcoming as Checkpoint)
  const [openId, setOpenId] = useState<string | null>(null)

  if (!growth) return null
  const { records, signals } = growth
  const statusOf = (id: string) => milestoneStatus(id, signals, records)
  const suggestions = achievedSuggestions(signals, records)
  const list = milestones.filter((m) => m.checkpointMonths === selected)
  const ageMonths = daysToMonths(ageDays)
  const isPast = selected < ageMonths - 0.5
  const missing = list.filter((m) => statusOf(m.id) !== 'achieved').length

  return (
    <main>
      <h1 className="text-2xl text-ink">Growth</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Milestones most babies reach by each age. Every baby has their own pace.
      </p>

      {suggestions.length > 0 && (
        <>
          <SectionTitle>New milestone?</SectionTitle>
          <div className="space-y-3">
            {suggestions.map((id) => (
              <SuggestionCard key={id} babyId={baby.id} milestoneId={id} today={today} />
            ))}
          </div>
        </>
      )}

      <div className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Age checkpoints">
        {CHECKPOINTS.map((c) => {
          const all = milestones.filter((m) => m.checkpointMonths === c)
          const got = all.filter((m) => statusOf(m.id) === 'achieved').length
          const on = c === selected
          return (
            <button
              key={c}
              type="button"
              role="tab"
              aria-selected={on}
              aria-label={`${c} months, ${got} of ${all.length} achieved`}
              onClick={() => setSelected(c)}
              className={cx(
                'flex shrink-0 flex-col items-center rounded-2xl border px-3.5 py-2',
                on ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink',
              )}
            >
              <span className="font-display text-sm font-semibold">{c} mo</span>
              <span className={cx('text-xs', on ? 'text-white/80' : 'text-ink-soft')}>
                {got}/{all.length}
              </span>
            </button>
          )
        })}
      </div>

      {isPast && missing > 0 && (
        <div className="mt-4 rounded-2xl bg-cognitive-tint p-4 text-sm text-cognitive-ink">
          <p>
            {missing} of these {selected}-month milestones {missing === 1 ? 'isn’t' : 'aren’t'} marked yet. Tap one to
            mark it if {baby.name} already does it. If you haven’t seen {missing === 1 ? 'it' : 'them'}, it’s worth
            mentioning at your next pediatric visit. It’s often nothing, and you know {baby.name} best.
          </p>
          <Button
            variant="secondary"
            className="mt-3"
            onClick={() =>
              Promise.all(list.filter((m) => statusOf(m.id) !== 'achieved').map((m) => markAchieved(baby.id, m.id, today)))
            }
          >
            {baby.name} does all of these
          </Button>
        </div>
      )}

      <ul className="mt-4 space-y-2" aria-label={`${selected}-month milestones`}>
        {list.map((m) => {
          const s = statusOf(m.id)
          const c = areaClass[m.area]
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => setOpenId(m.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface p-3 text-left"
              >
                <span className={cx('size-3 shrink-0 rounded-full', c.solid)} aria-hidden="true" />
                <span className="min-w-0 flex-1 text-sm text-ink">{m.title}</span>
                <StatusPill status={s} />
              </button>
            </li>
          )
        })}
      </ul>

      <p className="mt-8 text-xs text-ink-soft">
        Source: {MILESTONE_SOURCE}. These show what most children (75% or more) do by each age. sbaby is not a
        diagnostic tool. If you’re worried, talk to your doctor.
      </p>

      <MilestoneSheet
        id={openId}
        onClose={() => setOpenId(null)}
        babyId={baby.id}
        today={today}
        status={openId ? statusOf(openId) : 'not_seen'}
        achievedOn={openId ? records.get(openId)?.achievedOn : undefined}
        seenDates={openId ? (signals.get(openId)?.yesDates ?? []) : []}
        seenIn={openId ? (signals.get(openId)?.gameIds ?? []) : []}
      />
    </main>
  )
}

function StatusPill({ status }: { status: MilestoneStatus }) {
  return (
    <span
      className={cx(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        status === 'achieved' && 'bg-social-ink text-white',
        status === 'emerging' && 'bg-language-tint text-language-ink',
        status === 'not_seen' && 'bg-cream text-ink-soft',
      )}
    >
      {status === 'achieved' && <Icon name="check" className="size-3.5" />}
      {status === 'emerging' && <Icon name="sparkle" className="size-3.5" />}
      {STATUS_LABEL[status]}
    </span>
  )
}

function MilestoneSheet({
  id,
  onClose,
  babyId,
  today,
  status,
  achievedOn,
  seenDates,
  seenIn,
}: {
  id: string | null
  onClose: () => void
  babyId: string
  today: string
  status: MilestoneStatus
  achievedOn?: string
  seenDates: string[]
  seenIn: string[]
}) {
  const [date, setDate] = useState(today)
  const m = id ? milestoneById.get(id) : undefined
  if (!m) return null
  const tryGames = games.filter((g) => g.watchFor.some((o) => o.milestoneId === m.id))
  return (
    <Sheet open onClose={onClose} title={m.title}>
      <div className="flex flex-wrap items-center gap-2">
        <AreaChip area={m.area} size="md" />
        <StatusPill status={status} />
      </div>
      <p className="mt-3 text-sm text-ink-soft">Most babies do this by {m.checkpointMonths} months.</p>

      {seenDates.length > 0 && (
        <p className="mt-3 text-sm text-ink">
          You ticked “Did it” on {seenDates.length} day{seenDates.length === 1 ? '' : 's'}, most recently{' '}
          {format(parseISO(seenDates[seenDates.length - 1]), 'd MMM')}, in{' '}
          {seenIn.map((g) => gameById.get(g)?.title).filter(Boolean).join(', ')}.
        </p>
      )}

      {status === 'achieved' ? (
        <div className="mt-4 rounded-2xl bg-social-tint p-4">
          <p className="text-sm font-semibold text-social-ink">Achieved on {format(parseISO(achievedOn!), 'd MMM yyyy')}</p>
          <Button variant="ghost" className="mt-2 -ml-3" onClick={() => unmarkAchieved(babyId, m.id)}>
            Undo
          </Button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
          <label className="block text-sm font-semibold text-ink">
            Achieved on
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 block w-full rounded-xl border border-line px-3 py-2 text-base font-normal"
            />
          </label>
          <Button className="mt-3 w-full" onClick={() => date && markAchieved(babyId, m.id, date)}>
            Mark achieved
          </Button>
        </div>
      )}

      {tryGames.length > 0 && (
        <>
          <p className="mb-2 mt-5 text-sm font-semibold text-ink">Games where you can watch for this</p>
          <ul className="space-y-2">
            {tryGames.map((g) => (
              <li key={g.id}>
                <Link
                  to={`/play/${g.id}`}
                  className={cx('flex items-center gap-3 rounded-2xl p-3', areaClass[g.areas[0]].tint)}
                >
                  <AreaSwatch area={g.areas[0]} className="size-8" />
                  <span className={cx('font-semibold', areaClass[g.areas[0]].ink)}>{g.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Sheet>
  )
}

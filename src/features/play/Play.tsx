import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useBaby, useGrowth, useToday } from '../../app/hooks'
import { SuggestionCard } from '../../app/SuggestionCard'
import { gameById } from '../../content/games'
import { milestoneById } from '../../content/milestones'
import { addLog } from '../../db/repo'
import { outcomeOfLog, type LogOutcome } from '../../domain/growth'
import type { ObservationResult, Reaction } from '../../domain/types'
import { areaClass } from '../../ui/area'
import { AreaChip, Button, buttonClass, Card, cx, EmptyState, SectionTitle, Stepper, TriStateCheck } from '../../ui/components'
import { Icon } from '../../ui/Icon'

const REACTIONS: { value: Reaction; label: string }[] = [
  { value: 'loved', label: 'Loved it' },
  { value: 'ok', label: 'It was OK' },
  { value: 'fussy', label: 'Fussy' },
]

export function Play() {
  const { gameId = '' } = useParams()
  const game = gameById.get(gameId)
  const baby = useBaby()
  const today = useToday()
  const growth = useGrowth(baby.id)
  const [results, setResults] = useState<Record<string, ObservationResult>>({})
  const [reaction, setReaction] = useState<Reaction>()
  const [minutes, setMinutes] = useState(game?.durationMin ?? 5)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [outcome, setOutcome] = useState<LogOutcome | null>(null)

  if (!game) {
    return (
      <main>
        <BackLink />
        <EmptyState title="Game not found">It may have been removed from the library.</EmptyState>
      </main>
    )
  }

  const playedToday = growth?.logs.some((l) => l.gameId === game.id && l.date === today)
  const main = areaClass[game.areas[0]]

  async function save() {
    if (!game || !reaction || !growth) return
    setSaving(true)
    try {
      const log = await addLog({
        babyId: baby.id,
        gameId: game.id,
        date: today,
        durationMin: minutes,
        reaction,
        observations: game.watchFor.map((o) => ({ observationId: o.id, result: results[o.id] ?? 'skipped' })),
        note: note.trim() || undefined,
      })
      setOutcome(outcomeOfLog(log, [...growth.logs, log], gameById, growth.records))
      window.scrollTo({ top: 0 })
    } finally {
      setSaving(false)
    }
  }

  if (outcome) {
    return (
      <main>
        <div className={cx('rounded-card p-6 text-center', main.tint)}>
          <span className={cx('mx-auto flex size-14 items-center justify-center rounded-full text-white', main.solid)}>
            <Icon name="check" className="size-8" />
          </span>
          <h1 className={cx('mt-3 text-2xl', main.ink)}>{game.title}: done!</h1>
          <p className="mt-1 text-ink-soft">
            {minutes} minutes with {baby.name}. Saved.
          </p>
        </div>
        {outcome.newlyEmerging.length > 0 && (
          <>
            <SectionTitle>Starting to show</SectionTitle>
            <ul className="space-y-2">
              {outcome.newlyEmerging.map((id) => {
                const m = milestoneById.get(id)!
                return (
                  <li key={id} className={cx('flex items-center gap-2 rounded-2xl px-4 py-3 text-sm', areaClass[m.area].tint)}>
                    <Icon name="sparkle" className={cx('size-4 shrink-0', areaClass[m.area].ink)} />
                    <span className="text-ink">{m.title}</span>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 text-xs text-ink-soft">These are now marked as emerging on Growth.</p>
          </>
        )}
        {outcome.suggestions.length > 0 && growth && (
          <>
            <SectionTitle>New milestone?</SectionTitle>
            <div className="space-y-3">
              {outcome.suggestions.map((id) => {
                const rec = growth.records.get(id)
                if (rec?.achievedOn) {
                  return (
                    <p key={id} role="status" className="flex items-center gap-2 rounded-2xl bg-social-tint px-4 py-3 text-sm font-semibold text-social-ink">
                      <Icon name="check" className="size-4 shrink-0" />
                      Marked as achieved: {milestoneById.get(id)?.title}
                    </p>
                  )
                }
                if (rec?.dismissedOn === today) {
                  return (
                    <p key={id} className="rounded-2xl bg-surface px-4 py-3 text-sm text-ink-soft ring-1 ring-line">
                      OK, we’ll keep watching for “{milestoneById.get(id)?.title}”.
                    </p>
                  )
                }
                return <SuggestionCard key={id} babyId={baby.id} milestoneId={id} today={today} />
              })}
            </div>
          </>
        )}
        <Link to="/" className={buttonClass('primary', 'mt-8 w-full')}>
          Back to today
        </Link>
      </main>
    )
  }

  return (
    <main>
      <BackLink />
      <header className={cx('rounded-card p-5', main.tint)}>
        <h1 className={cx('text-2xl leading-tight', main.ink)}>{game.title}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-ink-soft">
            <Icon name="clock" className="size-4" />
            {game.durationMin} min
          </span>
          {game.areas.map((a) => (
            <AreaChip key={a} area={a} />
          ))}
        </div>
        {playedToday && <p className="mt-2 text-sm font-semibold text-social-ink">Already played today. Playing again is great too.</p>}
      </header>

      {game.materials.length > 0 && (
        <>
          <SectionTitle>You’ll need</SectionTitle>
          <ul className="list-disc space-y-1 pl-5 text-ink">
            {game.materials.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </>
      )}

      <SectionTitle>How to play</SectionTitle>
      <ol className="space-y-3">
        {game.steps.map((s, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface font-display text-sm font-semibold text-ink ring-1 ring-line">
              {i + 1}
            </span>
            <span className="pt-0.5 text-ink">{s}</span>
          </li>
        ))}
      </ol>

      <p className="mt-5 rounded-2xl bg-surface p-4 text-sm text-ink-soft ring-1 ring-line">
        <span className="font-semibold text-ink">Why it helps: </span>
        {game.whyItHelps}
      </p>

      {game.safetyNotes.length > 0 && (
        <div className="mt-3 rounded-2xl bg-motor-tint p-4 text-sm text-motor-ink" role="note">
          <p className="font-semibold">Safety</p>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            {game.safetyNotes.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}

      <SectionTitle>Watch for</SectionTitle>
      <p className="-mt-1 mb-3 text-sm text-ink-soft">Tick what {baby.name} did. “Not yet” is completely normal.</p>
      <ul className="space-y-3">
        {game.watchFor.map((o) => {
          const m = o.milestoneId ? milestoneById.get(o.milestoneId) : undefined
          return (
            <li key={o.id}>
              <Card>
                <p className="font-semibold text-ink">{o.text}</p>
                {m && <p className="mb-3 mt-0.5 text-xs text-ink-soft">Milestone · most babies by {m.checkpointMonths} months</p>}
                {!m && <div className="mb-3" />}
                <TriStateCheck label={o.text} value={results[o.id]} onChange={(v) => setResults((r) => ({ ...r, [o.id]: v }))} />
              </Card>
            </li>
          )
        })}
      </ul>

      <SectionTitle>How did it go?</SectionTitle>
      <div role="group" aria-label="Baby’s reaction" className="grid grid-cols-3 gap-2">
        {REACTIONS.map((r) => (
          <button
            key={r.value}
            type="button"
            aria-pressed={reaction === r.value}
            onClick={() => setReaction(r.value)}
            className={cx(
              'min-h-12 rounded-2xl border text-sm font-semibold',
              reaction === r.value ? 'border-primary bg-primary text-white' : 'border-line bg-surface text-ink',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">Time played</span>
        <Stepper label="minutes played" value={minutes} min={1} max={60} unit="min" onChange={setMinutes} />
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-ink">Note (optional)</span>
        <textarea
          className="mt-1.5 block w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Anything special? A first giggle?"
        />
      </label>

      <Button className="mt-6 w-full" disabled={!reaction || saving || !growth} onClick={save}>
        {reaction ? 'Done: save' : 'Choose how it went to save'}
      </Button>
    </main>
  )
}

function BackLink() {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/'))}
      className="-ml-1 mb-3 inline-flex items-center gap-1 py-1 text-sm font-semibold text-ink-soft"
    >
      <Icon name="back" className="size-4" />
      Back
    </button>
  )
}

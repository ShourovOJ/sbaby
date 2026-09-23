import { useState, type FormEvent } from 'react'
import { ageInDays, MAX_AGE_DAYS, todayISO } from '../../domain/age'
import type { Baby } from '../../domain/types'
import { Button } from '../../ui/components'

export interface BabyFormValues {
  name: string
  dob: string
  bornWeeksGestation?: number
}

const WEEKS = Array.from({ length: 36 - 23 + 1 }, (_, i) => 23 + i)

export function BabyForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Baby
  submitLabel: string
  onSubmit: (v: BabyFormValues) => Promise<void> | void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [dob, setDob] = useState(initial?.dob ?? '')
  const [early, setEarly] = useState(!!initial?.bornWeeksGestation && initial.bornWeeksGestation < 37)
  const [weeks, setWeeks] = useState(initial?.bornWeeksGestation ?? 34)
  const [busy, setBusy] = useState(false)
  const today = todayISO()
  const age = dob ? ageInDays(dob, today) : 0
  const error = !dob ? null : age < 0 ? 'That date is in the future.' : null
  const warning = dob && age > MAX_AGE_DAYS ? 'sbaby is made for 0–24 months. You can still use it, with games for about 2 years old.' : null

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !dob || error) return
    setBusy(true)
    try {
      await onSubmit({ name: name.trim(), dob, bornWeeksGestation: early ? weeks : undefined })
    } finally {
      setBusy(false)
    }
  }

  const input = 'mt-1.5 block w-full rounded-2xl border border-line bg-surface px-4 py-3 text-base text-ink'
  return (
    <form onSubmit={submit} className="space-y-5">
      <label className="block">
        <span className="text-sm font-semibold text-ink">Baby’s name</span>
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} required autoComplete="off" placeholder="e.g. Ayaan" />
      </label>
      <label className="block">
        <span className="text-sm font-semibold text-ink">Date of birth</span>
        <input className={input} type="date" value={dob} max={today} onChange={(e) => setDob(e.target.value)} required />
        {error && <span className="mt-1 block text-sm font-semibold text-motor-ink">{error}</span>}
        {warning && <span className="mt-1 block text-sm text-ink-soft">{warning}</span>}
      </label>
      <div>
        <label className="flex items-center gap-3">
          <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={early} onChange={(e) => setEarly(e.target.checked)} />
          <span className="text-sm font-semibold text-ink">Born early (before 37 weeks)</span>
        </label>
        {early && (
          <label className="mt-3 block">
            <span className="text-sm text-ink-soft">Born at</span>
            <select className={input} value={weeks} onChange={(e) => setWeeks(Number(e.target.value))}>
              {WEEKS.map((w) => (
                <option key={w} value={w}>
                  {w} weeks
                </option>
              ))}
            </select>
            <span className="mt-1.5 block text-xs text-ink-soft">
              sbaby will use corrected age (age from the due date) to choose games and milestones, as doctors do up to 2 years.
            </span>
          </label>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={busy || !name.trim() || !dob || !!error}>
        {submitLabel}
      </Button>
    </form>
  )
}

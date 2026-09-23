import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { AREA_LABEL, type Area } from '../content/types'
import type { ObservationResult } from '../domain/types'
import { areaClass } from './area'
import { Icon } from './Icon'

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
const buttonVariant: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white active:bg-primary-pressed disabled:opacity-40',
  secondary: 'bg-surface text-ink border border-line active:bg-cream disabled:opacity-40',
  ghost: 'text-ink-soft active:bg-line/50 disabled:opacity-40',
}

/** Button look, also used for links that should look like buttons. */
export function buttonClass(variant: ButtonVariant = 'primary', className?: string): string {
  return cx(
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 font-display text-sm font-semibold transition-colors',
    buttonVariant[variant],
    className,
  )
}

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button type="button" className={buttonClass(variant, className)} {...props} />
}

/** Swatch + label, straight from the design system's area card. */
export function AreaChip({ area, size = 'sm' }: { area: Area; size?: 'sm' | 'md' }) {
  const c = areaClass[area]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold',
        c.tint,
        c.ink,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      )}
    >
      <span className={cx('inline-block size-2 rounded-full', c.solid)} />
      {AREA_LABEL[area]}
    </span>
  )
}

export function AreaSwatch({ area, className = 'size-10' }: { area: Area; className?: string }) {
  const c = areaClass[area]
  return (
    <span className={cx('inline-flex shrink-0 items-center justify-center rounded-swatch text-white', c.solid, className)}>
      <Icon name={area} className="size-5" />
    </span>
  )
}

export function Card({ area, className, children }: { area?: Area; className?: string; children: ReactNode }) {
  return (
    <div className={cx('rounded-card p-4', area ? areaClass[area].tint : 'bg-surface border border-line', className)}>
      {children}
    </div>
  )
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 mt-7 flex items-baseline justify-between gap-3">
      <h2 className="text-lg text-ink">{children}</h2>
      {action}
    </div>
  )
}

export function ProgressBar({ value, max, colorClass = 'bg-primary', label }: { value: number; max: number; colorClass?: string; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div
      className="h-2.5 w-full overflow-hidden rounded-full bg-line"
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className={cx('h-full rounded-full transition-[width]', colorClass)} style={{ width: `${pct}%` }} />
    </div>
  )
}

const TRI: { value: ObservationResult; label: string }[] = [
  { value: 'yes', label: 'Did it' },
  { value: 'not_yet', label: 'Not yet' },
  { value: 'skipped', label: 'Skip' },
]

/** "Did it / Not yet / Skip" for one watch-for item. */
export function TriStateCheck({
  value,
  onChange,
  label,
}: {
  value: ObservationResult | undefined
  onChange: (v: ObservationResult) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="grid grid-cols-3 gap-1.5">
      {TRI.map((t) => {
        const on = value === t.value
        return (
          <button
            key={t.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(t.value)}
            className={cx(
              'inline-flex min-h-10 items-center justify-center gap-1 rounded-full border text-sm font-semibold transition-colors',
              on && t.value === 'yes' && 'border-social-ink bg-social-ink text-white',
              on && t.value === 'not_yet' && 'border-ink-soft bg-ink-soft text-white',
              on && t.value === 'skipped' && 'border-line bg-line text-ink',
              !on && 'border-line bg-surface text-ink-soft',
            )}
          >
            {on && t.value === 'yes' && <Icon name="check" className="size-4" />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-t-card bg-cream px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
        <h2 id={titleId} className="mb-3 text-lg">
          {title}
        </h2>
        {children}
      </div>
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line px-5 py-8 text-center">
      <p className="font-display font-semibold text-ink">{title}</p>
      {children && <div className="mt-1 text-sm text-ink-soft">{children}</div>}
    </div>
  )
}

export function Stepper({
  value,
  min,
  max,
  onChange,
  label,
  unit,
}: {
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  label: string
  unit?: string
}) {
  return (
    <div className="inline-flex items-center gap-3" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className="size-10 rounded-full border border-line bg-surface text-lg font-bold text-ink disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
      >
        −
      </button>
      <span className="min-w-14 text-center font-display text-lg font-semibold" aria-live="polite">
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-ink-soft">{unit}</span>}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className="size-10 rounded-full border border-line bg-surface text-lg font-bold text-ink disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}

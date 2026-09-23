import { Link } from 'react-router'
import type { Game } from '../content/types'
import { areaClass } from '../ui/area'
import { AreaChip, cx } from '../ui/components'
import { Icon } from '../ui/Icon'

/** A game as a card tinted by its main development area, as in the design system. */
export function GameCard({
  game,
  played,
  onSwap,
  showCheck = true,
}: {
  game: Game
  played?: boolean
  onSwap?: () => void
  showCheck?: boolean
}) {
  const main = areaClass[game.areas[0]]
  return (
    <li className={cx('relative flex items-center gap-3 rounded-card p-4', main.tint)}>
      {showCheck && (
        <span
          className={cx(
            'flex size-9 shrink-0 items-center justify-center rounded-full border-2',
            played ? cx(main.solid, 'border-transparent text-white') : 'border-line bg-surface',
          )}
          aria-hidden="true"
        >
          {played && <Icon name="check" className="size-5" />}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <Link
          to={`/play/${game.id}`}
          className={cx('font-display text-base font-semibold leading-snug after:absolute after:inset-0', main.ink)}
        >
          {game.title}
          {played && <span className="sr-only"> (played today)</span>}
        </Link>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft">
            <Icon name="clock" className="size-3.5" />
            {game.durationMin} min
          </span>
          {game.areas.map((a) => (
            <AreaChip key={a} area={a} />
          ))}
        </div>
      </div>
      {onSwap && !played && (
        <button
          type="button"
          onClick={onSwap}
          aria-label={`Swap ${game.title} for another game`}
          className="relative z-10 -mr-1 rounded-full p-2 text-ink-soft active:bg-surface"
        >
          <Icon name="swap" />
        </button>
      )}
    </li>
  )
}

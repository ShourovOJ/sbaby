import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { GameCard } from '../../app/GameCard'
import { useBaby, useGamesPerDay, useGrowth, useToday } from '../../app/hooks'
import { SuggestionCard } from '../../app/SuggestionCard'
import { gameById } from '../../content/games'
import { db } from '../../db/db'
import { ensureDailyPlan, swapInPlan } from '../../db/repo'
import { ageSummary } from '../../domain/age'
import { achievedSuggestions } from '../../domain/growth'
import { playStreak } from '../../domain/stats'
import { Card, ProgressBar, SectionTitle } from '../../ui/components'

export function Today() {
  const baby = useBaby()
  const today = useToday()
  const perDay = useGamesPerDay()
  const plan = useLiveQuery(() => db.dailyPlans.get([baby.id, today]), [baby.id, today])
  const growth = useGrowth(baby.id)

  useEffect(() => {
    if (perDay !== undefined) void ensureDailyPlan(baby, today)
  }, [baby, today, perDay])

  const age = ageSummary(baby, today)
  const todayLogs = growth?.logs.filter((l) => l.date === today) ?? []
  const playedIds = new Set(todayLogs.map((l) => l.gameId))
  const planGames = (plan?.gameIds ?? []).map((id) => gameById.get(id)).filter((g) => !!g)
  const done = planGames.filter((g) => playedIds.has(g.id)).length
  const streak = growth ? playStreak(growth.logs, today) : 0
  const suggestions = growth ? achievedSuggestions(growth.signals, growth.records) : []
  const extraPlayed = [...playedIds].filter((id) => !plan?.gameIds.includes(id)).map((id) => gameById.get(id)).filter((g) => !!g)

  return (
    <main>
      <Card className="bg-surface">
        <p className="text-sm font-semibold text-ink-soft">{baby.name}</p>
        <h1 className="mt-0.5 text-4xl leading-none text-ink">Day {age.day}</h1>
        <p className="mt-2 text-ink-soft">
          {age.label} old
          {age.correctedLabel && <span> · corrected age {age.correctedLabel}</span>}
        </p>
        <div className="mt-4 flex items-center justify-between text-sm font-semibold">
          <span className="text-ink">
            {done} of {planGames.length} games played today
          </span>
          {streak > 1 && <span className="text-social-ink">{streak}-day streak</span>}
        </div>
        <div className="mt-2">
          <ProgressBar value={done} max={planGames.length || 1} label="Games played today" colorClass="bg-social" />
        </div>
      </Card>

      {age.beyondRange && (
        <p className="mt-4 rounded-card bg-language-tint p-4 text-sm text-language-ink">
          {baby.name} is past 24 months. sbaby’s games stop at 2 years, so today’s list is from the 18–24 month games.
        </p>
      )}

      {suggestions.length > 0 && (
        <>
          <SectionTitle>New milestone?</SectionTitle>
          <div className="space-y-3">
            {suggestions.slice(0, 2).map((id) => (
              <SuggestionCard key={id} babyId={baby.id} milestoneId={id} today={today} />
            ))}
            {suggestions.length > 2 && (
              <Link to="/growth" className="block text-sm font-semibold text-primary">
                See {suggestions.length - 2} more on Growth
              </Link>
            )}
          </div>
        </>
      )}

      <SectionTitle>Today’s games</SectionTitle>
      <ul className="space-y-3" aria-label="Today’s games">
        {planGames.map((g) => (
          <GameCard
            key={g.id}
            game={g}
            played={playedIds.has(g.id)}
            onSwap={() => void swapInPlan(baby, today, g.id)}
          />
        ))}
      </ul>
      {planGames.length > 0 && done === planGames.length && (
        <p className="mt-4 text-center text-sm font-semibold text-social-ink">All done for today. Lovely work.</p>
      )}

      {extraPlayed.length > 0 && (
        <>
          <SectionTitle>Also played today</SectionTitle>
          <ul className="space-y-3">
            {extraPlayed.map((g) => (
              <GameCard key={g.id} game={g} played />
            ))}
          </ul>
        </>
      )}

      <p className="mt-6 text-center text-sm text-ink-soft">
        Want something different?{' '}
        <Link to="/library" className="font-semibold text-primary">
          Browse all games
        </Link>
      </p>
    </main>
  )
}

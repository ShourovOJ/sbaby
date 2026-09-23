import { milestoneById } from '../content/milestones'
import { dismissSuggestion, markAchieved } from '../db/repo'
import { AreaSwatch, Button, Card } from '../ui/components'

/** "Looks like X — mark as achieved?" The parent decides; the app only suggests. */
export function SuggestionCard({ babyId, milestoneId, today }: { babyId: string; milestoneId: string; today: string }) {
  const m = milestoneById.get(milestoneId)
  if (!m) return null
  return (
    <Card area={m.area}>
      <div className="flex gap-3">
        <AreaSwatch area={m.area} />
        <div className="min-w-0">
          <p className="text-sm text-ink-soft">You’ve seen this on more than one day:</p>
          <p className="font-display font-semibold text-ink">{m.title}</p>
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <Button className="flex-1" onClick={() => markAchieved(babyId, milestoneId, today)}>
          Mark achieved
        </Button>
        <Button variant="secondary" className="flex-1" onClick={() => dismissSuggestion(babyId, milestoneId, today)}>
          Not yet
        </Button>
      </div>
    </Card>
  )
}

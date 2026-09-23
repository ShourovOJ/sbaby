import { Link, NavLink, Navigate, Outlet } from 'react-router'
import { cx } from '../ui/components'
import { Icon, type IconName } from '../ui/Icon'
import { BabyContext, useActiveBaby } from './hooks'

const TABS: { to: string; label: string; icon: IconName }[] = [
  { to: '/', label: 'Today', icon: 'today' },
  { to: '/library', label: 'Games', icon: 'library' },
  { to: '/growth', label: 'Growth', icon: 'growth' },
  { to: '/progress', label: 'Progress', icon: 'progress' },
]

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-display text-xl font-semibold tracking-tight text-ink">
      <span className="grid grid-cols-2 gap-0.5" aria-hidden="true">
        <span className="size-2 rounded-[3px] bg-motor" />
        <span className="size-2 rounded-[3px] bg-cognitive" />
        <span className="size-2 rounded-[3px] bg-language" />
        <span className="size-2 rounded-[3px] bg-social" />
      </span>
      sbaby
    </span>
  )
}

/** Shell for every screen that needs a baby profile. */
export function RequireBaby({ withTabs = true }: { withTabs?: boolean }) {
  const baby = useActiveBaby()
  if (baby === undefined) return <div className="min-h-dvh" />
  if (baby === null) return <Navigate to="/welcome" replace />
  return (
    <BabyContext.Provider value={baby}>
      <div className="mx-auto min-h-dvh max-w-md px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
        {withTabs && (
          <header className="mb-4 flex items-center justify-between">
            <Wordmark />
            <Link to="/settings" aria-label="Settings" className="-mr-2 rounded-full p-2 text-ink-soft">
              <Icon name="settings" className="size-6" />
            </Link>
          </header>
        )}
        <Outlet />
      </div>
      {withTabs && <TabBar />}
    </BabyContext.Provider>
  )
}

function TabBar() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) =>
                cx(
                  'flex flex-col items-center gap-0.5 py-2.5 text-xs font-semibold',
                  isActive ? 'text-primary' : 'text-ink-soft',
                )
              }
            >
              <Icon name={t.icon} className="size-6" />
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

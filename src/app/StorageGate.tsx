import { useEffect, useState, type ReactNode } from 'react'
import { db } from '../db/db'
import { Wordmark } from './Layout'
import { requestPersistentStorage } from './platform'

/**
 * Opens local storage before any screen reads from it. Some browsers refuse storage (private
 * windows, blocked site data, previews); then we say so plainly instead of showing a blank screen.
 */
export function StorageGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'ok' | 'failed'>('checking')
  useEffect(() => {
    let alive = true
    db.open()
      .then(() => {
        if (!alive) return
        setState('ok')
        void requestPersistentStorage()
      })
      .catch(() => alive && setState('failed'))
    return () => {
      alive = false
    }
  }, [])

  if (state === 'checking') return <div className="min-h-dvh" />
  if (state === 'failed') {
    return (
      <main className="mx-auto max-w-md px-4 pt-8">
        <Wordmark />
        <h1 className="mt-8 text-2xl text-ink">sbaby can’t save here</h1>
        <p className="mt-3 text-ink-soft">
          This browser isn’t letting sbaby store data. That usually means a private window or blocked site data. Open
          sbaby in a normal browser window to keep your baby’s log.
        </p>
      </main>
    )
  }
  return <>{children}</>
}

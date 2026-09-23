import { useRef, useState } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { useActiveBaby } from '../../app/hooks'
import { Wordmark } from '../../app/Layout'
import { AREAS } from '../../content/types'
import { saveBaby } from '../../db/repo'
import { AreaChip } from '../../ui/components'
import { BabyForm } from './BabyForm'

export function Welcome() {
  const navigate = useNavigate()
  const baby = useActiveBaby()
  const fileRef = useRef<HTMLInputElement>(null)
  const [restoreError, setRestoreError] = useState(false)
  if (baby) return <Navigate to="/" replace />

  async function restore(file: File) {
    try {
      const { importBackup } = await import('../../db/backup')
      await importBackup(JSON.parse(await file.text()))
      navigate('/', { replace: true })
    } catch {
      setRestoreError(true)
    }
  }
  return (
    <main className="mx-auto min-h-dvh max-w-md px-4 pb-10 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Wordmark />
      <h1 className="mt-8 text-3xl leading-tight text-ink">A few minutes of play, every day.</h1>
      <p className="mt-3 text-ink-soft">
        sbaby gives you a short checklist of games for your baby’s exact age. While you play, tick what your baby does,
        and sbaby keeps track of their milestones.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {AREAS.map((a) => (
          <AreaChip key={a} area={a} size="md" />
        ))}
      </div>
      <div className="mt-8 rounded-card border border-line bg-surface p-5">
        <BabyForm
          submitLabel="Start playing"
          onSubmit={async (v) => {
            await saveBaby(v)
            navigate('/', { replace: true })
          }}
        />
      </div>
      <p className="mt-4 text-center text-xs text-ink-soft">Everything stays on this device. No account needed.</p>
      <p className="mt-6 text-center text-sm text-ink-soft">
        Moving from another phone?{' '}
        <button type="button" className="font-semibold text-primary" onClick={() => fileRef.current?.click()}>
          Restore a backup
        </button>
      </p>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Backup file"
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void restore(f)
        }}
      />
      {restoreError && (
        <p role="alert" className="mt-2 text-center text-sm font-semibold text-motor-ink">
          That file isn’t a valid sbaby backup.
        </p>
      )}
    </main>
  )
}

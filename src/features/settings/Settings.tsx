import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useBaby, useGamesPerDay } from '../../app/hooks'
import { deleteAllData, saveBaby, setGamesPerDay } from '../../db/repo'
import { todayISO } from '../../domain/age'
import { saveFile } from '../../app/platform'
import { MAX_GAMES_PER_DAY, MIN_GAMES_PER_DAY } from '../../domain/planner'
import { Button, Card, ConfirmSheet, SectionTitle, Stepper } from '../../ui/components'
import { Icon } from '../../ui/Icon'
import { BabyForm } from '../onboarding/BabyForm'

export function Settings() {
  const baby = useBaby()
  const perDay = useGamesPerDay()
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [pendingRestore, setPendingRestore] = useState<File | null>(null)
  const [confirmWipe, setConfirmWipe] = useState(false)

  async function download() {
    const { exportBackup } = await import('../../db/backup')
    const data = await exportBackup()
    const outcome = await saveFile(`sbaby-backup-${todayISO()}.json`, JSON.stringify(data, null, 2))
    setMessage(
      outcome === 'saved'
        ? 'Backup saved. Keep it somewhere safe, like Google Drive or email it to yourself.'
        : outcome === 'declined'
          ? 'Download cancelled. Nothing was saved.'
          : 'Downloads aren’t available here. Open sbaby in a browser to save a backup.',
    )
  }

  async function restore(file: File) {
    setPendingRestore(null)
    try {
      const { importBackup } = await import('../../db/backup')
      await importBackup(JSON.parse(await file.text()))
      setMessage('Backup restored.')
      navigate('/')
    } catch {
      setMessage('That file isn’t a valid sbaby backup. Nothing was changed.')
    }
  }

  async function wipe() {
    setConfirmWipe(false)
    await deleteAllData()
    navigate('/welcome', { replace: true })
  }

  return (
    <main>
      <Link to="/" className="-ml-1 mb-3 inline-flex items-center gap-1 py-1 text-sm font-semibold text-ink-soft">
        <Icon name="back" className="size-4" />
        Today
      </Link>
      <h1 className="text-2xl text-ink">Settings</h1>

      {message && (
        <p role="status" className="mt-4 rounded-2xl bg-social-tint p-4 text-sm text-social-ink">
          {message}
        </p>
      )}

      <SectionTitle>Baby</SectionTitle>
      <Card>
        <BabyForm
          key={baby.id + baby.dob + baby.name}
          initial={baby}
          submitLabel="Save changes"
          onSubmit={async (v) => {
            await saveBaby({ ...v, id: baby.id })
            setMessage('Saved. Today’s games were re-picked for the updated age.')
          }}
        />
      </Card>

      <SectionTitle>Daily checklist</SectionTitle>
      <Card className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-ink">Games per day</span>
        {perDay !== undefined && (
          <Stepper label="games per day" value={perDay} min={MIN_GAMES_PER_DAY} max={MAX_GAMES_PER_DAY} onChange={setGamesPerDay} />
        )}
      </Card>

      <SectionTitle>Your data</SectionTitle>
      <Card>
        <p className="text-sm text-ink-soft">
          Everything is stored only in this browser on this device. If you clear your browser data or lose your phone,
          it’s gone. Download a backup now and then.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={download}>Download backup</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Restore from backup
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Backup file"
            onChange={(e) => {
              const f = e.target.files?.[0]
              e.target.value = ''
              if (f) setPendingRestore(f)
            }}
          />
        </div>
        <Button variant="ghost" className="mt-4 -ml-3 text-motor-ink" onClick={() => setConfirmWipe(true)}>
          Delete all data
        </Button>
      </Card>

      <SectionTitle>About</SectionTitle>
      <div className="space-y-2 text-sm text-ink-soft">
        <p>
          Milestones come from the CDC’s “Learn the Signs. Act Early.” checklists (2022). They describe what most children
          (75% or more) do by each age.
        </p>
        <p>
          <strong className="text-ink">sbaby is not medical advice</strong> and has not yet been reviewed by a pediatrician.
          If you’re worried about your baby’s development, talk to your doctor.
        </p>
      </div>

      <ConfirmSheet
        open={!!pendingRestore}
        title="Restore this backup?"
        message="Restoring replaces everything in sbaby on this device with the backup."
        confirmLabel="Restore"
        destructive
        onConfirm={() => pendingRestore && void restore(pendingRestore)}
        onCancel={() => setPendingRestore(null)}
      />
      <ConfirmSheet
        open={confirmWipe}
        title="Delete all data?"
        message={`This deletes ${baby.name}’s profile and all games, notes and milestones from this device. It can’t be undone.`}
        confirmLabel="Delete everything"
        destructive
        onConfirm={() => void wipe()}
        onCancel={() => setConfirmWipe(false)}
      />
    </main>
  )
}

import { HashRouter, MemoryRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { RequireBaby } from './app/Layout'
import { StorageGate } from './app/StorageGate'
import { Growth } from './features/growth/Growth'
import { Library } from './features/library/Library'
import { Welcome } from './features/onboarding/Welcome'
import { Play } from './features/play/Play'
import { Progress } from './features/progress/Progress'
import { Settings } from './features/settings/Settings'
import { Today } from './features/today/Today'

/**
 * Hash routing keeps the PWA working on any static host without server rewrites.
 * Inside a claude.ai Artifact the page runs in a locked-down frame, so routes live in memory.
 */
const Router = import.meta.env.MODE === 'artifact' ? MemoryRouter : HashRouter

export function App() {
  return (
    <Router>
      <StorageGate>
        <Routes>
          <Route path="/welcome" element={<Welcome />} />
          <Route element={<RequireBaby />}>
            <Route index element={<Today />} />
            <Route path="library" element={<Library />} />
            <Route path="growth" element={<Growth />} />
            <Route path="progress" element={<Progress />} />
          </Route>
          <Route element={<RequireBaby withTabs={false} />}>
            <Route path="play/:gameId" element={<FreshPlay />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </StorageGate>
    </Router>
  )
}

/** A new visit to a game always starts a fresh session, even from another game's screen. */
function FreshPlay() {
  return <Play key={useLocation().key} />
}

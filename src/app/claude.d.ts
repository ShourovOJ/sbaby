// Minimal types for the claude.ai Artifact runtime (contract 0.2.54), covering only what sbaby uses.
// Outside an Artifact, `window.claude` does not exist.

interface ClaudeDownloads {
  save(request: { filename: string; data: string | Blob | ArrayBuffer | ArrayBufferView }): Promise<{
    status: 'saved' | 'delivered'
  }>
}

interface ClaudeRuntime {
  use(name: 'downloads'): Promise<ClaudeDownloads | null>
}

interface Window {
  claude?: ClaudeRuntime
}

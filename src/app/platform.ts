export type SaveOutcome = 'saved' | 'declined' | 'unavailable'

/**
 * Offers a text file to the user. Inside a claude.ai Artifact, page-started downloads are blocked,
 * so it goes through the platform's `downloads` capability (the viewer confirms the save).
 * Everywhere else it uses a normal browser download.
 */
export async function saveFile(filename: string, text: string): Promise<SaveOutcome> {
  if (window.claude?.use) {
    const downloads = await window.claude.use('downloads').catch(() => null)
    if (!downloads) return 'unavailable'
    try {
      await downloads.save({ filename, data: text })
      return 'saved'
    } catch (e) {
      const code = (e as { code?: string })?.code
      return code === 'declined' || code === 'rate_limited' ? 'declined' : 'unavailable'
    }
  }
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  return 'saved'
}

/** Asks the browser not to clear sbaby's data under storage pressure. Best effort only. */
export async function requestPersistentStorage(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    // Not allowed here (e.g. inside a sandboxed frame). Nothing else to do.
  }
}

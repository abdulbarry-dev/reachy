import type { ImportedRecipient } from '../types'

/** Versioned key: bump the suffix if the persisted shape ever changes. */
export const RECIPIENTS_STORAGE_KEY = 'reachy_recipients_v1'

/**
 * The browser store, or `null` where it is unavailable.
 *
 * Merely touching `localStorage` throws in some privacy modes and in any
 * non-browser environment, so presence itself has to be probed rather than
 * assumed.
 */
function browserStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/**
 * Reads the persisted recipient list.
 *
 * Every failure mode — no store, disabled store, malformed JSON, JSON that is
 * not a list — degrades to an empty list. A corrupt cache must never stop the
 * app from booting.
 */
export function loadRecipients(storage: Storage | null = browserStorage()): ImportedRecipient[] {
  if (!storage) return []

  try {
    const raw = storage.getItem(RECIPIENTS_STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as ImportedRecipient[]) : []
  } catch {
    return []
  }
}

/**
 * Writes the recipient list.
 *
 * Persistence is best-effort: a full quota or a disabled store is reported by
 * throwing, and that throw would otherwise escape a dispatched action. The
 * in-memory state is still correct, so the failure is swallowed.
 */
export function saveRecipients(
  items: readonly ImportedRecipient[],
  storage: Storage | null = browserStorage(),
): void {
  if (!storage) return

  try {
    storage.setItem(RECIPIENTS_STORAGE_KEY, JSON.stringify(items))
  } catch {
    // Quota exceeded or storage disabled — the session keeps working.
  }
}

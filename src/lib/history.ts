/**
 * Local query history.
 *
 * Persists recent thought inputs to localStorage so users can
 * restore past queries without retyping. Entirely client-side —
 * no server or database involvement.
 *
 * Storage key: "ts:history"
 * Format: JSON array of HistoryEntry, newest first.
 * Cap: MAX_HISTORY_ENTRIES entries. Oldest are dropped when exceeded.
 */

/** A single saved query entry. */
export interface HistoryEntry {
  /** Unique id — use crypto.randomUUID() at save time. */
  id: string;
  /** The raw input text submitted by the user. */
  text: string;
  /** Unix timestamp (ms) of when the query was submitted. */
  savedAt: number;
}

/** Maximum number of entries retained in localStorage. */
export const MAX_HISTORY_ENTRIES = 20;

/** localStorage key for the history array. */
const STORAGE_KEY = 'ts:history';

/**
 * Loads history from localStorage.
 * Returns an empty array if storage is unavailable or data is malformed.
 * Never throws.
 */
export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }

    // Filter to valid entries only
    return parsed.filter(
      (item): item is HistoryEntry =>
        typeof item === 'object' &&
        item !== null &&
        typeof (item as Record<string, unknown>).id === 'string' &&
        typeof (item as Record<string, unknown>).text === 'string' &&
        typeof (item as Record<string, unknown>).savedAt === 'number'
    );
  } catch {
    return [];
  }
}

function persist(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    console.warn('[history] localStorage write failed — storage may be full or unavailable.');
  }
}

/**
 * Saves a new entry to localStorage history.
 * Deduplicates by text — if the same text already exists, it is moved
 * to the top (most recent) rather than duplicated.
 * Trims to MAX_HISTORY_ENTRIES after insert.
 *
 * @param text — the submitted thought text
 * @returns the full updated history array
 */
export function saveToHistory(text: string): HistoryEntry[] {
  const trimmed = text.trim();
  if (!trimmed) return loadHistory();

  const current = loadHistory();
  const deduped = current.filter((e) => e.text.trim() !== trimmed);

  const entry: HistoryEntry = {
    id: crypto.randomUUID(),
    text: trimmed,
    savedAt: Date.now()
  };

  const updated = [entry, ...deduped].slice(0, MAX_HISTORY_ENTRIES);
  persist(updated);
  return updated;
}

/**
 * Removes a single entry from history by id.
 * @returns the full updated history array
 */
export function removeFromHistory(id: string): HistoryEntry[] {
  const current = loadHistory();
  const updated = current.filter((e) => e.id !== id);
  persist(updated);
  return updated;
}

/**
 * Clears all history from localStorage.
 */
export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    console.warn('[history] localStorage clear failed.');
  }
}

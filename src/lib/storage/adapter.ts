interface Envelope<T> {
  schemaVersion: number;
  data: T;
}

/**
 * Reads a versioned JSON envelope from localStorage. Never throws: a missing
 * key, invalid JSON, a wrong-shaped envelope, or an unrecognized
 * schemaVersion all resolve to `defaultData` rather than propagating.
 */
export function readEnvelope<T>(key: string, currentVersion: number, defaultData: T): T {
  let raw: string | null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return defaultData;
  }

  if (raw === null) {
    return defaultData;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Envelope<T>>;
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.schemaVersion === currentVersion &&
      "data" in parsed
    ) {
      return parsed.data as T;
    }
    return defaultData;
  } catch {
    return defaultData;
  }
}

/**
 * Writes a versioned JSON envelope to localStorage. Never throws: a write
 * failure (quota exceeded, private-browsing restrictions) is caught and
 * reported via `{ ok: false }` instead of propagating.
 */
export function writeEnvelope<T>(key: string, currentVersion: number, data: T): { ok: boolean } {
  const envelope: Envelope<T> = { schemaVersion: currentVersion, data };
  try {
    localStorage.setItem(key, JSON.stringify(envelope));
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

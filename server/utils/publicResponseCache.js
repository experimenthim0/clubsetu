const cache = new Map();

const DEFAULT_TTL_MS = 15_000;

export const getPublicResponse = (key) => {
  const entry = cache.get(key);
  if (!entry) return undefined;

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return undefined;
  }

  return entry.value;
};

export const setPublicResponse = (key, value, ttlMs = DEFAULT_TTL_MS) => {
  cache.set(key, { value, expiresAt: Date.now() + ttlMs });
};

/**
 * Remove public responses after a mutation. Public event feeds contain
 * mutable fields such as registeredCount, so waiting for the TTL can expose
 * an old registration state to every client.
 */
export const invalidatePublicResponses = (patterns = []) => {
  for (const pattern of patterns) {
    for (const key of cache.keys()) {
      if (pattern.endsWith("*")) {
        if (key.startsWith(pattern.slice(0, -1))) cache.delete(key);
      } else if (key === pattern) {
        cache.delete(key);
      }
    }
  }
};

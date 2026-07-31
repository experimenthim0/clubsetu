import axios from "axios";

const cache = new Map();
const DEFAULT_TTL_MS = 30_000;

export const getPublicJson = (url, ttlMs = DEFAULT_TTL_MS) => {
  const current = cache.get(url);
  const now = Date.now();

  if (current?.data !== undefined && current.expiresAt > now) {
    return Promise.resolve(current.data);
  }

  if (current?.promise) return current.promise;

  const promise = axios.get(url)
    .then((response) => {
      const data = response.data;
      cache.set(url, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .catch((error) => {
      cache.delete(url);
      throw error;
    });

  cache.set(url, { promise, expiresAt: 0 });
  return promise;
};

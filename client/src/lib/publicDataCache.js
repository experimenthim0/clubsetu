/**
 * publicDataCache.js — Backward-Compatible Bridge to cacheManager
 *
 * This file preserves the existing `getPublicJson(url, ttlMs)` API surface
 * so that all current consumers (SearchBar, ClubLeaderboard, EventFeed,
 * EventDetails, Clubspage, ClubDetails) continue working without import changes.
 *
 * Under the hood, it delegates to the new cacheManager.js which provides:
 * - IndexedDB persistence (survives page refreshes)
 * - Per-resource TTL (auto-detected from URL pattern)
 * - ETag / conditional requests (304 = zero bandwidth)
 * - Stale-while-revalidate (instant data + background refresh)
 * - Multi-tab BroadcastChannel sync
 * - LRU eviction at 100 MB
 *
 * Old behavior (replaced):
 *   const cache = new Map();  // Lost on every page refresh
 *   const DEFAULT_TTL_MS = 30_000;  // Flat 30s for everything
 */

import { cachedFetch, invalidateCache, invalidateExact, forceRefresh } from './cacheManager.js';

/**
 * Fetch JSON data with intelligent caching.
 *
 * Drop-in replacement for the old getPublicJson. The ttlMs parameter
 * is still accepted for backward compatibility but the cacheManager
 * will auto-detect the correct TTL from the URL pattern. If a custom
 * ttlMs is provided, it overrides the auto-detected value.
 *
 * @param {string} url — Full API URL
 * @param {number} [ttlMs] — Optional TTL override in milliseconds
 * @returns {Promise<any>} — Parsed JSON response
 */
export const getPublicJson = (url, ttlMs) => {
  const options = {};
  if (ttlMs !== undefined) {
    options.ttlMs = ttlMs;
  }
  return cachedFetch(url, options);
};

// Re-export cache management utilities for pages that need CRUD invalidation
export { invalidateCache, invalidateExact, forceRefresh };

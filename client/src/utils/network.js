/**
 * network.js
 * Network status utilities, global event dispatcher, Axios network error interceptors,
 * and offline page caching for CampusNode.
 */

// Global Event Target to dispatch network status changes app-wide
class NetworkEventEmitter extends EventTarget {
  notify(isOnline) {
    this.dispatchEvent(new CustomEvent('network-status-change', { detail: { isOnline } }));
  }
}

export const networkEmitter = new NetworkEventEmitter();

/**
 * Perform an active check of network connectivity.
 * Combines navigator.onLine check with an active ping for true internet access.
 * @returns {Promise<boolean>}
 */
export async function checkNetworkStatus() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return true;
  }

  // Quick check via browser's native status
  if (!navigator.onLine) {
    networkEmitter.notify(false);
    return false;
  }

  // Active check via ping with short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Fetch favicon or static asset with cache busting
    const response = await fetch(`/favicon.ico?_=${Date.now()}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const isConnected = response.ok || response.status < 500;
    networkEmitter.notify(isConnected);
    return isConnected;
  } catch (error) {
    // If browser is offline or ping aborted/failed completely
    const isOffline = !navigator.onLine || error.name === 'AbortError';
    const isConnected = !isOffline;
    networkEmitter.notify(isConnected);
    return isConnected;
  }
}

/**
 * Configure Axios Interceptor to catch network errors safely.
 * Only triggers the NoInternet UI when browser is truly offline or confirmed by network check.
 * @param {import('axios').AxiosInstance} axiosInstance 
 */
export function setupAxiosNetworkInterceptor(axiosInstance) {
  if (!axiosInstance || !axiosInstance.interceptors) return;

  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      // If native browser reports offline, trigger offline UI
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        console.warn('[NetworkGuard] Axios detected offline status via navigator.onLine');
        networkEmitter.notify(false);
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        // If navigator.onLine is true, check active ping before declaring offline state
        // to prevent API server downtime/errors from crashing the app into No Internet UI.
        const activeOnline = await checkNetworkStatus();
        if (!activeOnline) {
          console.warn('[NetworkGuard] Active check confirmed offline status');
          networkEmitter.notify(false);
        }
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Offline Page & Asset Cache Management
 * Uses Cache Storage API to cache pages for offline viewing.
 */
const CACHE_NAME = 'campusnode-offline-v1';
const CRITICAL_ROUTES = [
  '/',
  '/events',
  '/clubs',
  '/faq',
  '/about-features',
];

/**
 * Caches static routes and assets for offline access.
 */
export async function cacheOfflinePages() {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  try {
    const cache = await caches.open(CACHE_NAME);
    // Cache critical routes when online
    if (navigator.onLine) {
      await cache.addAll(CRITICAL_ROUTES).catch((err) => {
        console.debug('[OfflineCache] Partial cache add:', err);
      });
    }
  } catch (err) {
    console.warn('[OfflineCache] Failed to initialize cache:', err);
  }
}

/**
 * Automatically caches current page html for offline retrieval
 * @param {string} pathname 
 */
export async function cacheCurrentPage(pathname) {
  if (typeof window === 'undefined' || !('caches' in window) || !navigator.onLine) return;
  
  try {
    const cache = await caches.open(CACHE_NAME);
    await cache.add(pathname).catch(() => {});
  } catch (err) {
    // Ignore non-critical cache errors
  }
}

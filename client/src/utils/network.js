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

  // Quick check
  if (!navigator.onLine) {
    networkEmitter.notify(false);
    return false;
  }

  // Active check via ping with short timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Fetch favicon or API health check with cache busting
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
    // If request failed due to network error, report offline
    const isOffline = error.name === 'AbortError' || !navigator.onLine;
    const status = !isOffline;
    networkEmitter.notify(status);
    return status;
  }
}

/**
 * Configure Axios Interceptor to catch ERR_NETWORK or Network Error
 * and trigger the NoInternet UI immediately.
 * @param {import('axios').AxiosInstance} axiosInstance 
 */
export function setupAxiosNetworkInterceptor(axiosInstance) {
  if (!axiosInstance || !axiosInstance.interceptors) return;

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      const isNetworkError =
        error.code === 'ERR_NETWORK' ||
        error.message === 'Network Error' ||
        (!error.response && error.code !== 'ECONNABORTED' && !navigator.onLine);

      if (isNetworkError) {
        console.warn('[NetworkGuard] Axios caught network error:', error.message);
        networkEmitter.notify(false);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Offline Page & Asset Cache Management
 * Uses Cache Storage API to cache pages for offline viewing.
 */
const CACHE_NAME = 'campusnode-offline-cache-v1';
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

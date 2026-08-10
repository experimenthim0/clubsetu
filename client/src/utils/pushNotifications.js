/**
 * pushNotifications.js
 * PWA Web Push Notification & App Icon Badging Utilities
 */

/**
 * Request notification permissions from the user.
 * @returns {Promise<boolean>}
 */
export async function requestNotificationPermission() {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('[Push] Notifications not supported in this browser environment.');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log(`[Push] Notification permission status: ${permission}`);
    return permission === 'granted';
  } catch (error) {
    console.error('[Push] Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Update the app icon badge count (PWA Badging API).
 * @param {number} count 
 */
export async function setAppIconBadge(count) {
  if (typeof navigator === 'undefined' || !('setAppBadge' in navigator)) {
    return;
  }

  try {
    const num = Number(count);
    if (num > 0) {
      await navigator.setAppBadge(num);
    } else {
      await navigator.clearAppBadge();
    }
  } catch (err) {
    console.warn('[Push] Unable to set app badge:', err);
  }
}

/**
 * Clear the app icon badge.
 */
export async function clearAppIconBadge() {
  if (typeof navigator === 'undefined' || !('clearAppBadge' in navigator)) {
    return;
  }

  try {
    await navigator.clearAppBadge();
  } catch (err) {
    console.warn('[Push] Unable to clear app badge:', err);
  }
}

/**
 * Check if the app/tab is currently visible and focused.
 * When visible, we skip the native notification banner since the
 * in-app notification list already handles it — this also avoids
 * browsers silently suppressing foreground showNotification() calls.
 * @returns {boolean}
 */
function isAppVisible() {
  if (typeof document === 'undefined') return false;
  return document.visibilityState === 'visible' && document.hasFocus();
}

/**
 * Race navigator.serviceWorker.ready against a timeout so the notification
 * doesn't silently hang if the SW hasn't activated yet (first-load race).
 * @param {number} ms  timeout in milliseconds
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
function getSwRegistration(ms = 3000) {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return Promise.resolve(null);
  }
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

/**
 * Display a native OS push notification if browser permissions are granted.
 *
 * KEY BEHAVIOR:
 *   - When the app tab is **hidden / not focused** → shows a native banner.
 *   - When the app tab is **visible and focused**  → skips (in-app list is enough).
 *   - Falls back to `new Notification()` if the Service Worker isn't ready yet.
 *
 * @param {string} title
 * @param {NotificationOptions} options
 */
export async function sendLocalPushNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Skip native banner when user is actively looking at the app —
  // the in-app notification list already handles this case.
  if (isAppVisible()) {
    console.log('[Push] App is visible — skipping native notification (in-app list handles it).');
    return;
  }

  try {
    const notificationOptions = {
      icon: options.icon || '/cs_pwa_notification.png',
      badge: options.badge || '/cs_pwa_notification.png',
      body: options.body || '',
      image: options.image || undefined,
      vibrate: options.vibrate || [100, 50, 100],
      tag: options.tag || `notification-${Date.now()}`,
      renotify: options.renotify ?? true,
      requireInteraction: options.requireInteraction ?? false,
      data: options.data || { url: '/' },
      actions: options.actions || [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Dismiss' },
      ],
      ...options,
    };

    // Try the Service Worker path first (required for PWA installed apps).
    // If the SW isn't ready within 3 s, fall back to the Notification constructor.
    const registration = await getSwRegistration(3000);

    if (registration && registration.showNotification) {
      await registration.showNotification(title, notificationOptions);
      console.log('[Push] Native notification shown via Service Worker.');
    } else {
      // Fallback — works in desktop browsers even without an active SW.
      new Notification(title, notificationOptions);
      console.log('[Push] Native notification shown via Notification constructor (SW unavailable).');
    }
  } catch (err) {
    console.warn('[Push] Error showing notification:', err);
    // Last-resort fallback
    try {
      new Notification(title, { body: options.body || '' });
    } catch (_) { /* give up silently */ }
  }
}

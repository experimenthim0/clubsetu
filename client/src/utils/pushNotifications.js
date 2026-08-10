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
 * Display a client-side push notification if browser permissions are granted.
 * @param {string} title 
 * @param {NotificationOptions} options 
 */
export async function sendLocalPushNotification(title, options = {}) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
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

    if (registration && registration.showNotification) {
      await registration.showNotification(title, notificationOptions);
    } else {
      new Notification(title, notificationOptions);
    }
  } catch (err) {
    console.warn('[Push] Error showing notification:', err);
  }
}

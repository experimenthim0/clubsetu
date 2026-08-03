import { useState, useEffect, useCallback } from 'react';

/**
 * usePwaInstall
 * Custom hook to capture PWA install prompt and expose trigger function.
 */
export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already running in standalone mode (installed)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstallPrompt = (e) => {
      // Prevent default Chrome mini-infobar from showing automatically
      e.preventDefault();
      // Store the event so it can be triggered manually by user action
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log('[PWA] CampusNode app successfully installed');
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async () => {
    if (!deferredPrompt) {
      return false;
    }

    // Show the native browser install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`[PWA] User response to install prompt: ${outcome}`);

    // Clear deferred prompt as it can only be used once
    setDeferredPrompt(null);
    setIsInstallable(false);

    return outcome === 'accepted';
  }, [deferredPrompt]);

  return { isInstallable, installApp, isInstalled };
}

export default usePwaInstall;

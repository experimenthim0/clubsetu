import { useState, useEffect, useCallback } from 'react';
import { networkEmitter, checkNetworkStatus } from '../utils/network';

/**
 * useNetworkStatus
 * React hook to track real-time internet connectivity.
 * Listens to native window online/offline events as well as app networkEmitter events.
 * 
 * @returns {{ isOnline: boolean, checkStatus: () => Promise<boolean> }}
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  const handleCustomEvent = useCallback((event) => {
    if (event?.detail && typeof event.detail.isOnline === 'boolean') {
      setIsOnline(event.detail.isOnline);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    const status = await checkNetworkStatus();
    setIsOnline(status);
    return status;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Native browser window listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // App-wide event listener (e.g. triggered by Axios interceptors)
    networkEmitter.addEventListener('network-status-change', handleCustomEvent);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      networkEmitter.removeEventListener('network-status-change', handleCustomEvent);
    };
  }, [handleOnline, handleOffline, handleCustomEvent]);

  return { isOnline, checkStatus };
}

export default useNetworkStatus;

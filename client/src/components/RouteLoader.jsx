import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from './PageLoader';

/**
 * RouteLoader — wraps all routes, showing the Lissajous loader on every
 * navigation until the new page's content has painted.
 *
 * Strategy:
 *  1. On route change (location.pathname), set loading = true.
 *  2. After a brief delay (lets React render the new route), set loading = false.
 *  3. On initial app load, loader stays visible for a minimum duration so
 *     the user sees the animation (avoids a flash).
 */
export default function RouteLoader({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // On initial mount, keep loader visible for at least 1.8s so the
    // animation is meaningful, then wait for content.
    if (initialLoad) {
      const minTimer = setTimeout(() => {
        setInitialLoad(false);
        setLoading(false);
      }, 2800);
      return () => clearTimeout(minTimer);
    }

    // On subsequent route changes, show the loader briefly
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      <PageLoader visible={loading} />
      {children}
    </>
  );
}

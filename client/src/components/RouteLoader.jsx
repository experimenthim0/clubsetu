import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from './PageLoader';

const SIDEBAR_ROUTE_PREFIXES = [
  "/profile",
  "/my-events",
  "/club-events",
  "/payments",
  "/send-notification",
  "/club/edit",
  "/club/",       // catches /club/:clubId/team
  "/admin-dashboard",
  "/admin/lost-found",
  "/dashboard",
  "/create",
  "/events/edit",
];

const isSidebarRoute = (pathname) => {
  if (pathname.startsWith("/club/")) {
    const subpath = pathname.slice("/club/".length);
    if (subpath.includes("/team") || pathname.startsWith("/club/edit")) {
      return true;
    }
    return false;
  }
  if (pathname === "/clubs") return false;
  return SIDEBAR_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

/**
 * RouteLoader — wraps all routes, showing the Lissajous loader on navigation.
 *
 * Strategy:
 *  1. On initial load, show the full-screen loader for a minimum duration.
 *  2. On subsequent route changes:
 *     - If navigating to a dashboard route, skip the global full-screen loader
 *       (so the workspace-only loader inside AppLayout takes over).
 *     - If navigating to a public route, show the full-screen loader for 1s.
 */
export default function RouteLoader({ children }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    // On initial mount, keep loader visible for at least 2.8s so the
    // animation is meaningful, then wait for content.
    if (initialLoad) {
      const minTimer = setTimeout(() => {
        setInitialLoad(false);
        setLoading(false);
      }, 2800);
      return () => clearTimeout(minTimer);
    }

    const isDashboard = isSidebarRoute(location.pathname);
    if (isDashboard) {
      // Bypass the global loader for dashboard route transitions
      setLoading(false);
      return;
    }

    // On subsequent public route changes, show the loader briefly
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

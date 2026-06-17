import React from 'react';

/**
 * RouteLoader — wraps all routes.
 * Formerly showed an artificial loader on navigation, now disabled to ensure
 * instantaneous transitions and page loads since code is statically loaded.
 */
export default function RouteLoader({ children }) {
  return children;
}


import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — declarative route guard component.
 *
 * Usage:
 *   <ProtectedRoute>                                    — requires login
 *   <ProtectedRoute roles={['admin', 'paymentAdmin']}>  — requires specific role(s)
 *
 * Redirects:
 *   - Unauthenticated users → /login (or /admin-secret-login for admin routes)
 *   - Authenticated users with wrong role → /login
 */
const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Determine redirect target based on route context
    const isAdminRoute = location.pathname.includes('/admin');
    const redirectTo = isAdminRoute ? '/admin-secret-login' : '/login';
    return <Navigate to={redirectTo} replace />;
  }

  // Role check: if specific roles are required, verify current role is allowed
  if (roles && roles.length > 0 && !roles.includes(role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;

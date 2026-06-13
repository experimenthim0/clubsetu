import React from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import DynamicSidebar from "./DynamicSidebar";
import PageLoader from "./PageLoader";
import DashboardFooter from "./DashboardFooter";

/**
 * Routes that activate the sidebar "dashboard" layout.
 * If the current pathname starts with any of these prefixes,
 * the sidebar will be rendered on desktop.
 */
const SIDEBAR_ROUTE_PREFIXES = [
  "/profile",
  "/my-events",
  "/club-events",
  "/payments",
  "/send-notification",
  "/club/edit",
  "/club/",       // catches /club/:clubId/team
  "/dashboard",
  "/create",
  "/events/edit",
];

/**
 * Check if the given pathname should show the sidebar layout.
 */
const isSidebarRoute = (pathname) => {
  // Exclude public club detail pages like /club/some-slug (no /edit or /team suffix)
  // but include /club/:id/team and /club/edit/:id
  if (pathname.startsWith("/club/")) {
    const subpath = pathname.slice("/club/".length);
    // Only activate sidebar for /club/:id/team or /club/edit/:id
    if (subpath.includes("/team") || pathname.startsWith("/club/edit")) {
      return true;
    }
    return false;
  }

  // Exclude /clubs (the public clubs listing page)
  if (pathname === "/clubs") return false;

  return SIDEBAR_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
};

/**
 * AppLayout — master container that conditionally renders the dashboard sidebar.
 *
 * When the current route is a management/dashboard route:
 *   - Desktop: Navbar on top → sidebar (left 256px) + scrollable main content (right)
 *   - Mobile:  Navbar on top → main content only, BottomNav at the bottom
 *
 * On all other routes:
 *   - Renders the standard public layout (Navbar + content + Footer + BottomNav)
 *
 * Auth redirect: unauthenticated users on sidebar routes are sent to /login.
 */
const AppLayout = () => {
  const location = useLocation();
  const isDashboardRoute = isSidebarRoute(location.pathname);
  const [dashboardLoading, setDashboardLoading] = React.useState(false);

  // Trigger workspace loader on dashboard route transition
  React.useEffect(() => {
    if (isDashboardRoute) {
      setDashboardLoading(true);
      const timer = setTimeout(() => {
        setDashboardLoading(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setDashboardLoading(false);
    }
  }, [location.pathname, isDashboardRoute]);

  // ── Read user from localStorage (same pattern as Navbar/BottomNav) ────
  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    const storedAdmin = localStorage.getItem("admin");
    const raw = storedUser || storedAdmin;
    if (raw && raw !== "undefined") {
      user = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error parsing user from local storage", err);
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
  }

  // ── Auth gate for dashboard/management routes ─────────────────────────
  if (isDashboardRoute && !user) {
    return <Navigate to="/login" replace />;
  }

  // ── Dashboard / Management layout ─────────────────────────────────────
  if (isDashboardRoute) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
        {/* Navbar — always pinned at top, full width */}
        <Navbar />

        {/* Dashboard body: sidebar + content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar — desktop only (hidden below md) */}
          <DynamicSidebar user={user} />

          {/* Main content area — scrollable */}
          <main
            className="flex-1 overflow-y-auto pb-20 md:pb-0 relative"
            style={{ height: "calc(100vh - 4rem)" }}
          >
            {/* Workspace transition loader — only overlays main content area */}
            <PageLoader visible={dashboardLoading} absolute={true} />

            <Outlet />

            <DashboardFooter />
          </main>
        </div>

        {/* BottomNav — mobile only (self-hides on md+) */}
        <BottomNav />
      </div>
    );
  }

  // ── Standard public layout ────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0a] pb-20 md:pb-0">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <BottomNav />
    </div>
  );
};

export default AppLayout;

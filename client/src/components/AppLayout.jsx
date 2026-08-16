import React, { useState, useEffect } from "react";
import { useLocation, Navigate, Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import DynamicSidebar from "./DynamicSidebar";
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
  "/central-organizer",
  "/event-staff",
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
import InstallPwaBanner from "./InstallPwaBanner";

const AppLayout = () => {
  const location = useLocation();
  const isDashboardRoute = isSidebarRoute(location.pathname);

  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const isShown = sessionStorage.getItem("whatsapp_channel_tooltip_shown");
    if (!isShown) {
      let closeTimer;
      const showTimer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem("whatsapp_channel_tooltip_shown", "true");

        // Autoclose after 5 seconds
        closeTimer = setTimeout(() => {
          setShowTooltip(false);
        }, 5000);
      }, 2500);

      return () => {
        clearTimeout(showTimer);
        if (closeTimer) clearTimeout(closeTimer);
      };
    }
  }, []);

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

  // ── Render correct layout content ─────────────────────────────────────
  const layoutContent = isDashboardRoute ? (
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
          <div className="min-h-full flex flex-col">
            <div className="flex-grow">
              <Outlet />
            </div>
            <DashboardFooter />
          </div>
        </main>
      </div>

      {/* BottomNav — mobile only (self-hides on md+) */}
      <BottomNav />
    </div>
  ) : (
    <div className="min-h-screen flex flex-col  dark:bg-[#0a0a0a] pb-10 md:pb-0">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
      <BottomNav />
    </div>
  );

  return (
    <>
      {layoutContent}

      <InstallPwaBanner />
    </>
  );
};

export default AppLayout;

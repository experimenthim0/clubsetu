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

      {/* WhatsApp Tooltip Popup */}
      {/* {showTooltip && (
        <div className="fixed bottom-40 right-6 md:bottom-22 md:right-6 z-50 max-w-[260px] bg-white dark:bg-neutral-900 text-black dark:text-white p-4.5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.3)] border border-neutral-100 dark:border-neutral-800 animate-[bounce_1.5s_infinite] transition-all duration-300">
          <div className="relative">
            {/* Close Button 
            <button
              onClick={() => setShowTooltip(false)}
              className="absolute -top-3 -right-3 w-6 h-6 flex items-center justify-center rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              aria-label="Close message"
            >
              <i className="ri-close-line text-lg" />
            </button>
           <p className="text-[12px] font-bold leading-relaxed pr-2">
  Stay Ahead!
</p>
<p className="text-[12px] font-medium leading-relaxed text-neutral-800 dark:text-neutral-200 pr-2 mt-1">
  Get instant campus updates on WhatsApp.
</p>
           
            <div className="absolute -bottom-[26px] right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white dark:border-t-neutral-900" />
            <div className="absolute -bottom-[27px] right-4 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-neutral-100 dark:border-t-neutral-800 -z-10" />
          </div>
        </div>
      )} */}

      {/* Floating WhatsApp Channel Button */}
      {/* <a
        href="https://whatsapp.com/channel/0029VbAhXba7z4kgTBY3nS0Z"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-20 right-3 md:bottom-6 md:right-4 z-50 flex items-center justify-center w-10 h-10 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.3)] transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        aria-label="Join our WhatsApp Channel"
      >
        <i className="ri-whatsapp-line text-2xl" />
        <span className="absolute right-16 scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100 transition-all duration-300 bg-neutral-900 dark:bg-neutral-800 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg whitespace-nowrap shadow-md pointer-events-none border border-neutral-800/20 translate-x-2 group-hover:translate-x-0">
          Join WhatsApp Channel
        </span>
      </a> */}
      <InstallPwaBanner />
    </>
  );
};

export default AppLayout;

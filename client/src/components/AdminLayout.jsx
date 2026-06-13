import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import AdminSidebar from "./AdminSidebar";
import DashboardFooter from "./DashboardFooter";

/**
 * AdminLayout — dedicated layout for admin routes.
 *
 * Renders a custom AdminNavbar + collapsible AdminSidebar + main content.
 * Completely separate from the public AppLayout — no public Navbar, Footer, or BottomNav.
 *
 * Auth gate: unauthenticated admins are redirected to /admin-secret-login.
 */
const AdminLayout = () => {
  // ── Read admin from localStorage ────
  let admin = null;
  try {
    const storedAdmin = localStorage.getItem("admin");
    if (storedAdmin && storedAdmin !== "undefined") {
      admin = JSON.parse(storedAdmin);
    }
  } catch (err) {
    console.error("Error parsing admin from local storage", err);
    localStorage.removeItem("admin");
  }

  const token = localStorage.getItem("token");

  // ── Auth gate for admin routes ─────────────────────────
  if (!admin || !token) {
    return <Navigate to="/admin-secret-login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Admin Navbar — always pinned at top, full width */}
      <AdminNavbar />

      {/* Dashboard body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Admin Sidebar — desktop only (hidden below md) */}
        <AdminSidebar />

        {/* Main content area — scrollable */}
        <main
          className="flex-1 overflow-y-auto relative"
          style={{ height: "calc(100vh - 4rem)" }}
        >
          <Outlet />

          <DashboardFooter />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

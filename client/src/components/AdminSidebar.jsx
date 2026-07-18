import React, { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Users,
  UserCog,
  CalendarDays,
  ChevronRight,
  ChevronLeft,
  Package,
  Sparkles,
  User,
} from "lucide-react";

/* ─── Sidebar Link ─────────────────────────────────────────────────────── */
const AdminSidebarLink = ({ to, icon: Icon, label, isActive, collapsed }) => (
  <Link
    to={to}
    className={`admin-sidebar-link group relative flex items-center rounded-xl transition-all duration-200
      ${isActive
        ? "bg-neutral-200 dark:bg-white text-black dark:text-white px-1.5"
        : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-white px-1.5"
      }`}
    title={collapsed ? label : undefined}
  >
    <Icon
      size={18}
      strokeWidth={isActive ? 2.2 : 1.7}
      className="shrink-0 sidebar-link-icon"
    />
    <span className="text-[13px] font-semibold tracking-wide truncate sidebar-link-text ml-3">
      {label}
    </span>
    {isActive && (
      <ChevronRight size={14} className="ml-auto shrink-0 opacity-60 sidebar-link-chevron" />
    )}

    {/* Tooltip — collapsed mode */}
    {collapsed && (
      <span className="admin-sidebar-tooltip absolute left-full ml-3 px-2.5 py-1.5 bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold tracking-wide rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
        {label}
        <span className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-black dark:bg-white rotate-45" />
      </span>
    )}
  </Link>
);

/* ─── Section Divider ──────────────────────────────────────────────────── */
const SectionDivider = () => (
  <div className="sidebar-divider my-3">
    <div className="h-px bg-neutral-200 dark:bg-zinc-800" />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   AdminSidebar — Luxury Minimal
   Inspired by: clean white sidebar, subtle icons, branded bottom card
   ═══════════════════════════════════════════════════════════════════════════ */
const AdminSidebar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab");
  const role = localStorage.getItem("role");

  // Read admin info
  let admin = null;
  try {
    const stored = localStorage.getItem("admin");
    if (stored && stored !== "undefined") admin = JSON.parse(stored);
  } catch (err) {
    console.error("Error parsing admin from local storage", err);
  }

  // Collapse state — persisted
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("adminSidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", String(collapsed));
  }, [collapsed]);

  const adminName = admin?.name || "Admin";

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white dark:bg-[#0a0a0a] border-r border-neutral-100 dark:border-zinc-800/80 overflow-hidden admin-sidebar-transition ${
        collapsed ? "admin-sidebar-collapsed" : "admin-sidebar-expanded"
      }`}
      style={{ height: "calc(100vh - 4rem)" }}
      aria-label="Admin sidebar"
    >
      {/* ── Top: Brand + Toggle ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-1 relative min-h-[44px]">
        <div className="flex items-center gap-2.5 min-w-0 sidebar-brand-container">
          <div className="w-8 h-8 rounded-lg bg-black dark:bg-white flex items-center justify-center shrink-0">
            <Sparkles size={14} className="text-orange-400 dark:text-orange-600" strokeWidth={2.5} />
          </div>
          <div className="min-w-0 sidebar-brand-text">
            <p className="text-[13px] font-bold text-black dark:text-white truncate leading-tight">
              {adminName}
            </p>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold tracking-wider uppercase leading-tight">
              {role === "paymentAdmin" ? "Payment Admin" : "Administrator"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setCollapsed((prev) => !prev)}
          className="admin-sidebar-toggle-btn w-7 h-7 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-black dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-zinc-800 transition-all duration-200 cursor-pointer shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight size={15} strokeWidth={2.5} />
          ) : (
            <ChevronLeft size={15} strokeWidth={2.5} />
          )}
        </button>
      </div>

      <SectionDivider />

      {/* ── Navigation ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto overflow-x-hidden" aria-label="Admin navigation">
        {role === "admin" && (
          <>
            <AdminSidebarLink
              to="/admin-dashboard?tab=overview"
              icon={LayoutDashboard}
              label="Overview"
              isActive={
                location.pathname === "/admin-dashboard" &&
                (!currentTab || currentTab === "overview")
              }
              collapsed={collapsed}
            />
            <AdminSidebarLink
              to="/admin-dashboard?tab=payouts"
              icon={Wallet}
              label="Payouts"
              isActive={
                location.pathname === "/admin-dashboard" &&
                currentTab === "payouts"
              }
              collapsed={collapsed}
            />
            <AdminSidebarLink
              to="/admin-dashboard?tab=payments-overview"
              icon={Wallet}
              label="Payments Management"
              isActive={
                location.pathname === "/admin-dashboard" &&
                currentTab === "payments-overview"
              }
              collapsed={collapsed}
            />
            <AdminSidebarLink
              to="/admin-dashboard?tab=club-heads"
              icon={Users}
              label="Manage Clubs"
              isActive={
                location.pathname === "/admin-dashboard" &&
                currentTab === "club-heads"
              }
              collapsed={collapsed}
            />
            <AdminSidebarLink
              to="/admin-dashboard?tab=coordinators"
              icon={UserCog}
              label="Coordinators"
              isActive={
                location.pathname === "/admin-dashboard" &&
                currentTab === "coordinators"
              }
              collapsed={collapsed}
            />
            <AdminSidebarLink
              to="/admin-dashboard?tab=event-data"
              icon={CalendarDays}
              label="Event Data"
              isActive={
                location.pathname === "/admin-dashboard" &&
                currentTab === "event-data"
              }
              collapsed={collapsed}
            />
          </>
        )}

        {(role === "admin" || role === "lostFoundAdmin") && (
          <>
            {role === "admin" && <SectionDivider />}
            <AdminSidebarLink
              to="/admin/lost-found"
              icon={Package}
              label="Lost & Found"
              isActive={location.pathname === "/admin/lost-found"}
              collapsed={collapsed}
            />
          </>
        )}

        {role === "paymentAdmin" && (
          <AdminSidebarLink
            to="/admin-dashboard?tab=payouts"
            icon={Wallet}
            label="Payouts"
            isActive={
              location.pathname === "/admin-dashboard" &&
              (!currentTab || currentTab === "payouts")
            }
            collapsed={collapsed}
          />
        )}

        {(role === "admin" || role === "paymentAdmin") && (
          <>
            <SectionDivider />
            <AdminSidebarLink
              to="/admin-dashboard?tab=profile"
              icon={User}
              label="Profile Settings"
              isActive={
                location.pathname === "/admin-dashboard" &&
                currentTab === "profile"
              }
              collapsed={collapsed}
            />
          </>
        )}
      </nav>

      {/* Collapsed: tiny accent dot */}
      <div className="pb-4 flex justify-center mt-auto sidebar-bottom-dot">
        <div className="w-2 h-2 rounded-full bg-orange-500" />
      </div>
    </aside>
  );
};

export default AdminSidebar;

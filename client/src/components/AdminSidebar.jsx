import React, { useState, useEffect } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Users,
  UserCog,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Package,
  Sparkles,
  User,
  Database,
  Calendar,
  Radio,
  Bell,
  Building2,
  Sliders,
} from "lucide-react";

/* ─── Sidebar Direct Link ─────────────────────────────────────────────────── */
const AdminSidebarLink = ({ to, icon: Icon, label, isActive, collapsed }) => (
  <Link
    to={to}
    className={`admin-sidebar-link group relative flex items-center rounded-xl transition-all duration-200 py-2
      ${isActive
        ? "bg-neutral-200 dark:bg-white text-black dark:text-white px-2 font-bold"
        : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-white px-2"
      }`}
    title={collapsed ? label : undefined}
  >
    <Icon
      size={18}
      strokeWidth={isActive ? 2.2 : 1.7}
      className="shrink-0 sidebar-link-icon"
    />
    <span className="text-[13px] font-bold tracking-wide truncate sidebar-link-text ml-3">
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

/* ─── Collapsible Category Dropdown ─────────────────────────────────────── */
const AdminSidebarDropdown = ({ icon: Icon, label, items, collapsed }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab");

  const isAnyChildActive = items.some((item) => {
    if (item.exactPath) return location.pathname === item.exactPath;
    return location.pathname === "/admin-dashboard" && currentTab === item.tab;
  });

  const [isOpen, setIsOpen] = useState(isAnyChildActive);

  useEffect(() => {
    if (isAnyChildActive) setIsOpen(true);
  }, [isAnyChildActive]);

  return (
    <div className="sidebar-dropdown-group my-1">

      <button
        type="button"
        onClick={() => !collapsed && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between rounded-xl px-2 py-2 transition-all duration-200 cursor-pointer ${isAnyChildActive
          ? "bg-neutral-100 dark:bg-zinc-800/90 text-black dark:text-white font-bold"
          : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100/70 dark:hover:bg-zinc-800/50 hover:text-black dark:hover:text-white"
          }`}
        title={collapsed ? label : undefined}
      >
        <div className="flex items-center min-w-0">
          <Icon size={18} strokeWidth={isAnyChildActive ? 2.2 : 1.7} className="shrink-0" />
          {!collapsed && (
            <span className="text-[13px] font-bold tracking-wide truncate ml-3">
              {label}
            </span>
          )}
        </div>
        {!collapsed && (
          <ChevronDown
            size={14}
            className={`shrink-0 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180 text-black dark:text-white" : ""
              }`}
          />
        )}
      </button>

      {/* Submenu links */}
      {!collapsed && isOpen && (
        <div className="pl-3.5 pt-1 pb-1 space-y-0.5 border-l-2 border-neutral-100 dark:border-zinc-800/80 ml-3.5 my-1">
          {items.map((item, idx) => {
            const isActive = item.exactPath
              ? location.pathname === item.exactPath
              : location.pathname === "/admin-dashboard" && currentTab === item.tab;

            const linkTo = item.exactPath || `/admin-dashboard?tab=${item.tab}`;

            return (
              <Link
                key={idx}
                to={linkTo}
                className={`flex items-center px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 ${isActive
                  ? "bg-black dark:bg-white text-white dark:text-black font-bold shadow-sm"
                  : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-zinc-800/60 hover:text-black dark:hover:text-white"
                  }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full mr-2.5 shrink-0 ${isActive ? "bg-orange-500" : "bg-neutral-300 dark:bg-zinc-700"
                  }`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Section Header / Divider ─────────────────────────────────────────── */
const SectionDivider = ({ title, collapsed }) => (
  <div className="sidebar-divider my-2">
    {title && !collapsed && (
      <p className="px-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
        {title}
      </p>
    )}
    <div className="h-px bg-neutral-200 dark:bg-zinc-800" />
  </div>
);

/* ═══════════════════════════════════════════════════════════════════════════
   AdminSidebar — Nested Dropdown Architecture (Existing Features Only)
   ═══════════════════════════════════════════════════════════════════════════ */
const AdminSidebar = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get("tab");
  const role = localStorage.getItem("role");

  // Read admin info
  let user = null;
  try {
    const stored = localStorage.getItem("user");
    if (stored && stored !== "undefined") user = JSON.parse(stored);
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

  const adminName = user?.name || "Admin";

  return (
    <aside
      className={`hidden md:flex flex-col shrink-0 bg-white dark:bg-[#0a0a0a] border-r border-neutral-100 dark:border-zinc-800/80 overflow-hidden admin-sidebar-transition ${collapsed ? "admin-sidebar-collapsed" : "admin-sidebar-expanded"
        }`}
      style={{ height: "calc(100vh - 4rem)" }}
      aria-label="Admin sidebar"
    >
      {/* ── Top: Brand + Toggle ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-1 relative min-h-[44px]">
        <div className="flex items-center gap-2.5 min-w-0 sidebar-brand-container">

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

      <SectionDivider collapsed={collapsed} />

      {/* ── Navigation List ─────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto overflow-x-hidden" aria-label="Admin navigation">
        {role === "admin" && (
          <>
            {/* 1. Overview */}
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

            {/* 2. Events Dropdown */}
            <AdminSidebarDropdown
              icon={Calendar}
              label="Events"
              collapsed={collapsed}
              items={[
                { label: "All Events", tab: "event-data" },
                { label: "Calendar & Schedule", tab: "calendar" },
              ]}
            />


            {/* 3. Clubs & Users Dropdown */}
            <AdminSidebarDropdown
              icon={Users}
              label="Clubs Management"
              collapsed={collapsed}
              items={[
                { label: "Clubs", tab: "club-heads" },
                { label: "Coordinators", tab: "coordinators" },

              ]}
            />

            {/* 4. Financial Operations Dropdown */}
            <AdminSidebarDropdown
              icon={Wallet}
              label="Financial Operations"
              collapsed={collapsed}
              items={[
                { label: "Transactions", tab: "payments-overview" },
                { label: "Payouts", tab: "payouts" },
              ]}
            />

            {/* 6. Communication Dropdown */}
            <AdminSidebarDropdown
              icon={Radio}
              label="Communication"
              collapsed={collapsed}
              items={[
                { label: "Broadcasts", tab: "broadcasts" },
                { label: "Notifications", tab: "notifications" },
              ]}
            />

            {/* 7. SYSTEM ADMIN Dropdown */}
            <AdminSidebarDropdown
              icon={Sliders}
              label="SYSTEM ADMIN"
              collapsed={collapsed}
              items={[
                { label: "Export Center", tab: "export-center" },
                { label: "Venues", tab: "venues" },
                { label: "Central Organizer", tab: "central-organizer" },
              ]}
            />
          </>
        )}

        {(role === "admin" || role === "paymentAdmin") && (
          <>
            <SectionDivider collapsed={collapsed} />
            {/* 8. Profile */}
            <AdminSidebarLink
              to="/admin-dashboard?tab=profile"
              icon={User}
              label="Profile"
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

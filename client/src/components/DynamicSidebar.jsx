import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  User,
  CalendarDays,
  Users,
  Wallet,
  Bell,
  LayoutGrid,
  Package,
  LogOut,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

/**
 * Returns a human-readable role label for display.
 */
const getRoleLabel = (role) => {
  const labels = {
    member: "Student",
    club: "Club Account",
    facultyCoordinator: "Faculty Coordinator",
    admin: "Administrator",
    paymentAdmin: "Payment Admin",
    lostFoundAdmin: "L&F Moderator",
  };
  return labels[role] || "User";
};

/**
 * Sidebar nav link component — reused for every link.
 */
const SidebarLink = ({ to, icon: Icon, label, isActive }) => (
  <Link
    to={to}
    className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-200 ${
      isActive
        ? "border border-orange-600 text-orange-600 "
        : "text-slate-700 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white"
    }`}
  >
    <Icon
      size={18}
      strokeWidth={isActive ? 2.2 : 1.8}
      className={`shrink-0 transition-colors duration-200 ${
        isActive ? "text-orange-600" : "text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white"
      }`}
    />
    <span className="truncate">{label}</span>
    {isActive && (
      <ChevronRight size={14} className="ml-auto text-orange-600 shrink-0" />
    )}
  </Link>
);

/**
 * Section header label inside the sidebar.
 */
const SectionLabel = ({ children }) => (
  <p className="px-3 mb-2 mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-400">
    {children}
  </p>
);

/**
 * Club name sub-header inside the Management section.
 */
const ClubHeader = ({ name }) => (
  <p className="px-3 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-white dark:bg-zinc-900 rounded-md">
    {name}
  </p>
);

const DynamicSidebar = ({ user }) => {
  const location = useLocation();
  const role = localStorage.getItem("role");
  const queryParams = new URLSearchParams(location.search);
  const currentTab = queryParams.get("tab");

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + "/");

  const userName = user?.name || "User";
  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="hidden md:flex flex-col w-64 shrink-0 bg-white dark:bg-[#0a0a0a] text-slate-900 dark:text-slate-300 border-r border-gray-200 dark:border-zinc-800 overflow-y-auto"
      style={{ height: "calc(100vh - 4rem)" }}
      aria-label="Dashboard sidebar"
    >
      {/* ── User Info ────────────────────────────────────────────────── */}
      <div className="px-5 pt-6 pb-4 border-b border-gray-300 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          {/* <div className="w-10 h-10 rounded-lg  flex items-center justify-center text-white text-sm font-bold shrink-0 select-none">
           <img src="nitjlogo.png" alt="" />
          </div> */}
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black dark:text-white truncate">
              {userName}
            </p>
            <p className="text-[11px] text-orange-600 font-medium tracking-wide">
              {getRoleLabel(role)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Navigation Links ─────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Dashboard navigation">

        {/* ── General (all users) ── */}
        <SectionLabel>General</SectionLabel>
        <SidebarLink to="/profile" icon={User} label="Profile" isActive={isActive("/profile")} />

        {/* ── Member: My Events ── */}
        {role === "member" && (
          <SidebarLink to="/my-events" icon={CalendarDays} label="My Events" isActive={isActive("/my-events")} />
        )}

        {/* ── Management: membership-based club links ── */}
        {((user?.memberships && user.memberships.length > 0) || role === "facultyCoordinator") && (
          <>
            <SectionLabel>Management</SectionLabel>

            {user?.memberships?.map((m) => (
              <div key={m.clubId} className="space-y-1 mb-3">
                <ClubHeader name={m.clubName} />

                {/* Club Events — shown for heads, coordinators, and members with specific permissions */}
                {(m.role === "CLUB_HEAD" || m.role === "COORDINATOR" || m.role === "facultyCoordinator" || m.canEditEvents || m.canCheckRegistration || m.canTakeAttendance || m.permissions?.canEditEvents || m.permissions?.canCheckRegistration || m.permissions?.canTakeAttendance) && (
                  <SidebarLink
                    to={`/club-events/${m.clubId}`}
                    icon={CalendarDays}
                    label="Club Events"
                    isActive={isActive(`/club-events/${m.clubId}`)}
                  />
                )}

                {/* Team Management — CLUB_HEAD or facultyCoordinator only */}
                {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                  <SidebarLink
                    to={`/club/${m.clubId}/team`}
                    icon={Users}
                    label="Team Management"
                    isActive={isActive(`/club/${m.clubId}/team`)}
                  />
                )}

                {/* Payments & Notifications — CLUB_HEAD or facultyCoordinator only */}
                {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                  <>
                    <SidebarLink
                      to="/payments"
                      icon={Wallet}
                      label="Payments"
                      isActive={isActive("/payments")}
                    />
                    <SidebarLink
                      to="/send-notification"
                      icon={Bell}
                      label="Notifications"
                      isActive={isActive("/send-notification")}
                    />
                  </>
                )}

                {/* Club Page — CLUB_HEAD or facultyCoordinator only */}
                {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                  <SidebarLink
                    to={`/club/edit/${m.clubId}`}
                    icon={LayoutGrid}
                    label="Club Page"
                    isActive={isActive(`/club/edit/${m.clubId}`)}
                  />
                )}
              </div>
            ))}

            {/* Faculty Coordinator fallback (if not in memberships) */}
            {role === "facultyCoordinator" && user?.clubId && (!user.memberships || !user.memberships.find((m) => m.clubId === user.clubId)) && (
              <div className="space-y-1 mb-3">
                <ClubHeader name="Faculty Review" />
                <SidebarLink
                  to="/my-events"
                  icon={CalendarDays}
                  label="Review Events"
                  isActive={isActive("/my-events")}
                />
                <SidebarLink
                  to={`/club/${user.clubId}/team`}
                  icon={Users}
                  label="Team Management"
                  isActive={isActive(`/club/${user.clubId}/team`)}
                />
                <SidebarLink
                  to={`/club/edit/${user.clubId}`}
                  icon={LayoutGrid}
                  label="Club Page"
                  isActive={isActive(`/club/edit/${user.clubId}`)}
                />
              </div>
            )}
          </>
        )}
      </nav>

      {/* ── Exit Dashboard ───────────────────────────────────────────── */}
      <div className="px-3 pb-5 pt-2 border-t border-gray-200 dark:border-zinc-800 mt-auto">
        <Link
          to="/"
          className="group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-400 hover:bg-red-500/10 hover:text-red-400 dark:hover:text-red-400 transition-all duration-200"
        >
          <LogOut
            size={18}
            strokeWidth={1.8}
            className="shrink-0 text-red-600 group-hover:text-red-400 transition-colors duration-200"
          />
          <span className="text-black dark:text-slate-300 group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors duration-200">Exit Dashboard</span>
        </Link>
      </div>
    </aside>
  );
};

export default DynamicSidebar;

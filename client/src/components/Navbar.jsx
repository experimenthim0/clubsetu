import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { BellIcon } from "./ui/bell";
import { UserIcon } from "./ui/user";
import { CalendarDaysIcon } from "./ui/calendar-days";
import { IndianRupeeIcon } from "./ui/indian-rupee";
import { SettingsIcon } from "./ui/settings";
import { ConciergeBellIcon } from "./ui/concierge-bell";
import { LogoutIcon } from "./ui/logout";
import { CalendarCogIcon } from "./ui/calendar-cog";
import { LayoutGridIcon } from "./ui/layout-grid";
const API_URL = import.meta.env.VITE_API_URL;


const Navbar = () => {
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
  const role = localStorage.getItem("role");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { notifications, unreadCount, setUnreadCount, setNotifications } = useSocket() || {};
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const notifDropdownRef = useRef(null);
  const notifMobileDropdownRef = useRef(null);

  const location = useLocation();
  const dropdownRef = useRef(null);

  // ── Scroll listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Close everything on route change ─────────────────────────────────────
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // ── Click-outside → close dropdown ───────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (
        notifDropdownRef.current && 
        !notifDropdownRef.current.contains(e.target) &&
        (!notifMobileDropdownRef.current || !notifMobileDropdownRef.current.contains(e.target))
      ) {
        setNotifDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNotificationClick = async () => {
    setNotifDropdownOpen(!notifDropdownOpen);
    if (!notifDropdownOpen && unreadCount > 0) {
      try {
        await axios.put(`${API_URL}/api/notifications/read-all`);
        setUnreadCount(0);
        setNotifications((prev) => prev.map(n => ({...n, readBy: [...(n.readBy || []), user._id || user.id]})));
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ── Escape key → close dropdown ──────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") setDropdownOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // ── Prevent body scroll when mobile menu open ─────────────────────────────
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    window.location.reload();
  };

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(path);

  const initials =
    user?.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  // ── Shared nav link style ─────────────────────────────────────────────────
  const navLinkCls = (path) =>
    `relative py-1 text-[14px] font-medium tracking-widest transition-all duration-300 group ${
      isActive(path) ? "text-orange-600" : "text-black hover:text-orange-600"
    }`;


    // format date and time
    const formatDate = (dateString) => {
  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return "Invalid Date";
  }

  const day = date.getDate();

  const month = date.toLocaleString('default', { month: 'short' });

  const year = date.getFullYear();

  const time = date.toLocaleString('default', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${time}, ${day} ${month} ${year} `;
};


  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 bg-white transition-shadow duration-200 myfont ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        {/* Orange top accent on scroll */}
        {/* {scrolled && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-orange-600 z-10 pointer-events-none" />
        )} */}

        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <div className="flex items-center sm:gap-5 gap-auto">
          <img src="nitjlogo.png" alt="" className="w-11 h-12"/>
          <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group logofont hidden sm:block " 
          >
            <span className="font-extrabold text-[24px] tracking-wider text-black leading-none select-none">
              Club<span className="text-orange-600">Setu</span>
            </span>
          </Link>
          </div>

           <Link
            to="/"
            className="flex items-center gap-2.5 shrink-0 group logofont sm:hidden block" 
          >
            <span className="font-extrabold text-[24px] tracking-wider text-black leading-none select-none">
              Club<span className="text-orange-600">Setu</span>
            </span>
          </Link>

          {/* ── Desktop center links ──────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-6 ">
            <Link to="/" className={navLinkCls("/")}>
              Home
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-orange-600 transform transition-transform duration-300 origin-left ${isActive("/") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
            <Link to="/clubs" className={navLinkCls("/clubs")}>
              Clubs
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-orange-600 transform transition-transform duration-300 origin-left ${isActive("/clubs") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
            <Link to="/events" className={navLinkCls("/events")}>
              Events
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-orange-600 transform transition-transform duration-300 origin-left ${isActive("/events") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
            <Link to="/team" className={navLinkCls("/team")}>
              Team
              <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-orange-600 transform transition-transform duration-300 origin-left ${isActive("/team") ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
            </Link>
          </div>

          {/* ── Desktop right actions ─────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-px h-6 bg-neutral-200" />

            {user ? (
              <>
                {/* Create Event — club only */}
                {(role === "club") && (
                  <Link
                    to="/create"
                    className="flex items-center gap-1.5 px-4 py-2  border-2 border-gray-400 text-black text-[11px] font-bold tracking-widest rounded-sm hover:bg-gray-400 hover:text-white hover:border-gray-400 transition-all duration-150 hover:-translate-y-px"
                  >
                    <i className="ri-add-line text-sm" />
                    Create Event
                  </Link>
                )}

                {/* ── Notification Bell (Members, Faculty, Clubs) ── */}
                {(role === "member" || role === "facultyCoordinator" || role === "club") && (
                  <div className="relative" ref={notifDropdownRef}>
                    <button
                      onClick={handleNotificationClick}
                      className="relative p-2 rounded-sm  border-transparent  hover:bg-neutral-200 transition-colors duration-150 cursor-pointer"
                    >
                     {/* <i className="ri-notification-3-line text-lg" /> */}
                     <BellIcon />
                      {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>
                      )}
                    </button>

                    {/* Notification Dropdown */}
                    {notifDropdownOpen && (
                      <div className="absolute top-[calc(100%+10px)] right-0 w-80 max-h-96 overflow-y-auto bg-white border-2 border-gray-200 rounded-sm z-50 mt-1">
                        <div className="px-4 py-3 border-b-2 border-gray-200 flex justify-between items-center bg-neutral-100 sticky top-0 z-10">
                          <h3 className="text-[14px] font-black  tracking-widest">Notifications</h3>
                        </div>
                        <div className="divide-y divide-neutral-100">
                          {notifications?.length > 0 ? (
                            notifications.slice(0, 4).map((notif, idx) => (
                              <div key={idx} className={`p-4 ${!notif.readBy?.includes(user?._id || user?.id) ? 'bg-orange-50' : ''}`}>
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] font-medium text-orange-600  tracking-widest">{notif.sender?.clubName || "ClubSetu"}</span>
                                  <span className="text-[10px] text-neutral-500 whitespace-nowrap">{formatDate(notif.createdAt)}</span>
                                </div>
                                <h4 className="text-[13px] font-bold text-black mb-1">{notif.title}</h4>
                                <p className="text-[12px] text-neutral-600">{notif.message}</p>
                              </div>
                            ))
                          ) : (
                            <div className="p-6 text-center text-neutral-500 text-[12px] font-bold uppercase tracking-widest">
                              No notifications yet
                            </div>
                          )}
                        </div>
                        <Link
                          to="/notifications"
                          onClick={() => setNotifDropdownOpen(false)}
                          className="block w-full py-1 text-center flex items-center justify-center gap-1 text-[13px] font-medium tracking-widest text-orange-600 border-t-2 border-gray-300 hover:bg-orange-50 transition-colors"
                        >
                          See all notifications
                          <i className="ri-arrow-right-line text-base text-orange-600 transition-transform duration-200" />
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Avatar dropdown ── */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm border-2 border-transparent hover:bg-gray-200 transition-colors duration-150 cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    {/* Avatar square */}
                    {/* <div className="w-8 h-8 border-2 border-black rounded-sm flex items-center justify-center text-black text-[11px] font-black shrink-0">
                      {initials}
                    </div> */}
                    <span className="text-[12px] font-bold text-black max-w-[80px] truncate hidden lg:block">
                      {user.name?.split(" ")[0]}
                    </span>
                    <i
                      className={`ri-arrow-down-s-line text-base text-neutral-500 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* ── Dropdown panel ── */}
                  {dropdownOpen && (
                    <div
                      className="absolute top-[calc(100%+10px)] right-0 w-52 bg-white border-2 border-gray-400 rounded-sm z-50 overflow-hidden mt-2"
                      role="menu"
                    >
                      {/* User header */}
                      <div className="px-4 pt-3 pb-2 border-b border-neutral-100">
                        <p className="text-[10px] font-bold tracking-widest text-neutral-400 mb-0.5">
                          Logged in as
                        </p>
                        <p className="text-[14px] font-black text-black truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] tracking-widest text-orange-600 font-medium mt-0.5">
                          {role === "club" ? "Club Account" : role === "facultyCoordinator" ? `Faculty Coordinator` : role === "admin" ? "Admin" : "Student"}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-black hover:bg-neutral-100 transition-colors"
                          role="menuitem"
                        >
                          <UserIcon size={18} /> Profile
                        </Link>

                        {role === "member" && (
                          <Link
                            to="/my-events"
                            className="flex items-center gap-2.5 px-4 py-2 text-[12px] text-black hover:bg-neutral-100 transition-colors"
                            role="menuitem"
                          >
                            <CalendarDaysIcon size={18} /> My Events
                          </Link>
                        )}

                        {((user.memberships && user.memberships.length > 0) || role === 'facultyCoordinator') && (
                          <div className="border-t border-neutral-100 mt-1 pt-1 text-black">
                            <p className="px-4 py-1 text-[9px] font-black uppercase tracking-widest text-neutral-400">Management</p>
                            
                            {/* Membership-based links (Clubs) */}
                            {user.memberships?.map((m) => (
                              <div key={m.clubId} className="pb-2 last:pb-0 border-b border-neutral-50 last:border-0">
                                <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50/40 mb-1">
                                  {m.clubName}
                                </p>
                                
                                {(m.role === "CLUB_HEAD" || m.role === "COORDINATOR" || m.role === "facultyCoordinator" || m.canEditEvents || m.canCheckRegistration || m.canTakeAttendance || m.permissions?.canEditEvents || m.permissions?.canCheckRegistration || m.permissions?.canTakeAttendance) && (
                                  <Link to={`/club-events/${m.clubId}`} className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                    <CalendarCogIcon size={16} className="text-neutral-500" /> Club Events
                                  </Link>
                                )}

                                {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                                  <Link to={`/club/${m.clubId}/team`} className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                    <UserIcon size={16} className="text-neutral-500" /> Team Management
                                  </Link>
                                )}

                                {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                                  <>
                                    <Link to="/payments" className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                      <IndianRupeeIcon size={16} className="text-neutral-500" /> Payments
                                    </Link>
                                    <Link to="/send-notification" className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                      <ConciergeBellIcon size={16} className="text-neutral-500" /> Notifications
                                    </Link>
                                  </>
                                )}

                                {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                                  <Link to={`/club/edit/${m.clubId}`} className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                    <LayoutGridIcon size={16} className="text-neutral-500" /> Club Page
                                  </Link>
                                )}
                              </div>
                            ))}

                            {/* Faculty Coordinator specific links (if not in memberships) */}
                            {role === 'facultyCoordinator' && user.clubId && (!user.memberships || !user.memberships.find(m => m.clubId === user.clubId)) && (
                              <div className="pb-2">
                                <p className="px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50/40 mb-1">
                                  Faculty Review
                                </p>
                                <Link to="/my-events" className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                  <CalendarCogIcon size={16} className="text-neutral-500" /> Review Events
                                </Link>
                                <Link to={`/club/${user.clubId}/team`} className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                  <UserIcon size={16} className="text-neutral-500" /> Team Management
                                </Link>
                                <Link to={`/club/edit/${user.clubId}`} className="flex items-center gap-2.5 px-4 py-1.5 text-[12px] text-black hover:bg-neutral-100 transition-colors">
                                  <LayoutGridIcon size={16} className="text-neutral-500" /> Club Page
                                </Link>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Divider + logout */}
                      <div className="border-t border-neutral-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[12px] font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          role="menuitem"
                        >
                          {/* <i className="ri-logout-box-r-line" /> */}
                          <LogoutIcon size={18} >
                            Logout
                          </LogoutIcon>
                           
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="relative py-1 text-[11px] font-bold  tracking-widest text-black group transition-colors hover:text-orange-600"
                >
                  Login
                  <span className="absolute bottom-0 left-0 w-full h-[2px] bg-orange-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </Link>
                <Link
                  to="/register/student"
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white border-2 border-black text-[11px] font-bold  tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all duration-150 hover:-translate-y-px"
                >
                  <i className="ri-user-add-line text-sm" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger ────────────────────────────────────────────────── */}
          <div className="md:hidden flex items-center gap-3">
            {user && (role === "member" || role === "facultyCoordinator" || role === "club") && (
              <div className="relative" ref={notifMobileDropdownRef}>
                <button
                  onClick={handleNotificationClick}
                  className="relative p-1.5 rounded-sm border-2 border-transparent hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
                >
                  <BellIcon size={22} className="text-black" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white"></span>
                  )}
                </button>

                {/* Mobile Notification Dropdown */}
                {notifDropdownOpen && (
                  <div className="fixed top-16 left-5 right-5 max-h-96 overflow-y-auto bg-white border-2 border-gray-200 rounded-sm z-50">
                    <div className="px-4 py-3 border-b-2 border-gray-200 flex justify-between items-center bg-neutral-100 sticky top-0 z-10">
                      <h3 className="text-[14px] font-black  tracking-widest text-black">Notifications</h3>
                    </div>
                    <div className="divide-y divide-neutral-100">
                      {notifications?.length > 0 ? (
                        notifications.slice(0, 4).map((notif, idx) => (
                          <div key={idx} className={`p-4 ${!notif.readBy?.includes(user?._id || user?.id) ? 'bg-orange-50' : ''}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-[10px] font-medium text-orange-600 tracking-widest">{notif.sender?.clubName || "ClubSetu"}</span>
                              <span className="text-[10px] text-neutral-500 whitespace-nowrap">{formatDate(notif.createdAt) } </span>
                            </div>
                            <h4 className="text-[13px] font-bold text-black mb-1">{notif.title}</h4>
                            <p className="text-[12px] text-neutral-600">{notif.message}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-neutral-500 text-[12px] font-bold  tracking-widest">
                          No notifications yet
                        </div>
                      )}
                    </div>
                    <Link
                      to="/notifications"
                      onClick={() => {
                        setNotifDropdownOpen(false);
                        setMobileOpen(false);
                      }}
                      className="block w-full py-1 text-center flex items-center justify-center gap-1 text-[13px] font-medium  tracking-widest text-orange-600 border-t-2 border-gray-200 bg-neutral-100 hover:bg-orange-50 transition-colors"
                    >
                      See all notifications
                      <i className="ri-arrow-right-line text-base text-orange-600 transition-transform duration-200" />
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="w-10 h-10 flex items-center justify-center rounded-sm bg-white hover:bg-neutral-100 transition-colors text-black text-xl cursor-pointer shrink-0"
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              <i className={mobileOpen ? "ri-close-line" : "ri-menu-3-line"} />
            </button>
          </div>

        </div>

        {/* ── Mobile drawer ──────────────────────────────────────────────── */}
        <div
          className={`md:hidden border-t-2 border-black bg-white overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 pt-4 pb-2 flex flex-col gap-0">
            {/* User card */}
            {user && (
              <div className="flex items-center gap-3 pb-2 mb-1 border-b-2 border-black">
                <div>
                  <p className="font-black text-[13px] text-black leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[9px] uppercase tracking-widest text-orange-600 font-medium mt-0.5">
                    {role === "club" ? "Club Account" : role === "facultyCoordinator" ? `Faculty Coordinator - ${user.clubName}` : role === "admin" ? "Admin" : "Student"}
                  </p>
                </div>
              </div>
            )}

            {/* Nav links */}
           
<nav className="flex flex-col gap-1 mb-3">


  {/* 2-column grid for nav links */}
  <div className="grid grid-cols-2 gap-1">
    {[
      { to: "/", label: "Home" },
      { to: "/events", label: "Events" },
      { to: "/clubs", label: "Clubs" },
      { to: "/#team", label: "Team", isHash: true },
      ...(user ? [
        { to: "/profile", label: "Profile" },
        { to: "/notifications", label: "Notifications" },
        { to: "/my-events", label: role === "club" ? "Club Events" : role === "facultyCoordinator" ? "Review Events" : "My Events" },
        ...(role === "club" ? [
          { to: "/payments", label: "Payments" },
          { to: "/send-notification", label: "Notify" }
        ] : [])
      ] : []),
    ].map(({ to, label, isHash }) =>
      isHash ? (
        <a key={to} href={to} onClick={() => setMobileOpen(false)}
          className="py-2 px-2.5 text-[13px] font-medium rounded-sm border border-neutral-200 text-black hover:text-orange-600 hover:border-orange-300 hover:bg-orange-50 transition-all">
          {label}
        </a>
      ) : (
        <Link key={to} to={to} onClick={() => setMobileOpen(false)}
          className={`py-2 px-2.5 text-[13px] font-medium rounded-sm border transition-all
            ${isActive(to)
              ? "text-orange-600 bg-orange-50 border-orange-300 border-l-[3px]"
              : "text-black border-neutral-200 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-300"
            }`}>
          {label}
        </Link>
      )
    )}
  </div>
</nav>

{/* Action buttons */}
<div className="border-t border-neutral-100 pt-3 flex flex-col gap-1.5">
  {user ? (
    <>
      {role === "club" && (
        <Link to="/create"
          className="flex items-center justify-center gap-1.5 py-2 bg-black border-2 border-black text-white font-black text-[13px] tracking-widest rounded-sm hover:bg-black/70 hover:text-white hover:border-black transition-all">
          <i className="ri-add-line" /> Create Event
        </Link>
      )}
      <div className="grid grid-cols-2 gap-1.5">
        {role === "club" && (
          <Link to={`/club/edit/${user.clubId}`}
            className="flex items-center justify-center gap-1 py-2.5 bg-white border border-neutral-200 text-black font-semibold text-[11px] tracking-wide rounded-sm hover:bg-neutral-100 transition-colors text-center">
            <i className="ri-settings-4-line text-[13px]" /> Manage Club
          </Link>
        )}
        <button onClick={handleLogout}
          className={`flex items-center justify-center gap-1 py-2 bg-[#ff0000] border border-neutral-200 text-white font-semibold text-[13px] tracking-wide rounded-sm hover:bg-red-600 hover:cursor-pointer transition-colors ${role === "club" ? "" : "col-span-2"}`}>
          <i className="ri-logout-box-r-line text-[13px]" /> Logout
        </button>
      </div>
    </>
  ) : (
    <div className="grid grid-cols-2 gap-1.5">
      <Link to="/login"
        className="flex items-center justify-center py-2.5 bg-white border border-neutral-300 text-black font-bold text-[11px] uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors">
        Login
      </Link>
      <Link to="/register"
        className="flex items-center justify-center gap-1 py-2.5 bg-black border-2 border-black text-white font-bold text-[11px] uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all">
        <i className="ri-user-add-line" /> Register
      </Link>
    </div>
  )}
</div>







          </div>
        </div>
      </nav>

      {/* ── Mobile backdrop (closes drawer on outside tap) ──────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Navbar;

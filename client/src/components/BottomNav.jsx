import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Users, Calendar, User, ShieldCheck, X, Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import { CalendarDaysIcon } from "./ui/calendar-days";
import { IndianRupeeIcon } from "./ui/indian-rupee";
import { ConciergeBellIcon } from "./ui/concierge-bell";
import { LogoutIcon } from "./ui/logout";
import { CalendarCogIcon } from "./ui/calendar-cog";
import { LayoutGridIcon } from "./ui/layout-grid";
import LogInIcon from "./ui/login";

const BottomNav = () => {
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);
  const { isDark, toggleTheme } = useTheme();

  // Parse user from local storage
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
  }
  const role = localStorage.getItem("role");

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Click-outside to close drawer
  useEffect(() => {
    const handler = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        setDrawerOpen(false);
      }
    };
    if (drawerOpen) {
      document.addEventListener("mousedown", handler);
    }
    return () => document.removeEventListener("mousedown", handler);
  }, [drawerOpen]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const API_URL = import.meta.env.VITE_API_URL;
  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("admin");
    localStorage.removeItem("role");
    localStorage.removeItem("token");
    // Clear the server-set httpOnly cookie by calling logout endpoint
    axios.post(`${API_URL}/api/auth/logout`).catch(() => {});
    // Also clear cookie client-side as fallback
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/";
  };

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { label: "Home", icon: Home, path: "/" },
    { label: "Clubs", icon: Users, path: "/clubs" },
    { label: "Events", icon: Calendar, path: "/events" },
    user
      ? { label: "Profile", icon: User, action: () => setDrawerOpen(true), isActiveCheck: drawerOpen }
      : { label: "Login", icon: LogInIcon, path: "/login" },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 z-50 w-full pb-[env(safe-area-inset-bottom)] bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const active = item.isActiveCheck !== undefined ? item.isActiveCheck : isActive(item.path);

            const content = (
              <div className="flex flex-col items-center justify-center w-full h-full space-y-1 relative pt-1">
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-orange-600 rounded-b-md transition-all duration-300" />
                )}
                <div
                  className={`p-1.5 rounded-full transition-transform duration-300 ${
                    active ? "scale-110 text-orange-600 bg-orange-50" : "text-neutral-500 hover:text-orange-500"
                  }`}
                >
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide transition-colors duration-300 ${
                    active ? "text-orange-600" : "text-neutral-500"
                  }`}
                >
                  {item.label}
                </span>
              </div>
            );

            if (item.action) {
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex-1 flex justify-center items-center h-full focus:outline-none"
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={index}
                to={item.path}
                className="flex-1 flex justify-center items-center h-full focus:outline-none"
              >
                {content}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Slide-up Drawer for Profile */}
      {user && (
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
              drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div
            ref={drawerRef}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl border-t border-gray-200 transition-transform duration-300 ease-in-out md:hidden pb-[env(safe-area-inset-bottom)] max-h-[85vh] flex flex-col ${
              drawerOpen ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Drawer Handle */}
            <div className="w-full flex justify-center pt-3 pb-2" onClick={() => setDrawerOpen(false)}>
              <div className="w-12 h-1.5 bg-neutral-300 rounded-full" />
            </div>

            <div className="flex justify-between items-center px-6 pb-4 border-b border-neutral-100">
              <div>
                <p className="text-[11px] font-bold tracking-widest text-neutral-400 mb-0.5">Logged in as</p>
                <p className="text-base font-black text-black">{user.name}</p>
                <p className="text-[11px] tracking-widest text-orange-600 font-bold mt-0.5">
                  {role === "club"
                    ? "Club Account"
                    : role === "facultyCoordinator"
                    ? "Faculty Coordinator"
                    : role === "admin"
                    ? "Admin"
                    : "Student"}
                </p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto px-2 py-2 flex-1">
              <Link to="/profile" className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <User size={18} />
                </div>
                My Profile
              </Link>

              {role === "member" && (
                <Link to="/my-events" className="flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                   <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                     <CalendarDaysIcon size={18} />
                   </div>
                   My Events
                </Link>
              )}

              {((user.memberships && user.memberships.length > 0) || role === "facultyCoordinator") && (
                <div className="mt-2 pt-2 border-t border-neutral-100">
                  <p className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    Management
                  </p>

                  {user.memberships?.map((m) => (
                    <div key={m.clubId} className="mb-4 last:mb-0">
                      <p className="px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-orange-600 bg-orange-50/50 mb-2">
                        {m.clubName}
                      </p>

                      {(m.role === "CLUB_HEAD" || m.role === "COORDINATOR" || m.role === "facultyCoordinator" || m.canEditEvents || m.canCheckRegistration || m.canTakeAttendance || m.permissions?.canEditEvents || m.permissions?.canCheckRegistration || m.permissions?.canTakeAttendance) && (
                        <Link to={`/club-events/${m.clubId}`} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                            <CalendarCogIcon size={18} />
                          </div>
                          Club Events
                        </Link>
                      )}

                      {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                        <Link to={`/club/${m.clubId}/team`} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                          <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                            <User size={18} />
                          </div>
                          Team Management
                        </Link>
                      )}

                      {(m.role === "CLUB_HEAD" || m.role === "facultyCoordinator") && (
                        <>
                          <Link to="/payments" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                              <IndianRupeeIcon size={18} />
                            </div>
                            Payments
                          </Link>
                          <Link to="/send-notification" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                            <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                              <ConciergeBellIcon size={18} />
                            </div>
                            Notifications
                          </Link>
                          <Link to={`/club/edit/${m.clubId}`} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                              <LayoutGridIcon size={18} />
                            </div>
                            Club Page
                          </Link>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Faculty Coordinator specific links */}
                  {role === "facultyCoordinator" && user.clubId && (!user.memberships || !user.memberships.find((m) => m.clubId === user.clubId)) && (
                    <div className="mb-4">
                      <p className="px-4 py-1.5 text-[11px] font-black uppercase tracking-widest text-orange-600 bg-orange-50/50 mb-2">
                        Faculty Review
                      </p>
                      <Link to="/my-events" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                          <CalendarCogIcon size={18} />
                        </div>
                        Review Events
                      </Link>
                      <Link to={`/club/${user.clubId}/team`} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                          <User size={18} />
                        </div>
                        Team Management
                      </Link>
                      <Link to={`/club/edit/${user.clubId}`} className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-black hover:bg-neutral-50 rounded-lg transition-colors">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600">
                          <LayoutGridIcon size={18} />
                        </div>
                        Club Page
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
              {/* Dark mode toggle */}
              <button
                onClick={() => {
                  document.documentElement.classList.add('dark-transition');
                  toggleTheme();
                  setTimeout(() => document.documentElement.classList.remove('dark-transition'), 400);
                }}
                className="w-full flex items-center justify-between py-3 px-4 mb-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-black">
                  {isDark ? <Sun size={18} /> : <Moon size={18} />}
                  {isDark ? 'Light Mode' : 'Dark Mode'}
                </span>
                <div className={`w-10 h-6 rounded-full relative transition-colors duration-200 ${isDark ? 'bg-orange-600' : 'bg-neutral-300'}`}>
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-1'}`} />
                </div>
              </button>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 font-bold text-sm rounded-xl hover:bg-red-100 transition-colors"
              >
                <LogoutIcon size={18} />
                Logout
              </button>
              <p className="text-center text-[10px] text-neutral-500 font-medium mt-2">Club<span className='text-orange-600 font-bold'>Setu</span> | Developed By Team Xplore </p>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default BottomNav;

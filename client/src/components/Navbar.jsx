import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";


const Navbar = () => {
  let user = null;
  try {
    const storedUser = localStorage.getItem("user");
    if (storedUser && storedUser !== "undefined") {
      user = JSON.parse(storedUser);
    }
  } catch (err) {
    console.error("Error parsing user from local storage", err);
    localStorage.removeItem("user");
  }
  const role = localStorage.getItem("role");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

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
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    `px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-widest border-2 rounded-sm transition-colors duration-150 ${
      isActive(path)
        ? "border-black bg-neutral-100 text-black"
        : "border-transparent text-black hover:border-black hover:bg-neutral-100"
    }`;

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav
        className={`sticky top-0 z-50 bg-white border-b-2 border-black transition-shadow duration-200 myfont ${
          scrolled ? "shadow-sm" : ""
        }`}
      >
        {/* Orange top accent on scroll */}
        {scrolled && (
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-orange-600 z-10 pointer-events-none" />
        )}

        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* ── Logo ─────────────────────────────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 flex-shrink-0 group"
          >
            <span className="font-extrabold text-[24px] tracking-tight text-black leading-none select-none">
              Club<span className="text-orange-600">Setu</span>
            </span>
          </Link>

          {/* ── Desktop center links ──────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/" className={navLinkCls("/")}>
              Home
            </Link>
            <Link to="/events" className={navLinkCls("/events")}>
              Events
            </Link>
            <Link to="/clubs" className={navLinkCls("/clubs")}>
              Clubs
            </Link>
          </div>

          {/* ── Desktop right actions ─────────────────────────────────────── */}
          <div className="hidden md:flex items-center gap-2">
            <div className="w-px h-6 bg-neutral-200" />

            {user ? (
              <>
                {/* Create Event — club heads only */}
                {role === "club-head" && (
                  <Link
                    to="/create"
                    className="flex items-center gap-1.5 px-4 py-2 bg-yellow-400 border-2 border-black text-black text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all duration-150 hover:-translate-y-px"
                  >
                    <i className="ri-add-line text-sm" />
                    Create Event
                  </Link>
                )}

                {/* Avatar dropdown ── */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-sm border-2 border-transparent hover:border-black hover:bg-neutral-100 transition-colors duration-150 cursor-pointer"
                    aria-haspopup="true"
                    aria-expanded={dropdownOpen}
                  >
                    {/* Avatar square */}
                    <div className="w-8 h-8 bg-orange-600 border-2 border-black rounded-sm flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                      {initials}
                    </div>
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
                      className="absolute top-[calc(100%+10px)] right-0 w-52 bg-white border-2 border-black rounded-sm shadow-[4px_4px_0px_#0D0D0D] z-50 overflow-hidden"
                      role="menu"
                    >
                      {/* User header */}
                      <div className="px-4 pt-3 pb-2 border-b border-neutral-100">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
                          Logged in as
                        </p>
                        <p className="text-[14px] font-black text-black truncate">
                          {user.name}
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold mt-0.5">
                          {role === "club-head" ? "Club Head" : "Student"}
                        </p>
                      </div>

                      {/* Menu items */}
                      <div className="py-1">
                        <Link
                          to="/profile"
                          className="flex items-center gap-2.5 px-4 py-2.5 text-[12px] font-bold text-black hover:bg-neutral-100 transition-colors"
                          role="menuitem"
                        >
                          <i className="ri-user-line text-orange-600" /> My
                          Profile
                        </Link>

                        {role === "student" && (
                          <Link
                            to="/my-events"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-bold text-black hover:bg-neutral-100 transition-colors"
                            role="menuitem"
                          >
                            <i className="ri-calendar-check-line text-orange-600" />{" "}
                            My Events
                          </Link>
                        )}

                        {role === "club-head" && (
                          <Link
                            to="/my-events"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-bold text-black hover:bg-neutral-100 transition-colors"
                            role="menuitem"
                          >
                            <i className="ri-calendar-event-line text-orange-600" />{" "}
                            Created Events
                          </Link>
                        )}
                        {role === "club-head" && (
                          <Link
                            to="/payments"
                            className="flex items-center gap-2.5 px-4 py-2.5 text-[14px] font-bold text-black hover:bg-neutral-100 transition-colors"
                            role="menuitem"
                          >
                         
                            <i className="ri-money-dollar-circle-line text-orange-600"/>Payments
                            
                          </Link>
                        )}
                      </div>

                      {/* Divider + logout */}
                      <div className="border-t border-neutral-100">
                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-[12px] font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          role="menuitem"
                        >
                          <i className="ri-logout-box-r-line" /> Logout
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
                  className="px-3.5 py-2 text-[11px] font-bold uppercase tracking-widest text-black border-2 border-transparent hover:border-black rounded-sm transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="flex items-center gap-1.5 px-4 py-2 bg-black text-white border-2 border-black text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all duration-150 hover:-translate-y-px"
                >
                  <i className="ri-user-add-line text-sm" />
                  Register
                </Link>
              </>
            )}
          </div>

          {/* ── Hamburger ────────────────────────────────────────────────── */}
          <button
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-black rounded-sm bg-white hover:bg-neutral-100 transition-colors text-black text-xl cursor-pointer flex-shrink-0"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <i className={mobileOpen ? "ri-close-line" : "ri-menu-3-line"} />
          </button>
        </div>

        {/* ── Mobile drawer ──────────────────────────────────────────────── */}
        <div
          className={`md:hidden border-t-2 border-black bg-white overflow-hidden transition-all duration-300 ease-in-out ${
            mobileOpen ? "max-h-screen opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 pt-4 pb-6 flex flex-col gap-0">
            {/* User card */}
            {user && (
              <div className="flex items-center gap-3 pb-4 mb-1 border-b-2 border-black">
                <div className="w-11 h-11 bg-orange-600 border-2 border-black rounded-sm flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {initials}
                </div>
                <div>
                  <p className="font-black text-[15px] text-black leading-tight">
                    {user.name}
                  </p>
                  <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold mt-0.5">
                    {role === "club-head" ? "Club Head" : "Student"}
                  </p>
                </div>
              </div>
            )}

            {/* Nav links */}
            <nav className="flex flex-col">
              {[
                { to: "/", label: "Home" },
                { to: "/events", label: "Events" },
                { to: "/clubs", label: "Clubs" },
                ...(user
                  ? [
                      { to: "/profile", label: "Profile" },
                      { to: "/my-events", label: "My Events" },
                    ]
                  : []),
              ].map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`py-4 border-b border-neutral-100 text-[20px] font-black tracking-tight transition-all duration-150 ${
                    isActive(to)
                      ? "text-orange-600 pl-2"
                      : "text-black hover:text-orange-600 hover:pl-2"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>

            {/* Action buttons */}
            <div className="flex flex-col gap-2.5 mt-5">
              {user ? (
                <>
                  {role === "club-head" && (
                    <Link
                      to="/create"
                      className="flex items-center justify-center gap-2 py-3.5 bg-yellow-400 border-2 border-black text-black font-bold text-[12px] uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all"
                    >
                      <i className="ri-add-line" /> Create Event
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 py-3.5 bg-white border-2 border-black text-black font-bold text-[12px] uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors cursor-pointer w-full"
                  >
                    <i className="ri-logout-box-r-line" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="flex items-center justify-center gap-2 py-3.5 bg-black border-2 border-black text-white font-bold text-[12px] uppercase tracking-widest rounded-sm hover:bg-orange-600 hover:border-orange-600 transition-all"
                  >
                    <i className="ri-user-add-line" /> Register
                  </Link>
                  <Link
                    to="/login"
                    className="flex items-center justify-center py-3.5 bg-white border-2 border-black text-black font-bold text-[12px] uppercase tracking-widest rounded-sm hover:bg-neutral-100 transition-colors"
                  >
                    Login
                  </Link>
                </>
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

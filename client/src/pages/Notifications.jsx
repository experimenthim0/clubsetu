import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Link } from "react-router-dom";
import { BellIcon } from "../components/ui/bell";

const API_URL = import.meta.env.VITE_API_URL;

const Notifications = () => {
  const { notifications, unreadCount, setUnreadCount, setNotifications } =
    useSocket() || {};
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = "Notifications - CampusNode";
  }, []);

  const userString = localStorage.getItem("user");
  const user =
    userString && userString !== "undefined" ? JSON.parse(userString) : null;

  const handleMarkAllAsRead = async () => {
    if (unreadCount === 0) return;
    setLoading(true);
    try {
      await axios.put(`${API_URL}/api/notifications/read-all`);
      setUnreadCount(0);
      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          readBy: [...(n.readBy || []), user._id || user.id],
        }))
      );
    } catch (err) {
      console.error("Failed to mark all as read", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === id
            ? { ...n, readBy: [...(n.readBy || []), user._id || user.id] }
            : n
        )
      );
      const newUnread = notifications.filter(
        (n) =>
          n._id !== id && !n.readBy?.includes(user._id || user.id)
      ).length;
      setUnreadCount(newUnread);
    } catch (err) {
      console.error("Failed to mark notification as read", err);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      
      {/* ── Custom styling ── */}
      <style>{`
        .code-font { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
        .radar-pulse {
          animation: pulse-ring 1.8s cubic-bezier(0.24, 0, 0.38, 1) infinite;
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0.4; }
          100% { transform: scale(1.4); opacity: 0; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-12">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/30 flex items-center justify-center text-orange-600">
                    <BellIcon size={20} />
                  </div>
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="radar-pulse absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-600" />
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-black tracking-tight text-black dark:text-white leading-none">
                  Notifications
                </h1>
                
                {unreadCount > 0 && (
                  <span className="code-font text-[9px] font-black uppercase tracking-widest bg-orange-600 text-white px-2 py-1.5 rounded-lg flex-shrink-0">
                    {unreadCount} UNREAD
                  </span>
                )}
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm ml-[calc(40px+0.75rem)]">
                Updates and logs from clubs, event organizers, and system administration.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white dark:bg-neutral-900 text-black dark:text-white border-2 border-neutral-200 dark:border-neutral-800 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:border-orange-600 dark:hover:border-orange-600 transition-all cursor-pointer disabled:opacity-60 shrink-0 shadow-sm"
              >
                {loading ? (
                  <i className="ri-loader-4-line animate-spin text-sm" />
                ) : (
                  <i className="ri-check-double-line text-sm" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mt-8 h-px bg-neutral-200 dark:bg-neutral-850 w-full" />
        </div>

        {/* ── Notification List ── */}
        {notifications?.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif, index) => {
              const isRead = notif.readBy?.includes(user?._id || user?.id);
              return (
                <div
                  key={notif._id}
                  className={`group relative bg-white dark:bg-neutral-900 border-2 rounded-2xl transition-all duration-300 overflow-hidden shadow-sm
                    ${!isRead
                      ? "border-orange-500/80 dark:border-orange-500/60 shadow-[4px_4px_0px_0px_rgba(234,88,12,0.1)]"
                      : "border-neutral-200 dark:border-neutral-850 hover:border-neutral-350 dark:hover:border-neutral-800"
                    }`}
                >
                  <div className="p-5 flex items-start gap-4">
                    
                    {/* Read status column icon */}
                    <div className="shrink-0 pt-0.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                        !isRead 
                          ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30 text-orange-600' 
                          : 'bg-neutral-50 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-850 text-neutral-400'
                      }`}>
                        <i className={`text-base ${!isRead ? 'ri-notification-3-fill animate-swing' : 'ri-notification-3-line'}`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      
                      {/* Top Meta info row */}
                      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`code-font text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                            !isRead
                              ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600 border border-orange-200/50'
                              : 'bg-neutral-100 dark:bg-neutral-850 text-neutral-400 border border-neutral-200/40 dark:border-neutral-800/40'
                          }`}>
                            {notif.sender?.clubName || "CampusNode"}
                          </span>
                          {!isRead && (
                            <span className="flex h-2 w-2 relative">
                              <span className="radar-pulse absolute inline-flex h-full w-full rounded-full bg-orange-600 opacity-75" />
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
                            </span>
                          )}
                        </div>
                        <span className="code-font text-[10px] font-medium text-neutral-400">
                          {formatDate(notif.createdAt)}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className={`text-sm sm:text-base font-bold leading-snug mb-1.5 transition-colors ${
                        !isRead ? 'text-black dark:text-white' : 'text-neutral-700 dark:text-neutral-300'
                      }`}>
                        {notif.title}
                      </h3>

                      {/* Message body */}
                      <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-words">
                        {notif.message}
                      </p>

                      {/* Action buttons */}
                      {(notif.eventId || !isRead) && (
                        <div className="mt-4 flex flex-wrap gap-3">
                          {notif.eventId && (
                            <Link
                              to={`/event/${notif.eventId}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-orange-600 hover:text-white dark:hover:bg-orange-600 text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                              <i className="ri-external-link-line text-sm" /> View Event
                            </Link>
                          )}
                          {!isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notif._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-neutral-250 dark:border-neutral-800 text-neutral-400 hover:text-black dark:hover:text-white hover:border-neutral-350 transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Mark as read
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          
          /* ── Empty State ── */
          <div className="bg-white dark:bg-neutral-900 border-2 border-dashed border-neutral-200 dark:border-neutral-850 rounded-2xl py-16 flex flex-col items-center gap-5 text-center px-6">
            <div className="w-14 h-14 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-850 rounded-2xl flex items-center justify-center text-neutral-300 dark:text-neutral-700">
              <BellIcon size={24} />
            </div>
            <div>
              <p className="text-base font-black text-black dark:text-white tracking-tight">
                System Status: Checked & Clear
              </p>
              <p className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 mt-1.5 leading-relaxed max-w-xs mx-auto">
                You are completely up to date. No new event alerts or system logs were found.
              </p>
            </div>
            <Link
              to="/"
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black text-[11px] font-bold uppercase tracking-widest rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white dark:hover:text-white transition-colors cursor-pointer"
            >
              Go to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
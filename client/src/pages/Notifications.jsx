import React, { useState } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Link } from "react-router-dom";
import { BellIcon } from "../components/ui/bell";

const API_URL = import.meta.env.VITE_API_URL;

const Notifications = () => {
  const { notifications, unreadCount, setUnreadCount, setNotifications } =
    useSocket() || {};
  const [loading, setLoading] = useState(false);

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
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  };

  return (
    <div className="min-h-screen bg-gray-50 myfont">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <BellIcon size={22} className="text-orange-600 flex-shrink-0" />
                <h1 className="text-3xl font-black tracking-tight text-black leading-none">
                  Notifications
                </h1>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-orange-600 text-white px-2 py-0.5 rounded-sm flex-shrink-0">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-neutral-500 text-sm ml-[calc(22px+0.75rem)]">
                Stay updated with the latest alerts and club activities.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors duration-150 disabled:opacity-60 flex-shrink-0"
              >
                {loading ? (
                  <i className="ri-loader-4-line animate-spin text-base" />
                ) : (
                  <i className="ri-check-double-line text-base" />
                )}
                Mark all read
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="mt-6 h-0.5 bg-black" />
        </div>

        {/* ── Notification List ── */}
        {notifications?.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif, index) => {
              const isRead = notif.readBy?.includes(user?._id || user?.id);
              return (
                <div
                  key={notif._id}
                  className={`group relative bg-white border-2 rounded-sm transition-all duration-150
                    ${!isRead
                      ? "border-orange-400 shadow-[3px_3px_0px_0px_rgba(234,88,12,0.15)]"
                      : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  {/* Unread accent bar */}
                  {!isRead && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-orange-600 rounded-l-sm" />
                  )}

                  <div className={`p-5 ${!isRead ? "pl-6" : ""}`}>
                    {/* Top row */}
                    <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-medium  tracking-widest text-orange-600  py-0.5 rounded-sm">
                          {notif.sender?.clubName || "ClubSetu"}
                        </span>
                        {!isRead && (
                          <span className="flex h-2 w-2">
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-600" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-semibold text-neutral-400 flex-shrink-0">
                        {formatDate(notif.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      className={`font-black leading-snug mb-1.5 text-[15px]
                        ${!isRead ? "text-black" : "text-neutral-700"}`}
                    >
                      {notif.title}
                    </h3>

                    {/* Message */}
                    <p className="text-[13px] text-neutral-500 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Actions */}
                    {(notif.eventId || !isRead) && (
                      <div className="mt-4 flex items-center gap-5">
                        {notif.eventId && (
                          <Link
                            to={`/event/${notif.eventId}`}
                            className="text-[11px] font-bold uppercase tracking-widest text-black border-b border-black hover:text-orange-600 hover:border-orange-600 transition-all pb-0.5"
                          >
                            View Event →
                          </Link>
                        )}
                        {!isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 hover:text-black transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ── Empty State ── */
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-sm py-20 flex flex-col items-center gap-4 text-center">
            <div className="w-14 h-14 bg-gray-50 border-2 border-gray-200 rounded-full flex items-center justify-center">
              <BellIcon size={24} className="text-neutral-300" />
            </div>
            <div>
              <p className="text-base font-black text-black tracking-tight">
                You're all caught up
              </p>
              <p className="text-sm text-neutral-400 mt-1 font-medium">
                No notifications yet. Check back later.
              </p>
            </div>
            <Link
              to="/"
              className="mt-2 px-6 py-2.5 bg-black text-white text-[11px] font-bold uppercase tracking-widest rounded-sm hover:bg-orange-600 transition-colors duration-150"
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
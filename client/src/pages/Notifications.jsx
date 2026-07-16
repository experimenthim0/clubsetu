import React, { useState, useEffect } from "react";
import { useSocket } from "../context/SocketContext";
import axios from "axios";
import { Link } from "react-router-dom";
import { useNotification } from "../context/NotificationContext";

const API_URL = import.meta.env.VITE_API_URL;

const formatRelativeTime = (dateStr) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  if (diffDay === 1) return "Yesterday";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

const Notifications = () => {
  const { notifications, unreadCount, setUnreadCount, setNotifications } =
    useSocket() || {};
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  const handleAcceptInvite = async (notifId) => {
    if (actionLoading[notifId]) return;
    setActionLoading(prev => ({ ...prev, [notifId]: 'accept' }));
    try {
      const res = await axios.post(`${API_URL}/api/teams/invitations/${notifId}/accept`);
      showNotification(res.data.message || 'Invitation accepted successfully!', 'success');
      const notifsRes = await axios.get(`${API_URL}/api/notifications`);
      setNotifications(notifsRes.data);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to accept invitation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [notifId]: null }));
    }
  };

  const handleDeclineInvite = async (notifId) => {
    if (actionLoading[notifId]) return;
    setActionLoading(prev => ({ ...prev, [notifId]: 'decline' }));
    try {
      const res = await axios.post(`${API_URL}/api/teams/invitations/${notifId}/decline`);
      showNotification(res.data.message || 'Invitation declined.', 'success');
      const notifsRes = await axios.get(`${API_URL}/api/notifications`);
      setNotifications(notifsRes.data);
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to decline invitation', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [notifId]: null }));
    }
  };

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

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0a0a0a] transition-colors duration-300">
      <div className="max-w-3xl mx-auto px-5 md:px-6 py-10 md:py-12">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-orange-600 font-semibold mt-1">
                  {unreadCount} unread
                </p>
              )}
              <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">
                Updates from clubs, event organizers, and system.
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-neutral-900 text-black dark:text-white border border-neutral-200 dark:border-neutral-800 rounded-xl text-xs font-semibold hover:border-orange-500 dark:hover:border-orange-500 transition-all cursor-pointer disabled:opacity-60 shrink-0"
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

          <div className="mt-6 h-px bg-neutral-200 dark:bg-neutral-800 w-full" />
        </div>

        {/* Notification List */}
        {notifications?.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => {
              const isRead = notif.readBy?.includes(user?._id || user?.id);
              return (
                <div
                  key={notif._id}
                  className={`relative bg-white dark:bg-neutral-900 border rounded-xl transition-all duration-200 overflow-hidden
                    ${!isRead
                      ? "border-orange-200 dark:border-orange-900/40 bg-orange-50/50 dark:bg-orange-950/10"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                    }`}
                >
                  <div className="p-5 md:p-6">
                    {/* Top row: sender + time */}
                    <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                          {notif.sender?.clubName || "CampusNode"}
                        </span>
                        {!isRead && (
                          <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                        )}
                      </div>
                      <span
                        className="text-[11px] font-medium text-neutral-400"
                        title={new Date(notif.createdAt).toLocaleString()}
                      >
                        {formatRelativeTime(notif.createdAt)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={`text-sm sm:text-base font-bold leading-snug mb-1.5 ${
                      !isRead ? "text-black dark:text-white" : "text-neutral-700 dark:text-neutral-300"
                    }`}>
                      {notif.title}
                    </h3>

                    {/* Message */}
                    <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed break-words">
                      {notif.message}
                    </p>

                    {/* Actions */}
                    {notif.type === "TEAM_INVITATION" && notif.title === "Team Invitation" ? (
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => handleAcceptInvite(notif._id)}
                          disabled={!!actionLoading[notif._id]}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:opacity-60 text-white text-[11px] font-bold transition-colors cursor-pointer border-0 outline-none shadow-sm"
                        >
                          {actionLoading[notif._id] === 'accept' ? (
                            <>
                              <i className="ri-loader-4-line animate-spin text-xs" /> Accepting...
                            </>
                          ) : (
                            'Accept Invite'
                          )}
                        </button>
                        <button
                          onClick={() => handleDeclineInvite(notif._id)}
                          disabled={!!actionLoading[notif._id]}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 disabled:opacity-60 text-white text-[11px] font-bold transition-colors cursor-pointer border-0 outline-none shadow-sm"
                        >
                          {actionLoading[notif._id] === 'decline' ? (
                            <>
                              <i className="ri-loader-4-line animate-spin text-xs" /> Declining...
                            </>
                          ) : (
                            'Decline'
                          )}
                        </button>
                        <Link
                          to={`/event/${notif.eventId}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white transition-colors text-[11px] font-semibold"
                        >
                          View Event
                        </Link>
                      </div>
                    ) : (notif.eventId || !isRead) && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {notif.eventId && (
                          <Link
                            to={`/event/${notif.eventId}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white dark:hover:text-white text-[11px] font-semibold transition-colors"
                          >
                            View Event
                          </Link>
                        )}
                        {!isRead && (
                          <button
                            onClick={() => handleMarkAsRead(notif._id)}
                            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-black dark:hover:text-white hover:border-neutral-300 transition-colors text-[11px] font-semibold cursor-pointer border-0 outline-none"
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
          /* Empty State */
          <div className="bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-16 flex flex-col items-center gap-4 text-center px-6">
            <div className="w-14 h-14 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-300 dark:text-neutral-700">
              <i className="ri-notification-off-line text-2xl"></i>
            </div>
            <div>
              <p className="text-base font-bold text-black dark:text-white">
                You're all caught up!
              </p>
              <p className="text-sm text-neutral-400 dark:text-neutral-500 mt-1.5">
                No new notifications.
              </p>
            </div>
            <Link
              to="/"
              className="px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-semibold rounded-xl hover:bg-orange-600 dark:hover:bg-orange-600 hover:text-white dark:hover:text-white transition-colors cursor-pointer mt-2"
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
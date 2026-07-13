import React, { useState, useEffect } from "react";
import axios from "axios";

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

const SendNotification = () => {
  const [targetType, setTargetType] = useState("ALL_STUDENTS");
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [history, setHistory] = useState([]);

  const userString = localStorage.getItem("user");
  const user = userString && userString !== "undefined" ? JSON.parse(userString) : null;

  useEffect(() => {
    if (user && (user.id || user.clubId)) {
      // Use clubId for fetching all events for the managed club
      const targetClubId = user.clubId;
      if (targetClubId) {
        axios
          .get(`${API_URL}/api/events/club-manage/${targetClubId}`)
          .then((res) => {
          setEvents(res.data);
        })
        .catch((err) => console.error("Could not fetch events", err));

      axios
        .get(`${API_URL}/api/notifications/sent`)
        .then((res) => setHistory(res.data))
        .catch((err) => console.error("Could not fetch history", err));
    }
  }}, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await axios.post(`${API_URL}/api/notifications`, {
        targetType,
        eventId: targetType === "REGISTERED_STUDENTS" ? selectedEventId : undefined,
        title,
        message,
      });

      setSuccessMsg("Notification sent successfully!");
      setHistory((prev) => [res.data, ...prev]);
      setTitle("");
      setMessage("");
      setTargetType("ALL_STUDENTS");
      setSelectedEventId("");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to send notification.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-5 lg:px-8 py-10 myfont">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-black dark:text-white tracking-tight">Send Notification</h1>
        <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
          Broadcast a real-time message to your audience.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 md:p-8 shadow-sm">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 font-semibold text-green-700 dark:text-green-400 text-sm rounded-xl flex items-center gap-2">
            <i className="ri-checkbox-circle-fill text-lg"></i>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 font-semibold text-red-700 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
            <i className="ri-error-warning-fill text-lg"></i>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Target Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Target Audience
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              {[
                { value: "ALL_STUDENTS", label: "All Students" },
                { value: "REGISTERED_STUDENTS", label: "Registered Students" },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                    targetType === opt.value
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-600"
                      : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
                  }`}
                >
                  <input
                    type="radio"
                    name="targetType"
                    value={opt.value}
                    checked={targetType === opt.value}
                    onChange={() => setTargetType(opt.value)}
                    className="accent-orange-600 scale-110"
                  />
                  <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Event Selector (Conditional) */}
          {targetType === "REGISTERED_STUDENTS" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
                Select Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-medium bg-white dark:bg-neutral-900 text-black dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all"
              >
                <option value="" disabled>
                  -- Select an event --
                </option>
                {events.map((evt) => (
                  <option key={evt.id || evt._id} value={evt.id || evt._id}>
                    {evt.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-neutral-400 mt-1">
                Only students registered for this event will receive the notification.
              </p>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Important Venue Change"
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-medium bg-white dark:bg-neutral-900 text-black dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 dark:text-neutral-400">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Write your message here..."
              className="w-full border border-neutral-200 dark:border-neutral-800 rounded-xl px-4 py-3 text-sm font-medium bg-white dark:bg-neutral-900 text-black dark:text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all placeholder:text-neutral-400 resize-y"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm uppercase tracking-wider rounded-xl transition-all ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-0.5 cursor-pointer"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin text-lg" /> Sending...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Send Notification
              </span>
            )}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="mt-12">
        <h2 className="text-xl font-black text-black dark:text-white tracking-tight mb-6">Notification History</h2>
        {history.length === 0 ? (
          <div className="bg-white dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl py-12 flex flex-col items-center gap-3 text-center px-6">
            <div className="w-12 h-12 bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center text-neutral-300 dark:text-neutral-700">
              <i className="ri-notification-off-line text-xl"></i>
            </div>
            <p className="text-sm font-bold text-neutral-400">No notifications sent yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((notif) => (
              <div
                key={notif.id || notif._id}
                className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 transition-colors hover:border-neutral-300 dark:hover:border-neutral-700"
              >
                <div className="flex justify-between items-start mb-2 gap-3 flex-wrap">
                  <span
                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest rounded-lg ${
                      notif.targetType === "ALL_STUDENTS"
                        ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 border border-orange-200/50 dark:border-orange-900/40"
                        : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 border border-blue-200/50 dark:border-blue-900/40"
                    }`}
                  >
                    {notif.targetType === "ALL_STUDENTS"
                      ? "Sent to all students"
                      : `Event: ${notif.eventId?.title || "Unknown Event"}`}
                  </span>
                  <span className="text-[11px] font-medium text-neutral-400" title={new Date(notif.createdAt).toLocaleString()}>
                    {formatRelativeTime(notif.createdAt)}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-black dark:text-white mb-1">{notif.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{notif.message}</p>
                <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[10px] font-semibold text-neutral-400">
                    Read by {notif.readBy?.length || 0} student(s)
                  </span>
                  <span className="text-[10px] font-semibold text-neutral-400">
                    Sent to {notif.targetType === "ALL_STUDENTS" ? "All" : (notif.recipients?.length || 0)} student(s)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SendNotification;

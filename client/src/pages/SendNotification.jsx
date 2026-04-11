import React, { useState, useEffect } from "react";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

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
    if (user && user.id) {
      // Fetch events for this club head
      axios
        .get(`${API_URL}/api/club-events/club-co/${user.id}`)
        .then((res) => {
          setEvents(res.data);
        })
        .catch((err) => console.error("Could not fetch events", err));

      axios
        .get(`${API_URL}/api/notifications/sent`)
        .then((res) => setHistory(res.data))
        .catch((err) => console.error("Could not fetch history", err));
    }
  }, []);

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
      <div className="mb-8">
        <h1 className="text-3xl font-black text-black tracking-wide">Send Notification</h1>
        <p className="text-neutral-500 text-sm mt-1">
          Broadcast a real-time message to your audience.
        </p>
      </div>

      <div className="bg-white border-2 border-gray-400 rounded-sm  p-6 pr-8">
        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border-2 border-green-600 font-bold text-green-700 text-[13px] rounded-sm flex items-center gap-2">
            <i className="ri-checkbox-circle-fill text-lg"></i>
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-600 font-bold text-red-700 text-[13px] rounded-sm flex items-center gap-2">
            <i className="ri-error-warning-fill text-lg"></i>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* Target Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-[12px] font-black uppercase tracking-widest text-black">
              Target Audience
            </label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="ALL_STUDENTS"
                  checked={targetType === "ALL_STUDENTS"}
                  onChange={() => setTargetType("ALL_STUDENTS")}
                  className="accent-orange-600 scale-125"
                />
                <span className="text-sm font-bold text-neutral-800">All Students</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="targetType"
                  value="REGISTERED_STUDENTS"
                  checked={targetType === "REGISTERED_STUDENTS"}
                  onChange={() => setTargetType("REGISTERED_STUDENTS")}
                  className="accent-orange-600 scale-125"
                />
                <span className="text-sm font-bold text-neutral-800">Registered Students</span>
              </label>
            </div>
          </div>

          {/* Event Selector (Conditional) */}
          {targetType === "REGISTERED_STUDENTS" && (
            <div className="flex flex-col gap-1.5 animate-fade-in">
              <label className="text-[12px] font-black uppercase tracking-widest text-black">
                Select Event
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                required
                className="w-full border-2 border-black rounded-sm px-4 py-3 text-sm font-bold bg-white text-black outline-none focus:border-orange-600 transition-colors"
              >
                <option value="" disabled>
                  -- Select an event --
                </option>
                {events.map((evt) => (
                  <option key={evt._id} value={evt._id}>
                    {evt.title}
                  </option>
                ))}
              </select>
              <p className="text-[11px] font-bold text-neutral-500 mt-1">
                Only students actively registered for this event will receive the notification.
              </p>
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-black uppercase tracking-widest text-black">
              Notification Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Important Venue Change"
              className="w-full border-2 border-black rounded-sm px-4 py-3 text-sm font-bold bg-white text-black outline-none focus:border-orange-600 focus:bg-orange-50 transition-colors placeholder:font-normal placeholder:text-neutral-400"
            />
          </div>

          {/* Message */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-black uppercase tracking-widest text-black">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              placeholder="Write your message here..."
              className="w-full border-2 border-black rounded-sm px-4 py-3 text-sm font-bold bg-white text-black outline-none focus:border-orange-600 focus:bg-orange-50 transition-colors placeholder:font-normal placeholder:text-neutral-400 resize-y"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 bg-orange-600 border-2 border-gray-400 text-white font-black text-[14px] uppercase tracking-widest rounded-sm hover:bg-yellow-400 hover:text-black transition-all duration-200 mt-2 ${
              loading ? "opacity-70 cursor-not-allowed" : "hover:-translate-y-1 "
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <i className="ri-loader-4-line animate-spin text-lg" /> Sending...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2 tracking-wide">
                <i className="ri-send-plane-fill text-lg" /> Send Notification
              </span>
            )}
          </button>
        </form>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-black text-black mb-6">Notification History</h2>
        {history.length === 0 ? (
          <div className="bg-white border-2 border-gray-400 rounded-sm p-8 text-center text-neutral-500 font-bold uppercase tracking-widest text-[12px]">
            No notifications sent yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {history.map((notif) => (
              <div key={notif._id} className="bg-white border-2 border-black rounded-sm p-5 shadow-[4px_4px_0px_#0D0D0D]">
                <div className="flex justify-between items-start mb-2">
                  <span className={`px-2 py-1 text-[10px] font-black uppercase tracking-widest rounded-sm ${notif.targetType === 'ALL_STUDENTS' ? 'bg-orange-100 text-orange-700 border border-orange-700' : 'bg-blue-100 text-blue-700 border border-blue-700'}`}>
                    {notif.targetType === 'ALL_STUDENTS' ? 'All Students' : `Event: ${notif.eventId?.title || 'Unknown Event'}`}
                  </span>
                  <span className="text-[11px] font-bold text-neutral-500">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                </div>
                <h3 className="text-sm font-black text-black mb-1">{notif.title}</h3>
                <p className="text-xs text-neutral-600 font-medium">{notif.message}</p>
                <div className="mt-3 pt-3 border-t-2 border-dashed border-neutral-100 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    <i className="ri-eye-line mr-1"></i> Read by {notif.readBy?.length || 0} student(s)
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                    <i className="ri-team-line mr-1"></i> Sent to {notif.targetType === 'ALL_STUDENTS' ? 'All' : (notif.recipients?.length || 0)} student(s)
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

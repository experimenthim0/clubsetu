import React, { useState, useEffect } from "react";
import api from "../services/api";
import { UserPlus, Trash2, Shield, Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

const AVAILABLE_PERMISSIONS = [
  { id: "ATTENDANCE_OPERATOR", label: "Attendance Operator", desc: "Scan QR codes & manage check-ins" },
  { id: "REGISTRATION_OPERATOR", label: "Registration Operator", desc: "View & verify student registrations" },
  { id: "CERTIFICATE_OPERATOR", label: "Certificate Operator", desc: "Generate & distribute certificates" },
  { id: "ANNOUNCEMENT_OPERATOR", label: "Announcement Operator", desc: "Send event updates & push notifications" },
  { id: "EVENT_ANALYTICS_VIEWER", label: "Analytics Viewer", desc: "View attendance & registration stats" },
  { id: "EVENT_MANAGER", label: "Event Manager", desc: "Manage event details and assist coordination" },
];

const EventStaffManager = ({ eventId, eventTitle }) => {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [email, setEmail] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState(["ATTENDANCE_OPERATOR"]);
  const [expiresAt, setExpiresAt] = useState("");
  const [inviting, setInviting] = useState(false);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get(`/api/central-organizer/events/${eventId}/staff`);
      setStaffList(res.data.staff || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load event staff.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) fetchStaff();
  }, [eventId]);

  const handlePermissionToggle = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  const handleInviteStaff = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter a student email.");
      return;
    }
    if (selectedPermissions.length === 0) {
      setError("Select at least one permission.");
      return;
    }

    try {
      setInviting(true);
      setError("");
      setSuccess("");

      const res = await api.post(`/api/central-organizer/events/${eventId}/staff`, {
        email: email.trim(),
        permissions: selectedPermissions,
        expiresAt: expiresAt || null,
      });

      setSuccess(`Invitation sent to ${res.data.student?.name || email}. Status is PENDING until accepted.`);
      setEmail("");
      setSelectedPermissions(["ATTENDANCE_OPERATOR"]);
      setExpiresAt("");
      setShowInviteModal(false);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to invite staff.");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeStaff = async (staffId, studentName) => {
    if (!window.confirm(`Revoke event staff access for ${studentName}? They will immediately lose all assigned permissions.`)) {
      return;
    }

    try {
      setError("");
      await api.delete(`/api/central-organizer/events/${eventId}/staff/${staffId}`);
      setSuccess(`Revoked event staff access for ${studentName}.`);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to revoke staff access.");
    }
  };

  const getStatusBadge = (status, expiresAtDate) => {
    const isExpired = expiresAtDate && new Date() > new Date(expiresAtDate);
    const effectiveStatus = isExpired && status === "ACTIVE" ? "EXPIRED" : status;

    switch (effectiveStatus) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            <CheckCircle size={13} /> Active
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
            <Clock size={13} /> Pending Acceptance
          </span>
        );
      case "REVOKED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">
            <XCircle size={13} /> Revoked
          </span>
        );
      case "EXPIRED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300">
            <AlertCircle size={13} /> Expired
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            <XCircle size={13} /> Rejected
          </span>
        );
      default:
        return <span className="text-xs text-neutral-500">{status}</span>;
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="text-orange-600 dark:text-orange-500" size={20} />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Event Staff Delegation
            </h3>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Delegate event-scoped roles to students using their own CampusNode accounts. Staff must accept before access activates.
          </p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
        >
          <UserPlus size={16} />
          Invite Staff Member
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle size={16} className="shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-neutral-500">Loading event staff...</div>
      ) : staffList.length === 0 ? (
        <div className="py-12 text-center">
          <Shield className="mx-auto text-neutral-400 dark:text-neutral-600 mb-3" size={36} />
          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
            No Event Staff Assigned Yet
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-md mx-auto">
            Invite students by their CampusNode email to assist with attendance scanning, registrations, and on-ground coordination.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Expires At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {staffList.map((staff) => (
                <tr key={staff.id} className="hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-bold flex items-center justify-center text-xs">
                        {staff.user?.name ? staff.user.name.charAt(0).toUpperCase() : "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-900 dark:text-neutral-100">{staff.user?.name || "Unknown"}</p>
                        <p className="text-xs text-neutral-500">{staff.user?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {staff.permissions.map((p) => (
                        <span
                          key={p}
                          className="px-2 py-0.5 text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded"
                        >
                          {p.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(staff.status, staff.expiresAt)}</td>
                  <td className="px-4 py-3.5 text-xs text-neutral-500">
                    {staff.expiresAt ? (
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(staff.expiresAt).toLocaleString()}
                      </span>
                    ) : (
                      "No Expiry (Event Duration)"
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {staff.status === "ACTIVE" || staff.status === "PENDING" ? (
                      <button
                        onClick={() => handleRevokeStaff(staff.id, staff.user?.name || staff.user?.email)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors cursor-pointer"
                        title="Revoke access immediately"
                      >
                        <Trash2 size={13} />
                        Revoke
                      </button>
                    ) : (
                      <span className="text-xs text-neutral-400">Archived</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Invite Modal ── */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Invite Event Staff Member
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Event: <span className="font-semibold text-neutral-700 dark:text-neutral-300">{eventTitle}</span>
            </p>

            <form onSubmit={handleInviteStaff} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Student CampusNode Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@nitj.ac.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Must be an existing registered CampusNode student account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-2">
                  Assign Granular Permissions *
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_PERMISSIONS.map((perm) => (
                    <label
                      key={perm.id}
                      className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        selectedPermissions.includes(perm.id)
                          ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/20"
                          : "border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.includes(perm.id)}
                        onChange={() => handlePermissionToggle(perm.id)}
                        className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{perm.label}</p>
                        <p className="text-[11px] text-neutral-500">{perm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1.5">
                  Access Expiry (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-orange-500 outline-none"
                />
                <p className="text-[11px] text-neutral-500 mt-1">
                  After this time, the backend will automatically reject all staff requests.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg cursor-pointer transition-colors"
                >
                  {inviting ? "Sending Invitation..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventStaffManager;

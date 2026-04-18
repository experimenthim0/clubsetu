import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { ClubMemberRole } from "../types/index.js";

const API_URL = import.meta.env.VITE_API_URL;

// ── Avatar ─────────────────────────────────────────────────────────────────────
const Avatar = ({ name }) => {
  const initials = name
    ?.split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase() ?? "??";

  return (
    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-medium text-blue-500">
      {initials}
    </div>
  );
};

// ── Role Badge ─────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  const map = {
    [ClubMemberRole.CLUB_HEAD]:   { style: "bg-amber-50 text-amber-600",      label: "Head" },
    [ClubMemberRole.COORDINATOR]: { style: "bg-sky-50 text-sky-600",          label: "Coordinator" },
    [ClubMemberRole.MEMBER]:      { style: "bg-neutral-100 text-neutral-500", label: "Member" },
  };
  const { style, label } = map[role] ?? map[ClubMemberRole.MEMBER];
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${style}`}>
      {label}
    </span>
  );
};

// ── Permission Toggle ──────────────────────────────────────────────────────────
const PermissionToggle = ({ active, onToggle, disabled = false }) => (
  <button
    type="button"
    onClick={disabled ? null : onToggle}
    disabled={disabled}
    className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none ${
      active ? "bg-neutral-800" : "bg-neutral-200"
    } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
  >
    <span
      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
        active ? "translate-x-[18px]" : "translate-x-[3px]"
      }`}
    />
  </button>
);

// ── Table Header Cell ──────────────────────────────────────────────────────────
const Th = ({ children, center = false }) => (
  <th
    className={`px-4 py-3 text-[11px] font-medium tracking-wide text-neutral-400 ${
      center ? "text-center" : "text-left"
    }`}
  >
    {children}
  </th>
);

// ── Trash Icon ─────────────────────────────────────────────────────────────────
const TrashIcon = () => (
  <svg
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
    />
  </svg>
);

// ── Empty State Icon ───────────────────────────────────────────────────────────
const PeopleIcon = () => (
  <svg
    className="h-10 w-10 text-neutral-200"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
    />
  </svg>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const ClubMembers = () => {
  const { clubId } = useParams();
  const [members, setMembers]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [inviting, setInviting]     = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState(ClubMemberRole.MEMBER);

  useEffect(() => {
    fetchMembers();
  }, [clubId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/club-members/${clubId}/members`);
      setMembers(res.data);
    } catch {
      toast.error("Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.endsWith("@nitj.ac.in")) {
      toast.error("Only @nitj.ac.in emails allowed");
      return;
    }
    try {
      setInviting(true);
      await axios.post(`${API_URL}/api/club-members/${clubId}/members`, {
        email: inviteEmail,
        role: selectedRole,
      });
      toast.success("Member added successfully");
      setInviteEmail("");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member");
    } finally {
      setInviting(false);
    }
  };

  const togglePermission = async (membershipId, field, currentValue) => {
    try {
      const member = members.find((m) => (m.id || m._id) === membershipId);
      const permissions = {
        canTakeAttendance: field === "canTakeAttendance" ? !currentValue : member.canTakeAttendance,
        canEditEvents:     field === "canEditEvents"     ? !currentValue : member.canEditEvents,
      };
      await axios.put(`${API_URL}/api/club-members/members/${membershipId}`, { permissions });
      toast.success("Permission updated");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update permission");
    }
  };

  const changeRole = async (membershipId, newRole) => {
    try {
      await axios.put(`${API_URL}/api/club-members/members/${membershipId}`, { role: newRole });
      toast.success("Role updated");
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const removeMember = async (membershipId) => {
    if (!window.confirm("Remove this member?")) return;
    try {
      await axios.delete(`${API_URL}/api/club-members/members/${membershipId}`);
      toast.success("Member removed");
      fetchMembers();
    } catch {
      toast.error("Failed to remove member");
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
        Loading members…
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-xl font-medium text-neutral-900">Team management</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Manage club members and their access permissions.
        </p>
      </div>

      {/* ── Invite section ──────────────────────────────────────────────────── */}
      <div className="mb-6 rounded-xl border border-neutral-100 bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-medium tracking-wide text-neutral-400">
          Invite member
        </p>
        <form onSubmit={handleInvite} className="flex flex-wrap items-center gap-3">
          <input
            type="email"
            placeholder="name@nitj.ac.in"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            className="h-9 min-w-[200px] flex-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="h-9 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700 focus:border-neutral-400 focus:outline-none"
          >
            <option value={ClubMemberRole.MEMBER}>Member</option>
            <option value={ClubMemberRole.COORDINATOR}>Coordinator</option>
            <option value={ClubMemberRole.CLUB_HEAD}>Club Head</option>
          </select>
          <button
            type="submit"
            disabled={inviting}
            className="h-9 rounded-lg bg-neutral-900 px-5 text-sm font-medium text-white transition-opacity hover:opacity-80 disabled:opacity-40"
          >
            {inviting ? "Adding…" : "Add member"}
          </button>
        </form>
      </div>

      {/* ── Members table ────────────────────────────────────────────────────── */}
      <div className="overflow-hidden rounded-xl border border-neutral-100 bg-white shadow-sm">
        {members.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <PeopleIcon />
            <p className="text-sm text-neutral-400">No team members added yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-neutral-100">
                  <Th>Member</Th>
                  <Th>Role</Th>
                  <Th center>Attendance</Th>
                  <Th center>Edit events</Th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium tracking-wide text-neutral-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {members.map((member) => {
                  const id = member._id || member.id;
                  return (
                    <tr key={id} className="transition-colors hover:bg-neutral-50/60">
                      {/* Member info */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={member.student?.name} />
                          <div>
                            <p className="text-sm font-medium text-neutral-800">
                              {member.student?.name}
                            </p>
                            <p className="font-mono text-[11px] text-neutral-400">
                              {member.student?.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5">
                        <select
                          value={member.role}
                          onChange={(e) => changeRole(id, e.target.value)}
                          disabled={member.role === ClubMemberRole.CLUB_HEAD}
                          className={`h-8 rounded-lg border border-neutral-100 bg-neutral-50 px-2 text-[11px] font-medium text-neutral-700 focus:border-neutral-400 focus:outline-none ${
                            member.role === ClubMemberRole.CLUB_HEAD ? "cursor-not-allowed opacity-70" : ""
                          }`}
                        >
                          <option value={ClubMemberRole.MEMBER}>Member</option>
                          <option value={ClubMemberRole.COORDINATOR}>Coordinator</option>
                          <option value={ClubMemberRole.CLUB_HEAD}>Club Head</option>
                        </select>
                      </td>

                      {/* Permissions */}
                      <td className="px-4 py-3.5 text-center">
                        <PermissionToggle
                          active={member.canTakeAttendance}
                          disabled={member.role === ClubMemberRole.CLUB_HEAD}
                          onToggle={() =>
                            togglePermission(id, "canTakeAttendance", member.canTakeAttendance)
                          }
                        />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <PermissionToggle
                          active={member.canEditEvents}
                          disabled={member.role === ClubMemberRole.CLUB_HEAD}
                          onToggle={() =>
                            togglePermission(id, "canEditEvents", member.canEditEvents)
                          }
                        />
                      </td>

                      {/* Remove */}
                      <td className="px-5 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeMember(id)}
                          disabled={member.role === ClubMemberRole.CLUB_HEAD}
                          className={`inline-flex items-center justify-center rounded-lg p-1.5 transition-colors ${
                             member.role === ClubMemberRole.CLUB_HEAD 
                             ? "text-neutral-200 cursor-not-allowed" 
                             : "text-neutral-300 hover:bg-red-50 hover:text-red-400"
                          }`}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubMembers;
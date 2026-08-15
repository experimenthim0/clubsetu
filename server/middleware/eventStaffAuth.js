/**
 * Event Staff Authorization Middleware
 *
 * Enforces event-scoped staff permissions.
 * Checks: User + Event + Permission + Status(ACTIVE) + Expiry
 *
 * NEVER trusts client-supplied roles, permissions, or user IDs.
 * Derives everything from the database based on authenticated user ID.
 */

import prisma from "../lib/prisma.js";

/**
 * Valid event staff permission constants.
 * These are NOT global roles — they are event-scoped strings
 * checked only against the EventStaff record for a specific event.
 */
export const EVENT_STAFF_PERMISSIONS = {
  ATTENDANCE_OPERATOR: "ATTENDANCE_OPERATOR",
  REGISTRATION_OPERATOR: "REGISTRATION_OPERATOR",
  CERTIFICATE_OPERATOR: "CERTIFICATE_OPERATOR",
  ANNOUNCEMENT_OPERATOR: "ANNOUNCEMENT_OPERATOR",
  EVENT_ANALYTICS_VIEWER: "EVENT_ANALYTICS_VIEWER",
  EVENT_MANAGER: "EVENT_MANAGER",
};

/**
 * Middleware: require a specific event staff permission for the current event.
 *
 * Extracts eventId from req.params.eventId, req.params.id, or req.body.eventId.
 * Extracts userId from req.user.userId (server auth context, NOT request body).
 *
 * @param {string} permission - One of EVENT_STAFF_PERMISSIONS values
 * @returns Express middleware
 */
export function requireEventStaffPermission(permission) {
  return async (req, res, next) => {
    try {
      const eventId = req.params.eventId || req.params.id || req.body.eventId;
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required." });
      }

      // Identity derived from server auth context — NEVER from request body
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Authentication required." });
      }

      const staffRecord = await prisma.eventStaff.findUnique({
        where: { eventId_userId: { eventId, userId } },
      });

      if (!staffRecord) {
        return res.status(403).json({ message: "Not authorized as event staff for this event." });
      }

      if (staffRecord.status !== "ACTIVE") {
        return res.status(403).json({
          message: `Event staff access is ${staffRecord.status.toLowerCase()}.`,
        });
      }

      // Check expiry — auto-expire stale records
      if (staffRecord.expiresAt && new Date() > new Date(staffRecord.expiresAt)) {
        await prisma.eventStaff.update({
          where: { id: staffRecord.id },
          data: { status: "EXPIRED" },
        });
        return res.status(403).json({ message: "Event staff access has expired." });
      }

      // Check specific permission
      if (!staffRecord.permissions.includes(permission)) {
        return res.status(403).json({
          message: `Missing event staff permission: ${permission}`,
        });
      }

      // Attach staff record to request for downstream use
      req.eventStaff = staffRecord;
      next();
    } catch (err) {
      console.error("EventStaff auth error:", err);
      return res.status(500).json({ message: "Authorization check failed." });
    }
  };
}

/**
 * Verify if a user has attendance permission for a specific event.
 * Used by scanner routes for both online and offline attendance.
 *
 * Checks:
 * 1. Club membership with canTakeAttendance (existing system)
 * 2. EventStaff with ATTENDANCE_OPERATOR permission (new system)
 * 3. Admin role (existing system)
 *
 * @param {string} userId - Authenticated user ID (from server context)
 * @param {string} eventId - Event ID to check
 * @param {object} event - Event object (must have clubId, organizerType)
 * @param {object} user - req.user object
 * @returns {boolean} Whether the user is authorized for attendance
 */
export async function verifyAttendancePermission(userId, eventId, event, user) {
  // Admin has full access
  if (user.role === "admin") return true;

  // Central Organizer owns the event
  if (
    user.role === "central_organizer" &&
    event.organizerType === "CENTRAL" &&
    event.centralOrganizerId === userId
  ) {
    return true;
  }

  // Club membership check (existing system — for CLUB events)
  if (event.clubId) {
    const membership = await prisma.clubMembership.findFirst({
      where: {
        studentId: userId,
        clubId: event.clubId,
        OR: [
          { canTakeAttendance: true },
          { role: { in: ["CLUB_HEAD", "COORDINATOR"] } },
        ],
      },
    });
    if (membership) return true;
  }

  // Faculty coordinator check (existing system)
  if (user.userType === "admin" && user.clubId && event.clubId === user.clubId) {
    return true;
  }

  // EventStaff check — ATTENDANCE_OPERATOR for this specific event
  const staffRecord = await prisma.eventStaff.findUnique({
    where: { eventId_userId: { eventId, userId } },
  });

  if (
    staffRecord &&
    staffRecord.status === "ACTIVE" &&
    staffRecord.permissions.includes(EVENT_STAFF_PERMISSIONS.ATTENDANCE_OPERATOR) &&
    (!staffRecord.expiresAt || new Date() <= new Date(staffRecord.expiresAt))
  ) {
    return true;
  }

  return false;
}

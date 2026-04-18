import prisma from "../lib/prisma.js"; // trigger restart
import { createObjectId } from "../utils/objectId.js";

const VALID_ROLES = ["CLUB_HEAD", "COORDINATOR", "MEMBER"];

/**
 * Derives permission flags from a ClubMemberRole enum value.
 * @param {string} role - One of CLUB_HEAD, COORDINATOR, MEMBER
 * @returns {{ canTakeAttendance: boolean, canEditEvents: boolean }}
 */
export function derivePermissions(role) {
  if (role === "CLUB_HEAD" || role === "COORDINATOR") {
    return { canTakeAttendance: true, canEditEvents: true };
  }
  // MEMBER
  return { canTakeAttendance: true, canEditEvents: false };
}

/**
 * Add a new member to a club by college email.
 * Only @nitj.ac.in emails are allowed as per latest requirement.
 */
export const addClubMember = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { email, role = "MEMBER" } = req.body;

    // Validate role is one of the accepted enum values
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
      });
    }

    if (!email.endsWith("@nitj.ac.in")) {
      return res.status(400).json({
        message: "Only students with @nitj.ac.in emails can be added as club members.",
      });
    }

    const club = await prisma.club.findUnique({ where: { id: clubId } });
    if (!club) return res.status(404).json({ message: "Club not found." });

    // Verify requesting user is authorized (ClubHead or Admin)
    let isClubHead = false;
    if (req.user.userType === "student") {
        const membership = await prisma.clubMembership.findUnique({
            where: { clubId_studentId: { clubId, studentId: req.user.userId } }
        });
        isClubHead = membership?.role === "CLUB_HEAD";
    }

    const isAdmin = req.user.role === "admin";
    const isFaculty = req.user.role === "facultyCoordinator" && req.user.clubId === clubId;

    if (!isClubHead && !isAdmin && !isFaculty) {
      return res.status(403).json({ message: "Unauthorized to add members to this club." });
    }

    // Find the student by email
    const student = await prisma.studentUser.findUnique({ where: { email } });
    if (!student) {
      return res.status(404).json({
        message: "Student not found. They must register as a student on the platform first.",
      });
    }

    // Check if membership already exists using @@unique([clubId, studentId])
    const existing = await prisma.clubMembership.findUnique({
      where: { clubId_studentId: { clubId, studentId: student.id } },
    });

    if (existing) {
      return res.status(400).json({ message: "This student is already a member of the club." });
    }

    const { canTakeAttendance, canEditEvents } = derivePermissions(role);

    const membership = await prisma.clubMembership.create({
      data: {
        id: createObjectId(),
        studentId: student.id,
        clubId,
        role,
        canTakeAttendance,
        canEditEvents,
      },
      include: {
        student: { select: { id: true, name: true, email: true, rollNo: true } },
      },
    });

    res.status(201).json({
      message: "Member added successfully.",
      membership: { ...membership, _id: membership.id },
    });
  } catch (err) {
    console.error("DEBUG: addClubMember error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Get all members of a club.
 */
export const getClubMembers = async (req, res) => {
  try {
    const { clubId } = req.params;

    const members = await prisma.clubMembership.findMany({
      where: { clubId },
      include: {
        student: { select: { id: true, name: true, email: true, rollNo: true } },
      },
    });

    res.json(members.map(m => ({ ...m, _id: m.id })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Update member permissions or role.
 */
export const updateMemberPermissions = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { role, permissions } = req.body;

    const updateData = {};
    if (role) {
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({
          message: `Invalid role. Must be one of: ${VALID_ROLES.join(", ")}.`,
        });
      }
      updateData.role = role;
      // When role changes, we derive new default permissions unless explicitly overridden
      Object.assign(updateData, derivePermissions(role));
    }

    if (permissions) {
      if (permissions.canTakeAttendance !== undefined) {
        updateData.canTakeAttendance = !!permissions.canTakeAttendance;
      }
      if (permissions.canEditEvents !== undefined) {
        updateData.canEditEvents = !!permissions.canEditEvents;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No updates provided." });
    }

    // Check if membership exists first to avoid Prisma error P2025
    const existing = await prisma.clubMembership.findUnique({ where: { id: membershipId } });
    if (!existing) return res.status(404).json({ message: "Membership record not found. Try refreshing the member list." });

    const membership = await prisma.clubMembership.update({
      where: { id: membershipId },
      data: updateData,
      include: {
        student: { select: { name: true } }
      }
    });

    res.json({ message: "Updated successfully.", membership: { ...membership, _id: membership.id } });
  } catch (err) {
    console.error("DEBUG: updateMemberPermissions error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Remove a member from a club.
 */
export const removeClubMember = async (req, res) => {
  try {
    const { membershipId } = req.params;

    // Check if membership exists
    const membership = await prisma.clubMembership.findUnique({ where: { id: membershipId } });
    if (!membership) return res.status(404).json({ message: "Membership not found." });

    // Protect clubHead role? Usually handled by deletion logic
    if (membership.role === "CLUB_HEAD") {
        const otherHeads = await prisma.clubMembership.count({
            where: { clubId: membership.clubId, role: "CLUB_HEAD" }
        });
        if (otherHeads <= 1) {
            return res.status(400).json({ message: "Cannot remove the only Club Head. Transfer leadership first." });
        }
    }

    await prisma.clubMembership.delete({ where: { id: membershipId } });
    res.json({ message: "Member removed successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

import express from "express";
import { verifyToken } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { getStudentRoleAndClub, getAdminClubId } from "./auth.js";

const router = express.Router();

// GET /api/users/me — fetch the authenticated user's profile
router.get("/me", verifyToken, async (req, res) => {
  const { userId, userType } = req.user;

  try {
    const user = userType === "admin"
      ? await prisma.adminRole.findUnique({ where: { id: userId } })
      : await prisma.studentUser.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    const safeUser = sanitizeUser(user);

    if (userType === "admin") {
      const clubInfo = (user.role === "facultyCoordinator" || user.role === "club")
        ? await getAdminClubId(user.id)
        : null;
      safeUser.clubId = clubInfo?.id ?? null;
      safeUser.memberships = clubInfo ? [{
        clubId: clubInfo.id,
        clubName: clubInfo.clubName,
        role: "facultyCoordinator",
        permissions: {
          canTakeAttendance: true,
          canViewDashboard: true,
          canCheckRegistration: true,
          canEditEvents: true,
        },
      }] : [];
      return res.json({ user: safeUser, role: user.role, userType });
    }

    const { role, clubId, memberships } = await getStudentRoleAndClub(user.id);
    safeUser.clubId = clubId;
    safeUser.memberships = memberships;
    return res.json({ user: safeUser, role, userType });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:role/:id — update profile for the authenticated user
// The :role segment is kept for URL compatibility; actual table is determined by JWT userType.

router.put("/:role/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { userId, userType, role } = req.user;

  if (userId !== id && role !== "admin") {
    return res.status(403).json({ message: "Access denied." });
  }

  const updates = { ...req.body };

  // Prevent updates to restricted fields (some are model-specific but safe to remove regardless)
  delete updates.email;
  delete updates.rollNo;
  delete updates.password;
  delete updates.role;
  delete updates.isApproved;

  try {
    let user;

    if (userType === "admin") {
      user = await prisma.adminRole.update({ where: { id }, data: updates });
    } else if (userType === "external") {
      // External users no longer have a separate table — treat as studentUser or skip
      return res.status(400).json({ message: "External user profile updates are not supported." });
    } else {
      user = await prisma.studentUser.update({ where: { id }, data: updates });
    }

    const safeUser = Object.fromEntries(
      Object.entries(user).filter(([key]) => !["password", "otp", "otpExpire"].includes(key)),
    );

    // Re-attach club associations and memberships
    if (userType === "admin") {
        const clubInfo = (user.role === "facultyCoordinator" || user.role === "club") 
            ? await getAdminClubId(user.id) 
            : null;
        safeUser.clubId = clubInfo?.id ?? null;
        safeUser.memberships = clubInfo ? [{ 
            clubId: clubInfo.id, 
            clubName: clubInfo.clubName, 
            role: "facultyCoordinator",
            permissions: {
                canTakeAttendance: true,
                canViewDashboard: true,
                canCheckRegistration: true,
                canEditEvents: true
            }
        }] : [];
    } else {
        const { clubId, memberships } = await getStudentRoleAndClub(user.id);
        safeUser.clubId = clubId;
        safeUser.memberships = memberships;
    }

    res.json({ message: "Profile updated successfully", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

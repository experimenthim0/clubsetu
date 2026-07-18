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
        ? await prisma.club.findFirst({ where: { facultyCoordinatorId: user.id } })
        : null;
      safeUser.clubId = clubInfo?.id ?? null;
      if (clubInfo) {
        safeUser.bankName = clubInfo.bankName;
        safeUser.accountHolderName = clubInfo.accountHolderName;
        safeUser.accountNumber = clubInfo.accountNumber;
        safeUser.ifscCode = clubInfo.ifscCode;
        safeUser.upiId = clubInfo.upiId;
        safeUser.bankPhone = clubInfo.bankPhone;
      }
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
    if (role === "club" && clubId) {
      const clubInfo = await prisma.club.findUnique({ where: { id: clubId } });
      if (clubInfo) {
        safeUser.bankName = clubInfo.bankName;
        safeUser.accountHolderName = clubInfo.accountHolderName;
        safeUser.accountNumber = clubInfo.accountNumber;
        safeUser.ifscCode = clubInfo.ifscCode;
        safeUser.upiId = clubInfo.upiId;
        safeUser.bankPhone = clubInfo.bankPhone;
      }
    }
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

  const studentAllowedFields = [
    "name", "branch", "year", "program", "isTwoStepEnabled",
    "githubProfile", "linkedinProfile", "xProfile", "instagramProfile", "whatsappNumber", "portfolioUrl"
  ];
  const adminAllowedFields = ["name", "isTwoStepEnabled"];
  const allowedFields = userType === "admin" ? adminAllowedFields : studentAllowedFields;
  
  const updates = Object.fromEntries(
    Object.entries(req.body).filter(([key]) => allowedFields.includes(key) && req.body[key] !== undefined),
  );

  const clubAllowedFields = [
    "bankName",
    "accountHolderName",
    "accountNumber",
    "ifscCode",
    "upiId",
    "bankPhone"
  ];

  const clubUpdates = (role === "club" || role === "facultyCoordinator")
    ? Object.fromEntries(
        Object.entries(req.body).filter(([key]) => clubAllowedFields.includes(key) && req.body[key] !== undefined),
      )
    : {};

  if (Object.keys(updates).length === 0 && Object.keys(clubUpdates).length === 0) {
    return res.status(400).json({ message: "No allowed profile fields provided." });
  }

  try {
    let user;

    if (userType === "admin") {
      if (Object.keys(updates).length > 0) {
        user = await prisma.adminRole.update({ where: { id }, data: updates });
      } else {
        user = await prisma.adminRole.findUnique({ where: { id } });
      }
    } else if (userType === "external") {
      // External users no longer have a separate table — treat as studentUser or skip
      return res.status(400).json({ message: "External user profile updates are not supported." });
    } else {
      user = await prisma.studentUser.update({ where: { id }, data: updates });
    }

    if ((role === "facultyCoordinator" || role === "club") && req.user.clubId && Object.keys(clubUpdates).length > 0) {
      await prisma.club.update({
        where: { id: req.user.clubId },
        data: clubUpdates
      });
    }

    const safeUser = Object.fromEntries(
      Object.entries(user).filter(([key]) => !["password", "otp", "otpExpire"].includes(key)),
    );

    // Re-attach club associations and memberships
    if (userType === "admin") {
        const clubInfo = (user.role === "facultyCoordinator" || user.role === "club") 
            ? await prisma.club.findFirst({ where: { facultyCoordinatorId: user.id } }) 
            : null;
        safeUser.clubId = clubInfo?.id ?? null;
        if (clubInfo) {
            safeUser.bankName = clubInfo.bankName;
            safeUser.accountHolderName = clubInfo.accountHolderName;
            safeUser.accountNumber = clubInfo.accountNumber;
            safeUser.ifscCode = clubInfo.ifscCode;
            safeUser.upiId = clubInfo.upiId;
            safeUser.bankPhone = clubInfo.bankPhone;
        }
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
        const { role: studentRole, clubId: studentClubId, memberships } = await getStudentRoleAndClub(user.id);
        safeUser.clubId = studentClubId;
        safeUser.memberships = memberships;
        if (studentRole === "club" && studentClubId) {
            const clubInfo = await prisma.club.findUnique({ where: { id: studentClubId } });
            if (clubInfo) {
                safeUser.bankName = clubInfo.bankName;
                safeUser.accountHolderName = clubInfo.accountHolderName;
                safeUser.accountNumber = clubInfo.accountNumber;
                safeUser.ifscCode = clubInfo.ifscCode;
                safeUser.upiId = clubInfo.upiId;
                safeUser.bankPhone = clubInfo.bankPhone;
            }
        }
    }

    res.json({ message: "Profile updated successfully", user: safeUser });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/search — search student by email or roll number
router.get("/search", verifyToken, async (req, res) => {
  const { query } = req.query;
  if (!query || query.length < 2) {
    return res.json([]);
  }
  try {
    const students = await prisma.studentUser.findMany({
      where: {
        OR: [
          { email: { startsWith: query, mode: 'insensitive' } },
          { rollNo: { startsWith: query, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        rollNo: true,
        branch: true,
        year: true,
        program: true
      },
      take: 10
    });
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/lookup/:rollNo — lookup student name and branch by roll number
router.get("/lookup/:rollNo", verifyToken, async (req, res) => {
  const { rollNo } = req.params;
  try {
    const student = await prisma.studentUser.findUnique({
      where: { rollNo },
      select: { name: true, branch: true }
    });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }
    return res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

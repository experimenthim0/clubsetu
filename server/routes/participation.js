import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import prisma from '../lib/prisma.js';

const router = express.Router();

// Zod schema: validate :qrCode param as non-empty string
const qrCodeParamSchema = z.object({
  params: z.object({ qrCode: z.string().min(1) }),
  body: z.any().optional(),
  query: z.any().optional(),
});

// ── PATCH /verify/:qrCode — QR attendance scan ────────────────────────────────

router.patch(
  '/verify/:qrCode',
  verifyToken,
  validate(qrCodeParamSchema),
  async (req, res) => {
    try {
      const { qrCode } = req.params;

      // Step 1: Look up participation by qrCode
      const participation = await prisma.participation.findFirst({
        where: { qrCode },
        include: { event: true, student: true },
      });

      if (!participation) {
        return res.status(404).json({ message: 'Participation not found.' });
      }

      // Step 2: Check caller has permission (Admin, Faculty Coordinator of the club, or Club Manager)
      const { userId, role: userRole } = req.user;
      const targetClubId = participation.event.clubId;

      let isAuthorized = false;
      let scannerId = userId; // Fallback to userId if no specific membership record

      if (userRole === "admin") {
        isAuthorized = true;
      } else if (userRole === "facultyCoordinator") {
        const club = await prisma.club.findFirst({
          where: { id: targetClubId, facultyCoordinatorId: userId },
        });
        if (club) isAuthorized = true;
      } else {
        // Check student membership
        const membership = await prisma.clubMembership.findFirst({
          where: { clubId: targetClubId, studentId: userId },
        });

        if (membership) {
          // Allowed if explicitly granted OR if they are a manager/head
          if (membership.canTakeAttendance || ["CLUB_HEAD", "COORDINATOR"].includes(membership.role)) {
            isAuthorized = true;
            scannerId = membership.id; // Track the specific membership ID
          }
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ message: "Unauthorized: attendance permission required." });
      }

      // Step 3: Guard against double-marking
      if (participation.status === 'ATTENDED') {
        return res.status(409).json({ message: 'Participant already marked as attended.' });
      }

      // Step 4: Mark attendance (single query using unique qrCode field)
      const updated = await prisma.participation.update({
        where: { qrCode },
        data: {
          status: 'ATTENDED',
          attendedAt: new Date(),
          markedByMemberId: scannerId,
        },
      });

      // Step 5: Return attendance confirmation
      const participantName = participation.student?.name || participation.externalName;
      const rollNo = participation.student?.rollNo || null;
      const externalEmail = participation.externalEmail || null;

      return res.status(200).json({
        participantName,
        rollNo,
        externalEmail,
        attendedAt: updated.attendedAt,
        markedByMemberId: scannerId,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;

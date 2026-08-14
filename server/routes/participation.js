import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { verifyTicket } from '../services/qrSigningService.js';
import { createObjectId } from '../utils/objectId.js';

const router = express.Router();

/**
 * Universal attendance verification logic.
 * Handles signed QR payloads (v1 Ed25519), legacy ticket IDs, and direct database lookups.
 */
async function handleVerify(req, res, qrCodeInput, eventIdFromRequest) {
  try {
    const rawInput = (qrCodeInput || '').trim();
    if (!rawInput) {
      return res.status(400).json({
        status: 'INVALID_INPUT',
        message: 'QR code or ticket identifier is required.',
      });
    }

    let targetTicketId = rawInput;
    let targetEventId = null;

    // Try verifying as signed Ed25519 payload first
    try {
      const verified = verifyTicket(rawInput);
      if (verified && verified.valid) {
        targetTicketId = verified.ticketId;
        targetEventId = verified.eventId;
      }
    } catch {
      // Not a signed binary payload, treat as raw ticketId / qrCode
    }

    // Step 1: Look up participation by ticketId, qrPayload, qrCode, or ID
    const participation = await prisma.participation.findFirst({
      where: {
        OR: [
          { qrCode: targetTicketId },
          { qrPayload: rawInput },
          { qrCode: rawInput },
          { id: targetTicketId },
          { id: rawInput },
        ],
      },
      include: { event: true, student: true },
    });

    if (!participation) {
      return res.status(404).json({
        status: 'UNKNOWN_TICKET',
        message: 'Ticket not found. Please check that this student registered for the event.',
      });
    }

    // Check event match if eventId was specified or extracted from QR signature
    const expectedEventId = eventIdFromRequest || targetEventId;
    if (expectedEventId && participation.eventId !== expectedEventId) {
      return res.status(400).json({
        status: 'WRONG_EVENT',
        message: `This pass is registered for "${participation.event?.title || 'another event'}", not this event.`,
      });
    }

    // Step 2: Check caller has permission (Admin, Faculty Coordinator of the club, or Club Manager)
    const { userId, role: userRole } = req.user;
    const targetClubId = participation.event.clubId;

    let isAuthorized = false;
    let scannerId = userId;

    if (userRole === 'admin') {
      isAuthorized = true;
    } else if (userRole === 'facultyCoordinator') {
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
        if (membership.canTakeAttendance || ['CLUB_HEAD', 'COORDINATOR'].includes(membership.role)) {
          isAuthorized = true;
          scannerId = membership.id;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        status: 'UNAUTHORIZED',
        message: "Unauthorized: You do not have attendance scanner permissions for this club's events.",
      });
    }

    // Step 3: Check cancelled
    if (participation.status === 'CANCELLED') {
      return res.status(400).json({
        status: 'TICKET_CANCELLED',
        message: 'This ticket registration has been cancelled.',
      });
    }

    // Step 4: Guard against double-marking
    if (participation.status === 'ATTENDED') {
      return res.status(409).json({
        status: 'ALREADY_ATTENDED',
        message: 'Attendance already recorded for this attendee.',
        participantName: participation.student?.name || participation.externalName || 'Unknown',
        rollNo: participation.student?.rollNo || null,
        externalEmail: participation.externalEmail || null,
        attendedAt: participation.attendedAt,
      });
    }

    // Step 5: Mark attendance in participation and attendanceRecord
    const attendanceId = createObjectId();
    await prisma.$transaction([
      prisma.participation.update({
        where: { id: participation.id },
        data: {
          status: 'ATTENDED',
          attendedAt: new Date(),
          markedByMemberId: scannerId,
        },
      }),
      prisma.attendanceRecord.create({
        data: {
          id: attendanceId,
          eventId: participation.eventId,
          participationId: participation.id,
          scannedAt: new Date(),
          verificationMode: 'ONLINE',
        },
      }),
    ]);

    // Step 6: Return attendance confirmation
    const participantName = participation.student?.name || participation.externalName || 'Unknown';
    const rollNo = participation.student?.rollNo || null;
    const externalEmail = participation.externalEmail || null;

    return res.status(200).json({
      status: 'VALID',
      message: 'Attendance recorded successfully!',
      participantName,
      rollNo,
      externalEmail,
      attendedAt: new Date(),
      markedByMemberId: scannerId,
    });
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        status: 'ALREADY_ATTENDED',
        message: 'Attendance already recorded for this attendee.',
      });
    }
    return res.status(500).json({ message: err.message });
  }
}

// ── PATCH /verify/:qrCode — QR attendance scan (URL param) ────────────────────
router.patch('/verify/:qrCode', verifyToken, async (req, res) => {
  await handleVerify(req, res, req.params.qrCode, req.body?.eventId || req.query?.eventId);
});

// ── POST /verify — QR attendance scan (Request body) ──────────────────────────
router.post('/verify', verifyToken, async (req, res) => {
  await handleVerify(req, res, req.body?.qrCode, req.body?.eventId);
});

export default router;


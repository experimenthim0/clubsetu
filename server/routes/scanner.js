/**
 * CampusNode Scanner API Routes
 *
 * Endpoints for the Android scanner application.
 * Supports both online and offline scanning workflows.
 */

import express from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../middleware/auth.js";
import { validate, objectIdSchema } from "../middleware/validate.js";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";
import { signTicket, verifyTicket, getPublicKeyInfo } from "../services/qrSigningService.js";

const router = express.Router();

// ═══════════════════════════════════════════════════════════════════════════════
// POST /scanner/login — Authenticate scanner user
// ═══════════════════════════════════════════════════════════════════════════════

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

router.post("/login", validate(loginSchema), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Try AdminRole first (faculty coordinator with club)
    const admin = await prisma.adminRole.findUnique({
      where: { email },
      select: { id: true, email: true, password: true, role: true, name: true, coordinatedClubs: { select: { id: true, clubName: true } } },
    });

    if (admin) {
      const match = await bcrypt.compare(password, admin.password);
      if (!match) return res.status(401).json({ message: "Invalid credentials." });

      if (admin.role !== "facultyCoordinator" && admin.role !== "admin") {
        return res.status(403).json({ message: "Scanner access requires club management role." });
      }

      const clubs = admin.coordinatedClubs;
      if (clubs.length === 0 && admin.role !== "admin") {
        return res.status(403).json({ message: "No clubs assigned." });
      }

      const token = generateToken(admin, admin.role, "admin", clubs[0]?.id || null);

      return res.json({
        token,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          userType: "admin",
          clubs: clubs.map((c) => ({ id: c.id, name: c.clubName })),
        },
      });
    }

    // Try StudentUser with ClubMembership
    const student = await prisma.studentUser.findUnique({
      where: { email },
      select: {
        id: true, email: true, password: true, name: true, isBlocked: true,
        memberships: {
          where: { role: { in: ["CLUB_HEAD", "COORDINATOR", "MEMBER"] } },
          include: { club: { select: { id: true, clubName: true } } },
        },
      },
    });

    if (!student) return res.status(401).json({ message: "Invalid credentials." });
    if (student.isBlocked) return res.status(403).json({ message: "Account is blocked." });

    const match = await bcrypt.compare(password, student.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials." });

    // Must have at least one club membership with attendance permission
    const scannerMemberships = student.memberships.filter(
      (m) => m.canTakeAttendance || ["CLUB_HEAD", "COORDINATOR"].includes(m.role),
    );
    if (scannerMemberships.length === 0) {
      return res.status(403).json({ message: "Scanner access requires club membership with attendance permission." });
    }

    const primaryMembership = scannerMemberships.find((m) => ["CLUB_HEAD", "COORDINATOR"].includes(m.role)) || scannerMemberships[0];
    const token = generateToken(student, "club", "student", primaryMembership.clubId);

    return res.json({
      token,
      user: {
        id: student.id,
        name: student.name,
        email: student.email,
        role: primaryMembership.role,
        userType: "student",
        clubs: scannerMemberships.map((m) => ({
          id: m.club.id,
          name: m.club.clubName,
          membershipId: m.id,
          role: m.role,
          canTakeAttendance: m.canTakeAttendance,
        })),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /scanner/events — Get events the user can scan for
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/events", verifyToken, async (req, res) => {
  try {
    const { userId, role, clubId, userType } = req.user;

    let clubIds = [];

    if (role === "admin") {
      // Admin can scan any event — get all clubs
      const clubs = await prisma.club.findMany({ select: { id: true } });
      clubIds = clubs.map((c) => c.id);
    } else if (userType === "admin" && clubId) {
      // Faculty coordinator
      clubIds = [clubId];
    } else {
      // Student with membership
      const memberships = await prisma.clubMembership.findMany({
        where: {
          studentId: userId,
          OR: [{ canTakeAttendance: true }, { role: { in: ["CLUB_HEAD", "COORDINATOR"] } }],
        },
        select: { clubId: true },
      });
      clubIds = memberships.map((m) => m.clubId);
    }

    if (clubIds.length === 0) {
      return res.json({ events: [] });
    }

    const events = await prisma.event.findMany({
      where: {
        clubId: { in: clubIds },
        reviewStatus: "PUBLISHED",
      },
      select: {
        id: true,
        title: true,
        slug: true,
        venue: true,
        startTime: true,
        endTime: true,
        clubId: true,
        registeredCount: true,
        imageUrl: true,
        club: { select: { id: true, clubName: true } },
        _count: { select: { participations: { where: { status: "ATTENDED" } } } },
      },
      orderBy: { startTime: "desc" },
    });

    return res.json({
      events: events.map((e) => ({
        id: e.id,
        title: e.title,
        slug: e.slug,
        venue: e.venue,
        startTime: e.startTime,
        endTime: e.endTime,
        clubId: e.clubId,
        clubName: e.club.clubName,
        registeredCount: e.registeredCount,
        attendedCount: e._count.participations,
        imageUrl: e.imageUrl,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /scanner/events/:eventId/offline-package — Download offline scanning data
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/events/:eventId/offline-package", verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, role, clubId, userType } = req.user;

    // Find event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        venue: true,
        startTime: true,
        endTime: true,
        clubId: true,
        registeredCount: true,
        club: { select: { id: true, clubName: true } },
      },
    });

    if (!event) return res.status(404).json({ message: "Event not found." });

    // Authorization: must belong to the club
    if (role !== "admin") {
      if (userType === "admin") {
        // Faculty coordinator
        if (event.clubId !== clubId) {
          return res.status(403).json({ message: "Unauthorized for this event." });
        }
      } else {
        // Student membership
        const membership = await prisma.clubMembership.findFirst({
          where: {
            studentId: userId,
            clubId: event.clubId,
            OR: [{ canTakeAttendance: true }, { role: { in: ["CLUB_HEAD", "COORDINATOR"] } }],
          },
        });
        if (!membership) {
          return res.status(403).json({ message: "Unauthorized for this event." });
        }
      }
    }

    // Get all registered participations
    const participations = await prisma.participation.findMany({
      where: {
        eventId,
        status: { in: ["REGISTERED", "ATTENDED"] },
      },
      select: {
        id: true,
        qrCode: true,
        qrPayload: true,
        qrVersion: true,
        status: true,
        student: { select: { name: true, branch: true, rollNo: true } },
        externalName: true,
        externalEmail: true,
      },
    });

    // Get existing attendance records
    const existingAttendance = await prisma.attendanceRecord.findMany({
      where: { eventId },
      select: { participationId: true },
    });

    // Public key for offline verification
    const publicKeyInfo = getPublicKeyInfo();

    return res.json({
      packageVersion: 1,
      eventId: event.id,
      event: {
        title: event.title,
        slug: event.slug,
        venue: event.venue,
        startTime: event.startTime,
        endTime: event.endTime,
        clubId: event.clubId,
        clubName: event.club.clubName,
        registeredCount: event.registeredCount,
      },
      tickets: participations.map((p) => ({
        participationId: p.id,
        ticketId: p.qrCode,
        qrPayload: p.qrPayload,
        qrVersion: p.qrVersion,
        status: p.status,
        studentName: p.student?.name || p.externalName || "Unknown",
        branch: p.student?.branch || null,
        rollNo: p.student?.rollNo || null,
        externalEmail: p.externalEmail || null,
      })),
      publicKeys: [publicKeyInfo],
      existingAttendance: existingAttendance.map((a) => a.participationId),
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /scanner/sessions — Create a scanner session
// ═══════════════════════════════════════════════════════════════════════════════

const sessionSchema = z.object({
  body: z.object({
    eventId: z.string().min(1),
    deviceId: z.string().min(1),
    mode: z.enum(["ONLINE", "OFFLINE"]),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

router.post("/sessions", verifyToken, validate(sessionSchema), async (req, res) => {
  try {
    const { eventId, deviceId, mode } = req.body;
    const { userId, clubId } = req.user;

    // Verify event exists
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, clubId: true } });
    if (!event) return res.status(404).json({ message: "Event not found." });

    // For OFFLINE mode, check no other active offline session exists
    if (mode === "OFFLINE") {
      const existingOffline = await prisma.scannerSession.findFirst({
        where: { eventId, mode: "OFFLINE", status: "ACTIVE" },
      });
      if (existingOffline && existingOffline.deviceId !== deviceId) {
        return res.status(409).json({
          message: "Another device already has an active offline session for this event.",
          existingDeviceId: existingOffline.deviceId,
        });
      }
    }

    // Upsert session (same device + event + mode = update)
    const session = await prisma.scannerSession.upsert({
      where: { eventId_deviceId_mode: { eventId, deviceId, mode } },
      update: { status: "ACTIVE", startedAt: new Date(), endedAt: null },
      create: {
        id: createObjectId(),
        eventId,
        clubId: event.clubId,
        userId,
        deviceId,
        mode,
      },
    });

    return res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /scanner/sessions/:sessionId/end — End a scanner session
// ═══════════════════════════════════════════════════════════════════════════════

router.post("/sessions/:sessionId/end", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.scannerSession.update({
      where: { id: sessionId },
      data: { status: "ENDED", endedAt: new Date() },
    });

    return res.json({ session });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /scanner/attendance/check-in — Online check-in (single scan)
// ═══════════════════════════════════════════════════════════════════════════════

const checkInSchema = z.object({
  body: z.object({
    eventId: z.string().min(1),
    qrPayload: z.string().min(1),
    scannerSessionId: z.string().optional(),
    gate: z.string().optional(),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

router.post("/attendance/check-in", verifyToken, validate(checkInSchema), async (req, res) => {
  try {
    const { eventId, qrPayload, scannerSessionId, gate } = req.body;

    // 1. Verify QR signature
    const verification = verifyTicket(qrPayload);
    if (!verification.valid) {
      return res.status(400).json({
        status: verification.error || "INVALID_SIGNATURE",
        message: "Invalid QR code.",
      });
    }

    // 2. Check event binding
    if (verification.eventId !== eventId) {
      return res.status(400).json({
        status: "WRONG_EVENT",
        message: "This pass is not valid for this event.",
      });
    }

    // 3. Find ticket
    const participation = await prisma.participation.findFirst({
      where: { eventId, qrCode: verification.ticketId },
      include: { student: { select: { name: true, branch: true, rollNo: true } } },
    });

    if (!participation) {
      return res.status(404).json({
        status: "UNKNOWN_TICKET",
        message: "Ticket not found.",
      });
    }

    if (participation.status === "CANCELLED") {
      return res.status(400).json({
        status: "TICKET_REVOKED",
        message: "This ticket has been cancelled.",
      });
    }

    // 4. Check duplicate attendance (DB-level)
    const existingAttendance = await prisma.attendanceRecord.findUnique({
      where: { eventId_participationId: { eventId, participationId: participation.id } },
    });

    if (existingAttendance) {
      return res.status(409).json({
        status: "ALREADY_ATTENDED",
        message: "Participant already checked in.",
        participant: {
          name: participation.student?.name || participation.externalName || "Unknown",
          branch: participation.student?.branch || null,
          rollNo: participation.student?.rollNo || null,
        },
        attendedAt: existingAttendance.scannedAt,
      });
    }

    // 5. Record attendance (transaction: create record + update participation status)
    const attendanceId = createObjectId();
    await prisma.$transaction([
      prisma.attendanceRecord.create({
        data: {
          id: attendanceId,
          eventId,
          participationId: participation.id,
          scannerSessionId: scannerSessionId || null,
          scannedAt: new Date(),
          verificationMode: "ONLINE",
          gate: gate || null,
        },
      }),
      prisma.participation.update({
        where: { id: participation.id },
        data: { status: "ATTENDED", attendedAt: new Date(), markedByMemberId: req.user.userId },
      }),
    ]);

    return res.json({
      status: "VALID",
      message: "Check-in successful!",
      participant: {
        name: participation.student?.name || participation.externalName || "Unknown",
        branch: participation.student?.branch || null,
        rollNo: participation.student?.rollNo || null,
      },
      attendedAt: new Date(),
    });
  } catch (err) {
    // Handle unique constraint violation (race condition)
    if (err.code === "P2002") {
      return res.status(409).json({
        status: "ALREADY_ATTENDED",
        message: "Participant already checked in (concurrent scan).",
      });
    }
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// POST /scanner/attendance/sync — Batch sync offline attendance records
// ═══════════════════════════════════════════════════════════════════════════════

const syncSchema = z.object({
  body: z.object({
    eventId: z.string().min(1),
    scannerSessionId: z.string().min(1),
    records: z.array(
      z.object({
        localAttendanceId: z.string().min(1),
        participationId: z.string().min(1),
        scannedAt: z.string().min(1),
        gate: z.string().optional(),
      }),
    ),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

router.post("/attendance/sync", verifyToken, validate(syncSchema), async (req, res) => {
  try {
    const { eventId, scannerSessionId, records } = req.body;

    const results = [];

    for (const record of records) {
      try {
        // Check idempotency — if localAttendanceId already exists, return DUPLICATE
        const existingByLocalId = await prisma.attendanceRecord.findUnique({
          where: { localAttendanceId: record.localAttendanceId },
        });
        if (existingByLocalId) {
          results.push({
            localAttendanceId: record.localAttendanceId,
            status: "DUPLICATE",
            message: "Already synced.",
            serverAttendanceId: existingByLocalId.id,
          });
          continue;
        }

        // Check if attendance already exists for this event+participation
        const existingAttendance = await prisma.attendanceRecord.findUnique({
          where: { eventId_participationId: { eventId, participationId: record.participationId } },
        });
        if (existingAttendance) {
          results.push({
            localAttendanceId: record.localAttendanceId,
            status: "DUPLICATE",
            message: "Attendance already recorded.",
            serverAttendanceId: existingAttendance.id,
          });
          continue;
        }

        // Verify participation exists
        const participation = await prisma.participation.findUnique({
          where: { id: record.participationId },
        });
        if (!participation || participation.eventId !== eventId) {
          results.push({
            localAttendanceId: record.localAttendanceId,
            status: "REJECTED",
            message: "Invalid participation.",
          });
          continue;
        }

        if (participation.status === "CANCELLED") {
          results.push({
            localAttendanceId: record.localAttendanceId,
            status: "REJECTED",
            message: "Ticket cancelled.",
          });
          continue;
        }

        // Create attendance record
        const attendanceId = createObjectId();
        await prisma.$transaction([
          prisma.attendanceRecord.create({
            data: {
              id: attendanceId,
              eventId,
              participationId: record.participationId,
              scannerSessionId,
              scannedAt: new Date(record.scannedAt),
              verificationMode: "OFFLINE",
              syncedAt: new Date(),
              localAttendanceId: record.localAttendanceId,
              gate: record.gate || null,
            },
          }),
          prisma.participation.update({
            where: { id: record.participationId },
            data: { status: "ATTENDED", attendedAt: new Date(record.scannedAt) },
          }),
        ]);

        results.push({
          localAttendanceId: record.localAttendanceId,
          status: "ACCEPTED",
          serverAttendanceId: attendanceId,
        });
      } catch (err) {
        if (err.code === "P2002") {
          results.push({
            localAttendanceId: record.localAttendanceId,
            status: "DUPLICATE",
            message: "Concurrent duplicate.",
          });
        } else {
          results.push({
            localAttendanceId: record.localAttendanceId,
            status: "REJECTED",
            message: err.message,
          });
        }
      }
    }

    return res.json({
      eventId,
      syncedAt: new Date().toISOString(),
      totalRecords: records.length,
      accepted: results.filter((r) => r.status === "ACCEPTED").length,
      duplicates: results.filter((r) => r.status === "DUPLICATE").length,
      rejected: results.filter((r) => r.status === "REJECTED").length,
      results,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /scanner/events/:eventId/sync-state — Get attendance state for an event
// ═══════════════════════════════════════════════════════════════════════════════

router.get("/events/:eventId/sync-state", verifyToken, async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, registeredCount: true },
    });
    if (!event) return res.status(404).json({ message: "Event not found." });

    const attendedCount = await prisma.attendanceRecord.count({ where: { eventId } });
    const attendedIds = await prisma.attendanceRecord.findMany({
      where: { eventId },
      select: { participationId: true, scannedAt: true },
    });

    return res.json({
      eventId,
      registeredCount: event.registeredCount,
      attendedCount,
      attendedParticipations: attendedIds,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GET /scanner/keys/public — Get public verification keys
// ═══════════════════════════════════════════════════════════════════════════════

router.get(["/keys/public", "/keys"], async (req, res) => {
  try {
    const keyInfo = getPublicKeyInfo();
    return res.json({ keys: [keyInfo] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

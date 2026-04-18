import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import { slugifyUnique } from "../utils/slugifyUnique.js";
import prisma from "../lib/prisma.js";
import { serializeEvent, serializeParticipation } from "../utils/postgresEventSerializer.js";
import { createObjectId } from "../utils/objectId.js";
import { z } from "zod";
import { validate, objectIdSchema } from "../middleware/validate.js";

const router = express.Router();

// Helper function to check if a user has access to a club's events
async function checkEventAccess(req, eventClubId, requiredPermission = null) {
  if (req.user.role === 'admin') return true;
  if (req.user.role === 'facultyCoordinator') return String(req.user.clubId) === String(eventClubId);
  
  if (['club', 'member', 'student'].includes(req.user.role)) {
      const membership = await prisma.clubMembership.findFirst({
          where: { studentId: req.user.userId, clubId: eventClubId }
      });
      if (!membership && String(req.user.clubId) === String(eventClubId)) return true;
      if (!membership) return false;
      if (membership.role === 'CLUB_HEAD') return true;
      if (requiredPermission && !membership[requiredPermission]) return false;
      return true;
  }
  return false;
}


const eventSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    venue: z.string().optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    totalSeats: z.coerce.number().int().optional(),
    entryFee: z.coerce.number().optional(),
    imageUrl: z.string().url().optional().or(z.literal("")),
    requiredFields: z.array(z.string()).optional(),
    customFields: z.array(z.any()).optional(),
    allowedPrograms: z.array(z.string()).optional(),
    allowedYears: z.array(z.string()).optional(),
    registrationDeadline: z.coerce.date().optional().nullable(),
    winners: z.array(z.any()).optional(),
    showWinner: z.boolean().optional(),
    provideCertificate: z.boolean().optional(),
    certificateTemplate: z.any().optional(),
    sponsors: z.array(z.object({
      name: z.string().min(1),
      logoUrl: z.string().url(),
      websiteUrl: z.string().url().optional(),
    })).optional(),
    media: z.array(z.object({
      url: z.string().url(),
      type: z.enum(['IMAGE', 'VIDEO', 'SPONSOR_LOGO']),
    })).optional(),
  }).passthrough(),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

const eventUpdateSchema = z.object({
  body: eventSchema.shape.body.partial(),
  query: z.object({}).passthrough().optional(),
  params: z.object({}).passthrough().optional(),
});

// createdBy now comes from StudentUser
const eventInclude = {
  createdBy: {
    select: { id: true, name: true, email: true },
  },
  reviewedBy: {
    select: { id: true, name: true },
  },
  club: {
    select: { id: true, clubName: true, clubLogo: true, slug: true, category: true },
  },
  sponsors: true,
  media: true,
};

// Decode token without middleware — for optional auth on event detail endpoint
const getDecodedToken = (req) => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

const getEventByIdOrSlug = async (id) =>
  prisma.event.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: eventInclude,
  });

// ── GET /events — published events ────────────────────────────────────────────

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const events = await prisma.event.findMany({
      where: { reviewStatus: "PUBLISHED" },
      include: eventInclude,
      orderBy: { startTime: "asc" },
      skip,
      take: limit,
    });

    res.json(events.map(serializeEvent));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /events/club/:clubId — public club events ─────────────────────────────

const clubIdParamSchema = z.object({
  params: z.object({ clubId: objectIdSchema }).passthrough(),
  body: z.any().optional(),
  query: z.any().optional(),
});

router.get("/club/:clubId", validate(clubIdParamSchema), async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      where: { clubId: req.params.clubId },
      include: eventInclude,
      orderBy: { startTime: "asc" },
    });

    res.json(events.map(serializeEvent));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /events/club-manage/:clubId — club management view ────────────────────

router.get(
  "/club-manage/:clubId",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin", "member", "student"),
  validate(clubIdParamSchema),
  async (req, res) => {
    try {
      const targetClubId = req.params.clubId;
      if (!(await checkEventAccess(req, targetClubId))) {
         return res.status(403).json({ message: "Access denied. You don't have permission to view this club's events." });
      }

      const events = await prisma.event.findMany({
        where: { clubId: targetClubId },
        include: eventInclude,
        orderBy: { startTime: "desc" },
      });

      // Fetch attended counts for all events in this club
      const attandanceCounts = await prisma.participation.groupBy({
        by: ['eventId'],
        where: {
          eventId: { in: events.map(e => e.id) },
          status: 'ATTENDED'
        },
        _count: { _all: true }
      });

      const countMap = attandanceCounts.reduce((acc, curr) => {
        acc[curr.eventId] = curr._count._all;
        return acc;
      }, {});

      res.json(events.map(e => ({
        ...serializeEvent(e),
        attendedCount: countMap[e.id] || 0
      })));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── GET /events/club-manage/:clubId/export ────────────────────────────────────

router.get(
  "/club-manage/:clubId/export",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const targetClubId = req.params.clubId;
      if (req.user.role !== "admin" && req.user.clubId !== targetClubId) {
        return res.status(403).json({ message: "Access denied." });
      }

      const where = { clubId: targetClubId };
      const { month, year } = req.query;

      if (year && year !== "all") {
        const y = Number.parseInt(year, 10);
        where.startTime = {
          gte: new Date(y, 0, 1),
          lte: new Date(y, 11, 31, 23, 59, 59),
        };
      }

      let events = await prisma.event.findMany({
        where,
        include: { club: { select: { id: true, clubName: true } } },
        orderBy: { startTime: "desc" },
      });

      if (month && month !== "all") {
        const m = Number.parseInt(month, 10);
        events = events.filter((e) => new Date(e.startTime).getMonth() + 1 === m);
      }

      const successfulParticipations = await prisma.participation.findMany({
        where: {
          eventId: { in: events.length ? events.map((e) => e.id) : ["__none__"] },
          paymentStatus: "SUCCESS",
        },
        select: { eventId: true, amountPaid: true },
      });

      const participationMap = successfulParticipations.reduce((acc, p) => {
        const current = acc.get(p.eventId) ?? [];
        current.push(p);
        acc.set(p.eventId, current);
        return acc;
      }, new Map());

      res.json({
        events: events.map((event) => {
          const parts = participationMap.get(event.id) ?? [];
          return {
            eventName: event.title,
            clubName: event.club?.clubName || "Your Club",
            totalRegistrations: event.registeredCount || parts.length,
            eventDate: event.startTime,
            totalAmountReceived: parts.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          };
        }),
      });
    } catch {
      res.status(500).json({ message: "Failed to export club event data" });
    }
  },
);

// ── GET /events/club-co/:id — events created by a specific user ───────────────

router.get(
  "/club-co/:id",
  verifyToken,
  allowRoles("admin", "facultyCoordinator", "club"),
  async (req, res) => {
    try {
      if (req.user.role !== "admin" && req.user.userId !== req.params.id) {
        return res.status(403).json({ message: "Access denied." });
      }

      const events = await prisma.event.findMany({
        where: { createdById: req.params.id },
        include: eventInclude,
        orderBy: { startTime: "asc" },
      });

      res.json(events.map(serializeEvent));
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── GET /events/user/:userId — events a user is registered for ────────────────

router.get(
  "/user/:userId",
  verifyToken,
  allowRoles("member", "club", "admin", "external", "student"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { userId: authUserId, userType, role } = req.user;

      if (authUserId !== userId && role !== "admin") {
        return res.status(403).json({ message: "Access denied." });
      }

      const isExternal = userType === "external";

      const participations = await prisma.participation.findMany({
        where: isExternal ? { externalEmail: userId } : { studentId: userId },
        include: {
          event: { include: eventInclude },
          student: true,
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        participations.map((p) => {
          const serialized = serializeParticipation(p);
          return {
            ...serialized,
            // Frontend compatibility: eventId is often treated as the object
            eventId: serialized.event,
          };
        }),
      );
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── POST /events — create event ───────────────────────────────────────────────

router.post("/", verifyToken, allowRoles("club", "admin"), validate(eventSchema), async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      startTime,
      endTime,
      totalSeats,
      entryFee,
      imageUrl,
      requiredFields,
      customFields,
      allowedPrograms,
      allowedYears,
      registrationDeadline,
      sponsors,
      media,
    } = req.body;

    if (!req.user.clubId && req.user.role !== "admin") {
      return res.status(403).json({
        message: "You must be associated with a club to create events.",
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    const conflictingEvent = await prisma.event.findFirst({
      where: {
        venue,
        reviewStatus: "PUBLISHED",
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });

    if (conflictingEvent) {
      return res.status(409).json({ message: "Venue is already booked." });
    }

    const savedEvent = await prisma.event.create({
      data: {
        id: createObjectId(),
        title,
        description,
        venue,
        startTime: start,
        endTime: end,
        totalSeats: totalSeats || 0,
        entryFee: Number(entryFee || 0),
        imageUrl: imageUrl || "",
        requiredFields: requiredFields || [],
        customFields: customFields || [],
        createdById: req.user.userId,
        clubId: req.user.clubId || req.body.clubId,
        allowedPrograms: allowedPrograms || ["BTECH", "MTECH", "OTHER"],
        allowedYears: allowedYears || [],
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        slug: await slugifyUnique(title, 'event', 'slug'),
        reviewStatus: "PENDING",
        sponsors: { createMany: { data: (sponsors || []).map(s => ({ id: createObjectId(), ...s })) } },
        media:    { createMany: { data: (media    || []).map(m => ({ id: createObjectId(), ...m })) } },
      },
      include: eventInclude,
    });

    res.status(201).json(serializeEvent(savedEvent));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── PUT /events/:id/review — faculty/admin reviews an event ──────────────────

router.put(
  "/:id/review",
  verifyToken,
  allowRoles("facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const { status, comment } = req.body;
      if (!["PUBLISHED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid review status." });
      }

      const event = await prisma.event.findUnique({ where: { id: req.params.id } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (req.user.role !== "admin" && event.clubId !== req.user.clubId) {
        return res.status(403).json({
          message: "You can only review events for your assigned club.",
        });
      }

      const updated = await prisma.event.update({
        where: { id: req.params.id },
        data: {
          reviewStatus: status,
          reviewComment: comment,
          reviewedById: req.user.userId,
        },
        include: eventInclude,
      });

      res.json({
        message: `Event ${status.toLowerCase()} successfully`,
        event: serializeEvent(updated),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── GET /events/:id — single event (optional auth for draft/pending) ──────────

router.get("/:id", async (req, res) => {
  try {
    const event = await getEventByIdOrSlug(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Calculate attended count dynamically
    const attendedCount = await prisma.participation.count({
      where: { eventId: event.id, status: 'ATTENDED' }
    });

    if (event.reviewStatus !== "PUBLISHED") {
      const decoded = getDecodedToken(req);
      const isCreator = decoded && event.createdById === decoded.userId;
      const isAdmin = decoded?.role === "admin";
      const isAssignedFaculty =
        decoded?.role === "facultyCoordinator" && event.clubId === decoded.clubId;

      if (!isCreator && !isAdmin && !isAssignedFaculty) {
        return res.status(403).json({ message: "This event is currently under review." });
      }
    }

    res.json({
      ...serializeEvent(event),
      attendedCount
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /events/:id/register — register for an event (unified Participation) ─

const registerParamSchema = z.object({
  body: z.object({}).passthrough(),
  query: z.object({}).passthrough().optional(),
  params: z.object({ id: objectIdSchema }),
});

router.post(
  "/:id/register",
  verifyToken,
  allowRoles("member", "club", "facultyCoordinator", "admin", "external"),
  validate(registerParamSchema),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const { externalEmail, externalName } = req.body;
      const isExternal = !!externalEmail;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      // Duplicate check
      if (isExternal) {
        const existing = await prisma.participation.findFirst({
          where: { eventId, externalEmail },
        });
        if (existing) return res.status(400).json({ message: "Already registered for this event." });
      } else {
        const studentId = req.user.userId;
        const existing = await prisma.participation.findFirst({
          where: { eventId, studentId },
        });
        if (existing) return res.status(400).json({ message: "Already registered for this event." });
      }

      const status =
        event.totalSeats > 0 && event.registeredCount >= event.totalSeats
          ? "WAITLISTED"
          : "REGISTERED";

      const qrCode = "QR-" + createObjectId();

      const participationData = isExternal
        ? {
            id: createObjectId(),
            eventId,
            studentId: null,
            externalEmail,
            externalName: externalName || null,
            qrCode,
            status,
          }
        : {
            id: createObjectId(),
            eventId,
            studentId: req.user.userId,
            externalEmail: null,
            externalName: null,
            qrCode,
            status,
          };

      const participation = await prisma.participation.create({ data: participationData });

      if (status === "REGISTERED") {
        await prisma.event.update({
          where: { id: eventId },
          data: { registeredCount: { increment: 1 } },
        });
      }

      res.status(201).json({ message: "Registration successful", status, qrCode: participation.qrCode });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── GET /events/:id/registrations — list participants (club/admin) ─────────────

const registrationsParamSchema = z.object({
  params: z.object({ id: objectIdSchema }).passthrough(),
  body: z.any().optional(),
  query: z.any().optional(),
});

router.get(
  "/:id/registrations",
  verifyToken,
  validate(registrationsParamSchema),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.id } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      // Permission check: admin or facultyCoordinator always allowed;
      // otherwise require ClubMembership with canTakeAttendance OR canEditEvents
      const { role, userId } = req.user;
      if (role !== "admin" && role !== "facultyCoordinator") {
        const membership = await prisma.clubMembership.findFirst({
          where: {
            clubId: event.clubId,
            studentId: userId,
            OR: [{ canTakeAttendance: true }, { canEditEvents: true }],
          },
        });
        if (!membership) {
          return res.status(403).json({ message: "Access denied. You don't have permission to view registrations." });
        }
      }

      const participations = await prisma.participation.findMany({
        where: { eventId: req.params.id },
        include: {
          student: {
            select: { id: true, name: true, email: true, rollNo: true },
          },
        },
      });

      res.json({
        participations: participations.map((p) => ({
          studentId: p.studentId,
          externalEmail: p.externalEmail,
          externalName: p.externalName,
          status: p.status,
          qrCode: p.qrCode,
          attendedAt: p.attendedAt,
          markedByMemberId: p.markedByMemberId,
          student: p.student || null,
        })),
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── PUT /events/:id — update event ────────────────────────────────────────────

router.put("/:id", verifyToken, allowRoles("club", "admin"), validate(eventUpdateSchema), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.createdById !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to update this event." });
    }

    const { sponsors, media } = req.body;

    const allowedFields = [
      "title",
      "description",
      "venue",
      "startTime",
      "endTime",
      "totalSeats",
      "entryFee",
      "imageUrl",
      "requiredFields",
      "customFields",
      "allowedPrograms",
      "allowedYears",
      "registrationDeadline",
      "winners",
      "showWinner",
      "provideCertificate",
      "certificateTemplate",
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.title && updates.title !== event.title) updates.slug = await slugifyUnique(updates.title, 'event', 'slug', req.params.id);
    if (updates.startTime) updates.startTime = new Date(updates.startTime);
    if (updates.endTime) updates.endTime = new Date(updates.endTime);
    if (updates.registrationDeadline !== undefined) {
      updates.registrationDeadline = updates.registrationDeadline
        ? new Date(updates.registrationDeadline)
        : null;
    }
    if (updates.entryFee !== undefined) updates.entryFee = Number(updates.entryFee || 0);
    if (updates.totalSeats !== undefined) updates.totalSeats = Number(updates.totalSeats || 0);

    const updatedEvent = await prisma.$transaction(async (tx) => {
      if (sponsors !== undefined) {
        await tx.sponsor.deleteMany({ where: { eventId: req.params.id } });
        await tx.sponsor.createMany({
          data: sponsors.map(s => ({ id: createObjectId(), eventId: req.params.id, ...s })),
        });
      }

      if (media !== undefined) {
        await tx.media.deleteMany({ where: { eventId: req.params.id } });
        await tx.media.createMany({
          data: media.map(m => ({ id: createObjectId(), eventId: req.params.id, ...m })),
        });
      }

      return tx.event.update({
        where: { id: req.params.id },
        data: updates,
        include: eventInclude,
      });
    });

    res.json(serializeEvent(updatedEvent));
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// ── DELETE /events/:id — delete event ─────────────────────────────────────────

router.delete("/:id", verifyToken, allowRoles("club", "admin"), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.createdById !== req.user.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Unauthorized to delete this event." });
    }

    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: "Event deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── DELETE /events/:id/register — deregister from event ──────────────────────

router.delete(
  "/:id/register",
  verifyToken,
  allowRoles("member", "club", "admin", "external"),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const { studentId } = req.body;
      const { userId, userType } = req.user;

      if (userId !== studentId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to deregister this user." });
      }

      if (userType === "external") {
        const p = await prisma.participation.findFirst({
          where: { eventId, externalEmail: studentId },
        });
        if (!p) return res.status(404).json({ message: "Registration not found." });

        await prisma.$transaction(async (tx) => {
          await tx.participation.delete({ where: { id: p.id } });
          if (p.status === "REGISTERED") {
            await tx.event.update({
              where: { id: eventId },
              data: { registeredCount: { decrement: 1 } },
            });
          }
        });

        return res.json({ message: "Deregistered successfully." });
      }

      const participation = await prisma.participation.findFirst({
        where: { eventId, studentId: studentId },
      });
      if (!participation) return res.status(404).json({ message: "Registration not found." });

      await prisma.$transaction(async (tx) => {
        await tx.participation.delete({ where: { id: participation.id } });

        if (participation.status === "REGISTERED") {
          await tx.event.update({
            where: { id: eventId },
            data: { registeredCount: { decrement: 1 } },
          });
        } else {
          const event = await tx.event.findUnique({ where: { id: eventId } });
          await tx.event.update({
            where: { id: eventId },
            data: {
              waitingListIds: (event?.waitingListIds || []).filter(
                (id) => id !== participation.id,
              ),
            },
          });
        }
      });

      res.json({ message: "Deregistered successfully." });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── POST /events/:id/check-in — QR Attendance Scan ─────────────────────────

router.post(
  "/:id/check-in",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin", "member", "student"),
  async (req, res) => {
    try {
      const { id: eventId } = req.params;
      const { qrCode } = req.body;
      const scannerId = req.user.userId;

      if (!qrCode) return res.status(400).json({ message: "QR Code is required." });

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (!(await checkEventAccess(req, event.clubId, "canTakeAttendance"))) {
        return res.status(403).json({ message: "Unauthorized scanner." });
      }

      // Check both internal and external participations
      let participation = await prisma.participation.findFirst({
        where: { qrCode, eventId },
        include: { student: { select: { name: true, rollNo: true } } },
      });

      let type = "internal";
      if (participation && !participation.studentId) {
        // Handle as external if studentId is null
        type = "external";
      }

      if (!participation) {
        return res.status(404).json({ message: "Invalid QR scan or participant not registered." });
      }

      if (participation.status === "ATTENDED") {
        return res.status(400).json({
          message: "Participant already marked as attended.",
          alreadyAttended: true,
          participantName: type === "internal" ? participation.student?.name : participation.externalName,
        });
      }

      // Update participation using the unified Participation model
      await prisma.participation.update({
        where: { id: participation.id },
        data: {
          status: "ATTENDED",
          attendedAt: new Date(),
          markedByMemberId: scannerId,
        },
      });

      res.json({
        success: true,
        message: "Check-in successful!",
        participant: {
          name: type === "internal" ? participation.student?.name : participation.externalName,
          details: type === "internal" ? participation.student?.rollNo : participation.externalEmail,
          type,
        },
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.post(
  "/:id/attendance-manual",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin", "member", "student"),
  async (req, res) => {
    try {
      const { id: eventId } = req.params;
      const { participationId, type } = req.body;
      const scannerId = req.user.userId;

      if (!participationId || !type) {
        return res.status(400).json({ message: "Participation ID and type are required." });
      }

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (!(await checkEventAccess(req, event.clubId, "canTakeAttendance"))) {
        return res.status(403).json({ message: "Unauthorized to mark attendance for this club." });
      }

      const data = { status: "ATTENDED", attendedAt: new Date(), markedByMemberId: scannerId };

      await prisma.participation.update({ where: { id: participationId }, data });

      res.json({ message: "Participant marked as attended successfully." });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;

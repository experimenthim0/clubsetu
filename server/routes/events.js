import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import prisma from "../lib/prisma.js";
import { serializeEvent, serializeParticipation } from "../utils/postgresEventSerializer.js";
import { createObjectId } from "../utils/objectId.js";
import { z } from "zod";
import { validate } from "../middleware/validate.js";

const router = express.Router();

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

router.get("/club/:clubId", async (req, res) => {
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
  allowRoles("club", "facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const targetClubId = req.params.clubId;
      if (req.user.role !== "admin" && req.user.clubId !== targetClubId) {
        return res.status(403).json({
          message: "Access denied. You can only view events for your assigned club.",
        });
      }

      const events = await prisma.event.findMany({
        where: { clubId: targetClubId },
        include: eventInclude,
        orderBy: { startTime: "desc" },
      });

      res.json(events.map(serializeEvent));
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

      const successfulParticipations = await prisma.collegeEventParticipation.findMany({
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
  allowRoles("member", "club", "admin", "external"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { userId: authUserId, userType } = req.user;

      if (authUserId !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied." });
      }

      if (userType === "external") {
        const participations = await prisma.externalCollegeEventParticipation.findMany({
          where: { externalUserId: userId },
          include: { event: { include: eventInclude } },
          orderBy: { createdAt: "desc" },
        });

        return res.json(
          participations.map((p) => ({
            ...p,
            _id: p.id,
            eventId: serializeEvent(p.event),
          })),
        );
      }

      const participations = await prisma.collegeEventParticipation.findMany({
        where: { userId },
        include: { event: { include: eventInclude } },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        participations.map((p) => ({
          ...serializeParticipation(p),
          eventId: serializeEvent(p.event),
        })),
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
        slug: slugify(title),
        reviewStatus: "PENDING",
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

    res.json(serializeEvent(event));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST /events/:id/register — register for a free event ────────────────────

router.post(
  "/:id/register",
  verifyToken,
  allowRoles("member", "club", "facultyCoordinator", "admin", "external"),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const { userId, userType } = req.user;
      const { formResponses } = req.body;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (event.entryFee > 0) {
        return res.status(400).json({
          message: "This is a paid event. Please register through the payment flow.",
        });
      }

      // External user registration
      if (userType === "external") {
        const existing = await prisma.externalCollegeEventParticipation.findFirst({
          where: { eventId, externalUserId: userId },
        });
        if (existing) return res.status(400).json({ message: "Already registered." });

        const status =
          event.totalSeats > 0 && event.registeredCount >= event.totalSeats
            ? "WAITLISTED"
            : "REGISTERED";

        await prisma.$transaction(async (tx) => {
          const p = await tx.externalCollegeEventParticipation.create({
            data: {
              id: createObjectId(),
              eventId,
              externalUserId: userId,
              status,
              formResponses: formResponses || {},
            },
          });

          if (status === "REGISTERED") {
            await tx.event.update({
              where: { id: eventId },
              data: { registeredCount: { increment: 1 } },
            });
          } else {
            const e = await tx.event.findUnique({ where: { id: eventId } });
            await tx.event.update({
              where: { id: eventId },
              data: { waitingListIds: [...(e?.waitingListIds || []), p.id] },
            });
          }
        });

        return res.json({ message: "Registration successful", status });
      }

      // Internal student registration
      const student = await prisma.studentUser.findUnique({ where: { id: userId } });
      if (!student) return res.status(404).json({ message: "User not found." });

      if (
        event.allowedPrograms?.length > 0 &&
        student.program &&
        !event.allowedPrograms.includes(student.program)
      ) {
        return res.status(403).json({ message: "Ineligible program." });
      }

      const existing = await prisma.collegeEventParticipation.findFirst({
        where: { eventId, userId },
      });
      if (existing) return res.status(400).json({ message: "Already registered." });

      const status =
        event.totalSeats > 0 && event.registeredCount >= event.totalSeats
          ? "WAITLISTED"
          : "REGISTERED";

      await prisma.$transaction(async (tx) => {
        const p = await tx.collegeEventParticipation.create({
          data: {
            id: createObjectId(),
            eventId,
            userId,
            status,
            formResponses: formResponses || {},
          },
        });

        if (status === "REGISTERED") {
          await tx.event.update({
            where: { id: eventId },
            data: { registeredCount: { increment: 1 } },
          });
        } else {
          const e = await tx.event.findUnique({ where: { id: eventId } });
          await tx.event.update({
            where: { id: eventId },
            data: { waitingListIds: [...(e?.waitingListIds || []), p.id] },
          });
        }
      });

      res.json({ message: "Registration successful", status });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── GET /events/:id/registrations — list participants (club/admin) ─────────────

router.get(
  "/:id/registrations",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.id } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (req.user.role !== "admin" && event.clubId !== req.user.clubId) {
        return res.status(403).json({
          message: "Access denied. You can only view registrations for your own club's events.",
        });
      }

      const participations = await prisma.collegeEventParticipation.findMany({
        where: { eventId: req.params.id },
        include: {
          student: {
            select: { id: true, name: true, email: true, rollNo: true, program: true, year: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        participations.map((p) => ({
          ...serializeParticipation(p),
          student: p.student ? { ...p.student, _id: p.student.id } : null,
        })),
      );
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

    const data = { ...req.body };
    if (data.title && data.title !== event.title) data.slug = slugify(data.title);
    if (data.startTime) data.startTime = new Date(data.startTime);
    if (data.endTime) data.endTime = new Date(data.endTime);
    if (data.registrationDeadline !== undefined) {
      data.registrationDeadline = data.registrationDeadline
        ? new Date(data.registrationDeadline)
        : null;
    }
    if (data.entryFee !== undefined) data.entryFee = Number(data.entryFee || 0);
    if (data.totalSeats !== undefined) data.totalSeats = Number(data.totalSeats || 0);

    const updatedEvent = await prisma.event.update({
      where: { id: req.params.id },
      data,
      include: eventInclude,
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
        const p = await prisma.externalCollegeEventParticipation.findFirst({
          where: { eventId, externalUserId: studentId },
        });
        if (!p) return res.status(404).json({ message: "Registration not found." });

        await prisma.$transaction(async (tx) => {
          await tx.externalCollegeEventParticipation.delete({ where: { id: p.id } });
          if (p.status === "REGISTERED") {
            await tx.event.update({
              where: { id: eventId },
              data: { registeredCount: { decrement: 1 } },
            });
          }
        });

        return res.json({ message: "Deregistered successfully." });
      }

      const participation = await prisma.collegeEventParticipation.findFirst({
        where: { eventId, userId: studentId },
      });
      if (!participation) return res.status(404).json({ message: "Registration not found." });

      await prisma.$transaction(async (tx) => {
        await tx.collegeEventParticipation.delete({ where: { id: participation.id } });

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

export default router;

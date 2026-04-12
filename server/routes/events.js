import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import prisma from "../lib/prisma.js";
import {
  serializeEvent,
  serializeRegistration,
} from "../utils/postgresEventSerializer.js";
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

const eventInclude = {
  createdBy: {
    select: { id: true, name: true, email: true, clubId: true },
  },
  reviewedBy: {
    select: { id: true, name: true },
  },
  club: {
    select: { id: true, clubName: true, clubLogo: true, slug: true, category: true },
  },
};

const verifyTokenInternal = (token) => jwt.verify(token, process.env.JWT_SECRET);

const getPostgresEventByIdOrSlug = async (id) =>
  prisma.event.findFirst({
    where: { OR: [{ id }, { slug: id }] },
    include: eventInclude,
  });

const getAuthorizedUserFromRequest = async (req) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return null;

  try {
    const decoded = verifyTokenInternal(token);
    return prisma.user.findUnique({ where: { id: decoded.userId } });
  } catch {
    return null;
  }
};

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
        events = events.filter((event) => new Date(event.startTime).getMonth() + 1 === m);
      }

      const successfulRegistrations = await prisma.registration.findMany({
        where: {
          eventId: { in: events.length ? events.map((event) => event.id) : ["__none__"] },
          paymentStatus: "SUCCESS",
        },
        select: { eventId: true, amountPaid: true },
      });

      const registrationMap = successfulRegistrations.reduce((acc, reg) => {
        const current = acc.get(reg.eventId) ?? [];
        current.push(reg);
        acc.set(reg.eventId, current);
        return acc;
      }, new Map());

      res.json({
        events: events.map((event) => {
          const regs = registrationMap.get(event.id) ?? [];
          return {
            eventName: event.title,
            clubName: event.club?.clubName || "Your Club",
            totalRegistrations: event.registeredCount || regs.length,
            eventDate: event.startTime,
            totalAmountReceived: regs.reduce((sum, reg) => sum + (reg.amountPaid || 0), 0),
          };
        }),
      });
    } catch {
      res.status(500).json({ message: "Failed to export club event data" });
    }
  },
);

router.get("/club-co/:id", verifyToken, allowRoles("admin", "facultyCoordinator", "club"), async (req, res) => {
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
});

router.get("/user/:userId", verifyToken, allowRoles("member", "admin"), async (req, res) => {
  try {
    if (req.user.userId !== req.params.userId && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied." });
    }

    const registrations = await prisma.registration.findMany({
      where: { userId: req.params.userId },
      include: {
        event: { include: eventInclude },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      registrations.map((registration) => ({
        ...serializeRegistration(registration),
        eventId: serializeEvent(registration.event),
      })),
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

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

router.get("/:id", async (req, res) => {
  try {
    const event = await getPostgresEventByIdOrSlug(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.reviewStatus !== "PUBLISHED") {
      const user = await getAuthorizedUserFromRequest(req);
      const isCreator = user && event.createdById === user.id;
      const isAdmin = user?.role === "admin";
      const isAssignedFaculty =
        user?.role === "facultyCoordinator" &&
        event.clubId === user.clubId;

      if (!isCreator && !isAdmin && !isAssignedFaculty) {
        return res.status(403).json({ message: "This event is currently under review." });
      }
    }

    res.json(serializeEvent(event));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post(
  "/:id/register",
  verifyToken,
  allowRoles("member", "club", "facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const { userId } = req.user;
      const { formResponses } = req.body;

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (event.entryFee > 0) {
        return res.status(400).json({
          message: "This is a paid event. Please register through the payment flow.",
        });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return res.status(404).json({ message: "User not found." });

      if (
        event.allowedPrograms?.length > 0 &&
        user.program &&
        !event.allowedPrograms.includes(user.program)
      ) {
        return res.status(403).json({ message: "Ineligible program." });
      }

      const existingReg = await prisma.registration.findFirst({
        where: { eventId, userId },
      });
      if (existingReg) {
        return res.status(400).json({ message: "Already registered." });
      }

      const status =
        event.totalSeats > 0 && event.registeredCount >= event.totalSeats
          ? "WAITLISTED"
          : "CONFIRMED";

      await prisma.$transaction(async (tx) => {
        const registration = await tx.registration.create({
          data: {
            id: createObjectId(),
            eventId,
            userId,
            status,
            formResponses: formResponses || {},
          },
        });

        if (status === "CONFIRMED") {
          await tx.event.update({
            where: { id: eventId },
            data: { registeredCount: { increment: 1 } },
          });
        } else {
          const existingEvent = await tx.event.findUnique({ where: { id: eventId } });
          await tx.event.update({
            where: { id: eventId },
            data: { waitingListIds: [...(existingEvent?.waitingListIds || []), registration.id] },
          });
        }
      });

      res.json({ message: "Registration successful", status });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get(
  "/:id/registrations",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.id } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (req.user.role !== "admin" && event.clubId !== req.user.clubId) {
        return res.status(403).json({ message: "Access denied. You can only view registrations for your own club's events." });
      }

      const registrations = await prisma.registration.findMany({
        where: { eventId: req.params.id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              rollNo: true,
              program: true,
              year: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        registrations.map((reg) => ({
          ...serializeRegistration(reg),
          student: reg.user ? { ...reg.user, _id: reg.user.id } : null,
        })),
      );
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

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
      data.registrationDeadline = data.registrationDeadline ? new Date(data.registrationDeadline) : null;
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

router.delete(
  "/:id/register",
  verifyToken,
  allowRoles("member", "admin"),
  async (req, res) => {
    try {
      const eventId = req.params.id;
      const { studentId } = req.body;

      if (req.user.userId !== studentId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to deregister this user." });
      }

      const registration = await prisma.registration.findFirst({
        where: { eventId, userId: studentId },
      });

      if (!registration) {
        return res.status(404).json({ message: "Registration not found." });
      }

      await prisma.$transaction(async (tx) => {
        await tx.registration.delete({ where: { id: registration.id } });

        if (registration.status === "CONFIRMED") {
          await tx.event.update({
            where: { id: eventId },
            data: { registeredCount: { decrement: 1 } },
          });
        } else {
          const event = await tx.event.findUnique({ where: { id: eventId } });
          await tx.event.update({
            where: { id: eventId },
            data: {
              waitingListIds: (event?.waitingListIds || []).filter((id) => id !== registration.id),
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

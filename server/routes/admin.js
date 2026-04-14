import express from "express";
import bcrypt from "bcryptjs";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../utils/slugify.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();

// ── GET /admin/dashboard-stats ────────────────────────────────────────────────

router.get(
  "/dashboard-stats",
  verifyToken,
  allowRoles("admin", "paymentAdmin"),
  async (req, res) => {
    try {
      const [events, participations, totalStudents, totalClubs, totalEventsActive, totalEventsAll] =
        await Promise.all([
          prisma.event.findMany({
            include: {
              club: { select: { id: true, clubName: true } },
              createdBy: { select: { id: true, name: true } },
            },
          }),
          prisma.collegeEventParticipation.findMany({ where: { paymentStatus: "SUCCESS" } }),
          prisma.studentUser.count(),
          prisma.club.count(),
          prisma.event.count({ where: { reviewStatus: "PUBLISHED" } }),
          prisma.event.count(),
        ]);

      const participationsByEvent = participations.reduce((acc, p) => {
        const current = acc.get(p.eventId) ?? [];
        current.push(p);
        acc.set(p.eventId, current);
        return acc;
      }, new Map());

      const eventStats = events.map((event) => {
        const eventParts = participationsByEvent.get(event.id) ?? [];
        return {
          eventId: event.id,
          title: event.title,
          clubName: event.club?.clubName || "Unknown",
          creatorId: event.createdBy?.id || null,
          clubHeadId: event.createdBy?.id || null,
          registeredCount: event.registeredCount || 0,
          totalCollected: eventParts.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
          regCount: eventParts.length,
          entryFee: event.entryFee,
          payoutStatus: event.payoutStatus || "PENDING",
          registrationDeadline: event.registrationDeadline,
          startTime: event.startTime,
        };
      });

      const yearWiseMap = events.reduce((acc, event) => {
        const year = new Date(event.startTime).getFullYear();
        acc.set(year, (acc.get(year) ?? 0) + 1);
        return acc;
      }, new Map());

      res.json({
        totalRevenue: participations.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
        totalStudents,
        totalClubs,
        totalEvents: totalEventsActive,
        totalEventsTillNow: totalEventsAll,
        yearWiseEvents: [...yearWiseMap.entries()]
          .sort((a, b) => b[0] - a[0])
          .map(([year, count]) => ({ _id: year, count })),
        eventStats,
      });
    } catch {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  },
);

// ── POST /admin/complete-payout/:eventId ──────────────────────────────────────

router.post(
  "/complete-payout/:eventId",
  verifyToken,
  allowRoles("admin", "paymentAdmin"),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      const deadline = event.registrationDeadline || event.startTime;
      if (new Date() < new Date(deadline)) {
        return res.status(400).json({
          message: "Payout can only be completed after the registration deadline has passed.",
        });
      }

      await prisma.event.update({
        where: { id: req.params.eventId },
        data: { payoutStatus: "COMPLETED" },
      });

      res.json({ success: true, message: "Payout marked as completed" });
    } catch {
      res.status(500).json({ message: "Failed to update payout status" });
    }
  },
);

// ── GET /admin/user-info/:id — bank info for payout (StudentUser) ─────────────

router.get("/user-info/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const student = await prisma.studentUser.findUnique({ where: { id: req.params.id } });
    if (!student) return res.status(404).json({ message: "User not found" });

    const membership = await prisma.clubMembership.findFirst({
      where: { userId: student.id, role: "clubHead" },
      include: { club: { select: { clubName: true } } },
    });

    res.json({
      name: student.name,
      email: student.email,
      role: membership ? "club" : "member",
      clubId: membership?.clubId ?? null,
      clubName: membership?.club?.clubName ?? null,
      bankInfo: {
        bankName: student.bankName,
        accountHolderName: student.accountHolderName,
        accountNumber: student.accountNumber
          ? student.accountNumber.slice(-4).padStart(student.accountNumber.length, "X")
          : null,
        ifscCode: student.ifscCode,
        upiId: student.upiId,
        bankPhone: student.bankPhone,
      },
    });
  } catch {
    res.status(500).json({ message: "Error fetching user info" });
  }
});

// ── GET /admin/clubs-list ─────────────────────────────────────────────────────

router.get("/clubs-list", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        facultyCoordinator: { select: { id: true, name: true, email: true } },
        clubHead: { select: { id: true, name: true, email: true } },
      },
      orderBy: { clubName: "asc" },
    });

    res.json(
      clubs.map((club) => ({
        ...club,
        _id: club.id,
        facultyCoordinators: club.facultyCoordinator
          ? [{ ...club.facultyCoordinator, _id: club.facultyCoordinator.id }]
          : [],
      })),
    );
  } catch {
    res.status(500).json({ message: "Failed to fetch clubs" });
  }
});

// ── GET /admin/event-data-export ──────────────────────────────────────────────

router.get("/event-data-export", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { month, year, clubId } = req.query;
    const where = {};

    if (clubId && clubId !== "all") where.clubId = clubId;
    if (year && year !== "all") {
      const y = Number.parseInt(year, 10);
      where.startTime = {
        gte: new Date(y, 0, 1),
        lte: new Date(y, 11, 31, 23, 59, 59),
      };
    }

    let events = await prisma.event.findMany({
      where,
      include: {
        club: { select: { id: true, clubName: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "desc" },
    });

    if (month && month !== "all") {
      const m = Number.parseInt(month, 10);
      events = events.filter((e) => new Date(e.startTime).getMonth() + 1 === m);
    }

    const participations = await prisma.collegeEventParticipation.findMany({
      where: {
        eventId: { in: events.length ? events.map((e) => e.id) : ["__none__"] },
        paymentStatus: "SUCCESS",
      },
      select: { eventId: true, amountPaid: true },
    });

    const participationsByEvent = participations.reduce((acc, p) => {
      const current = acc.get(p.eventId) ?? [];
      current.push(p);
      acc.set(p.eventId, current);
      return acc;
    }, new Map());

    res.json({
      events: events.map((event) => {
        const eventParts = participationsByEvent.get(event.id) ?? [];
        return {
          eventId: event.id,
          eventName: event.title,
          clubName: event.club?.clubName || "Unknown",
          totalRegistrations: event.registeredCount || eventParts.length,
          eventType: event.entryFee > 0 ? "Paid" : "Free",
          eventDate: event.startTime,
          totalAmountReceived: eventParts.reduce((sum, p) => sum + (p.amountPaid || 0), 0),
        };
      }),
    });
  } catch {
    res.status(500).json({ message: "Failed to export event data" });
  }
});

// ── POST /admin/clubs — create club with head and faculty coordinator ──────────

router.post("/clubs", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { clubName, facultyName, facultyEmail, clubEmail } = req.body;
    const slug = slugify(clubName);
    const passwordHash = await bcrypt.hash(`${slug}@him0148`, 10);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the Club record
      const club = await tx.club.create({
        data: {
          id: createObjectId(),
          clubName,
          slug,
          facultyName,
          facultyEmail,
          clubEmail,
        },
      });

      // 2. Create AdminRole for the faculty coordinator
      const facultyUser = await tx.adminRole.create({
        data: {
          id: createObjectId(),
          name: facultyName,
          email: facultyEmail,
          password: passwordHash,
          role: "facultyCoordinator",
          isVerified: true,
          isTwoStepEnabled: true,
        },
      });

      // 3. Create StudentUser for the club's management account (club head)
      const clubUser = await tx.studentUser.create({
        data: {
          id: createObjectId(),
          name: clubName.toUpperCase(),
          email: clubEmail,
          password: passwordHash,
          isVerified: true,
          isTwoStepEnabled: true,
        },
      });

      // 4. Create ClubMembership marking this StudentUser as club head
      await tx.clubMembership.create({
        data: {
          id: createObjectId(),
          userId: clubUser.id,
          clubId: club.id,
          role: "clubHead",
        },
      });

      // 5. Update Club with FK references
      return tx.club.update({
        where: { id: club.id },
        data: {
          clubHeadId: clubUser.id,
          facultyCoordinatorId: facultyUser.id,
        },
      });
    });

    res.status(201).json({
      message: "Club and associated users created successfully",
      club: { ...result, _id: result.id },
    });
  } catch (error) {
    res.status(500).json({ message: error.message || "Failed to create club" });
  }
});

export default router;

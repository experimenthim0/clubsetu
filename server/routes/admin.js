import express from "express";
import bcrypt from "bcryptjs";
import { verifyToken, allowRoles, generateToken } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../utils/slugify.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await prisma.user.findFirst({
      where: { email, role: { in: ["admin", "paymentAdmin"] } },
    });

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = generateToken(admin, "admin");
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      admin: { email: admin.email, role: admin.role },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during admin login" });
  }
});

router.get(
  "/dashboard-stats",
  verifyToken,
  allowRoles("admin", "paymentAdmin"),
  async (req, res) => {
    try {
      const [events, registrations, totalStudents, totalClubs, totalEventsActive, totalEventsAll] =
        await Promise.all([
          prisma.event.findMany({
            where: { entryFee: { gt: 0 } },
            include: {
              club: { select: { id: true, clubName: true } },
              createdBy: { select: { id: true, name: true, clubId: true } },
            },
          }),
          prisma.registration.findMany({ where: { paymentStatus: "SUCCESS" } }),
          prisma.user.count({ where: { role: "member" } }),
          prisma.club.count(),
          prisma.event.count({ where: { reviewStatus: "PUBLISHED" } }),
          prisma.event.count(),
        ]);

      const registrationsByEvent = registrations.reduce((acc, reg) => {
        const current = acc.get(reg.eventId) ?? [];
        current.push(reg);
        acc.set(reg.eventId, current);
        return acc;
      }, new Map());

      const eventStats = events.map((event) => {
        const eventRegs = registrationsByEvent.get(event.id) ?? [];
        return {
          eventId: event.id,
          title: event.title,
          clubName: event.club?.clubName || "Unknown",
          creatorId: event.createdBy?.id || null,
          totalCollected: eventRegs.reduce((sum, reg) => sum + (reg.amountPaid || 0), 0),
          regCount: eventRegs.length,
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
        totalRevenue: registrations.reduce((sum, reg) => sum + (reg.amountPaid || 0), 0),
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
          message:
            "Payout can only be completed after the registration deadline has passed.",
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

router.get("/user-info/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      name: user.name,
      email: user.email,
      role: user.role,
      clubId: user.clubId,
      bankInfo: {
        bankName: user.bankName,
        accountHolderName: user.accountHolderName,
        accountNumber: user.accountNumber,
        ifscCode: user.ifscCode,
        upiId: user.upiId,
        bankPhone: user.bankPhone,
      },
    });
  } catch {
    res.status(500).json({ message: "Error fetching user info" });
  }
});

router.get("/clubs-list", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        users: {
          where: { role: "facultyCoordinator" },
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { clubName: "asc" },
    });

    res.json(
      clubs.map((club) => ({
        ...club,
        _id: club.id,
        facultyCoordinators: club.users.map((user) => ({
          ...user,
          _id: user.id,
        })),
      })),
    );
  } catch {
    res.status(500).json({ message: "Failed to fetch clubs" });
  }
});

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
      events = events.filter((event) => new Date(event.startTime).getMonth() + 1 === m);
    }

    const registrations = await prisma.registration.findMany({
      where: {
        eventId: { in: events.length ? events.map((event) => event.id) : ["__none__"] },
        paymentStatus: "SUCCESS",
      },
      select: { eventId: true, amountPaid: true },
    });

    const registrationsByEvent = registrations.reduce((acc, reg) => {
      const current = acc.get(reg.eventId) ?? [];
      current.push(reg);
      acc.set(reg.eventId, current);
      return acc;
    }, new Map());

    res.json({
      events: events.map((event) => {
        const successfulRegistrations = registrationsByEvent.get(event.id) ?? [];
        return {
          eventId: event.id,
          eventName: event.title,
          clubName: event.club?.clubName || "Unknown",
          totalRegistrations: event.registeredCount || successfulRegistrations.length,
          eventType: event.entryFee > 0 ? "Paid" : "Free",
          eventDate: event.startTime,
          totalAmountReceived: successfulRegistrations.reduce(
            (sum, registration) => sum + (registration.amountPaid || 0),
            0,
          ),
        };
      }),
    });
  } catch {
    res.status(500).json({ message: "Failed to export event data" });
  }
});

router.post("/clubs", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { clubName, facultyName, facultyEmail, clubEmail } = req.body;
    const slug = slugify(clubName);
    const passwordHash = await bcrypt.hash(`${slug}@him0148`, 10);

    const result = await prisma.$transaction(async (tx) => {
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

      await tx.user.create({
        data: {
          id: createObjectId(),
          name: clubName.toUpperCase(),
          email: clubEmail,
          password: passwordHash,
          role: "club",
          clubId: club.id,
          isVerified: true,
          isTwoStepEnabled: true,
        },
      });

      const facultyUser = await tx.user.create({
        data: {
          id: createObjectId(),
          name: facultyName,
          email: facultyEmail,
          password: passwordHash,
          role: "facultyCoordinator",
          clubId: club.id,
          isVerified: true,
          isTwoStepEnabled: true,
        },
      });

      return tx.club.update({
        where: { id: club.id },
        data: { facultyCoordinatorIds: [facultyUser.id] },
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

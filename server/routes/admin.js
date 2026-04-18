import express from "express";
import bcrypt from "bcryptjs";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../utils/slugify.js";
import { slugifyUnique } from "../utils/slugifyUnique.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();

// ── POST /admin/login ──────────────────────────────────────────────────────────
// Re-mounting for frontend compatibility
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await prisma.adminRole.findUnique({ where: { email } });
    if (!admin) return res.status(401).json({ success: false, message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });

    // 2FA check (matching auth.js behavior)
    if (admin.isTwoStepEnabled) {
      // Logic for OTP would go here, but since seed has it false, we'll keep it simple or redirect
      // For now, let's keep it consistent:
      return res.status(403).json({ success: false, message: "Please use the official login route for 2FA accounts." });
    }

    const { generateToken } = await import("../middleware/auth.js");
    const club = admin.role === "facultyCoordinator" ? await prisma.club.findFirst({ where: { facultyCoordinatorId: admin.id } }) : null;
    const token = generateToken(admin, admin.role, "admin", club?.id);

    res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 7 * 24 * 60 * 60 * 1000 });

    res.json({
      success: true,
      message: "Admin login successful",
      admin: { ...admin, _id: admin.id, clubId: club?.id }, // Include clubId for frontend compatibility
      token
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


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
          prisma.participation.findMany({ where: { paymentStatus: "SUCCESS" } }),
          prisma.studentUser.count({
            where: {
              NOT: {
                memberships: {
                  some: { role: "CLUB_HEAD" }
                }
              }
            }
          }),
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
      where: { studentId: student.id, role: "CLUB_HEAD" },
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
        memberships: {
          where: { role: "CLUB_HEAD" },
          select: { student: { select: { id: true, name: true, email: true } } },
          take: 1
        }
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

    const participations = await prisma.participation.findMany({
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
    const slug = await slugifyUnique(clubName, 'club', 'slug');
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
        },
      });

      // 3. Create StudentUser for the club's management account (club head)
      const clubUser = await tx.studentUser.create({
        data: {
          id: createObjectId(),
          name: clubName.toUpperCase(),
          email: clubEmail,
          password: passwordHash,
        },
      });

      // 4. Create ClubMembership marking this StudentUser as club head
      await tx.clubMembership.create({
        data: {
          id: createObjectId(),
          studentId: clubUser.id,
          clubId: club.id,
          role: "CLUB_HEAD",
          canTakeAttendance: true,
          canEditEvents: true,
        },
      });

      // 5. Update Club with FK references
      return tx.club.update({
        where: { id: club.id },
        data: {
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

// ── GET /admin/coordinators — list all faculty coordinators ────────────────────

router.get("/coordinators", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const coordinators = await prisma.adminRole.findMany({
      where: { role: "facultyCoordinator" },
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    });

    res.json(coordinators.map(c => ({ ...c, _id: c.id })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coordinators" });
  }
});

// ── POST /admin/coordinators — create a new coordinator ────────────────────────

router.post("/coordinators", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const passwordHash = await bcrypt.hash(password || "coordinator123", 10);

    const coordinator = await prisma.adminRole.create({
      data: {
        id: createObjectId(),
        name,
        email,
        password: passwordHash,
        role: "facultyCoordinator",
      },
    });

    res.status(201).json({
      message: "Coordinator created successfully",
      coordinator: { ...coordinator, _id: coordinator.id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to create coordinator" });
  }
});

// ── PUT /admin/coordinators/:id — update coordinator ───────────────────────────

router.put("/coordinators/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const data = { name, email };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const coordinator = await prisma.adminRole.update({
      where: { id: req.params.id },
      data,
    });

    res.json({
      message: "Coordinator updated successfully",
      coordinator: { ...coordinator, _id: coordinator.id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update coordinator" });
  }
});

// ── PUT /admin/clubs/:id — update club (admin only) ─────────────────────────────

router.put("/clubs/:id", verifyToken, allowRoles("admin"), async (req, res) => {
  try {
    const { clubName, clubEmail, facultyCoordinatorId, facultyName, facultyEmail } = req.body;
    const updates = { clubName, clubEmail, facultyCoordinatorId, facultyName, facultyEmail };

    if (clubName) {
      updates.slug = await slugifyUnique(clubName, 'club', 'slug', req.params.id);
    }

    const club = await prisma.club.update({
      where: { id: req.params.id },
      data: updates,
    });

    res.json({
      message: "Club updated successfully",
      club: { ...club, _id: club.id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || "Failed to update club" });
  }
});

export default router;

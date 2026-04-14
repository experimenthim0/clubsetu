import express from "express";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import prisma from "../lib/prisma.js";
import { serializeEvent } from "../utils/postgresEventSerializer.js";

const router = express.Router();

// ── GET /clubs — all clubs with faculty coordinator ───────────────────────────

router.get("/", async (req, res) => {
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
        // Normalise to array for API compatibility
        facultyCoordinators: club.facultyCoordinator
          ? [{ ...club.facultyCoordinator, _id: club.facultyCoordinator.id }]
          : [],
      })),
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /clubs/:id — single club with published events ────────────────────────

router.get("/:id", async (req, res) => {
  try {
    const club = await prisma.club.findFirst({
      where: {
        OR: [{ id: req.params.id }, { slug: req.params.id }],
      },
      include: {
        facultyCoordinator: { select: { id: true, name: true, email: true } },
        clubHead: { select: { id: true, name: true } },
        socialLinks: true,
        media: true,
      },
    });

    if (!club) {
      return res.status(404).json({ message: "Club not found" });
    }

    const events = await prisma.event.findMany({
      where: { clubId: club.id, reviewStatus: "PUBLISHED" },
      include: {
        club: { select: { id: true, clubName: true, clubLogo: true, slug: true, category: true } },
        createdBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { startTime: "asc" },
    });

    res.json({
      club: { ...club, _id: club.id },
      events: events.map(serializeEvent),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /clubs/:id — update club (admin or assigned club head) ────────────────

router.put("/:id", verifyToken, allowRoles("admin", "club"), async (req, res) => {
  try {
    const targetClubId = req.params.id;
    const { clubId, role } = req.user;

    if (role !== "admin" && clubId !== targetClubId) {
      return res.status(403).json({
        message: "Access denied. You can only update your own club.",
      });
    }

    const updates = { ...req.body };
    if (updates.clubName) {
      updates.slug = slugify(updates.clubName);
    }

    const club = await prisma.club.update({
      where: { id: targetClubId },
      data: updates,
    });

    res.json({
      message: "Club updated successfully",
      club: { ...club, _id: club.id },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

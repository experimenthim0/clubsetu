import express from "express";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";
import { slugifyUnique } from "../utils/slugifyUnique.js";
import prisma from "../lib/prisma.js";
import { serializeEvent } from "../utils/postgresEventSerializer.js";
import crypto from "crypto";

const router = express.Router();

// ── GET /clubs — all clubs with faculty coordinator ───────────────────────────

router.get("/", async (req, res) => {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        facultyCoordinator: { select: { id: true, name: true, email: true } },
        socialLinks: true,
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
        socialLinks: true,
        media: { where: { eventId: null } },
        sponsors: { where: { eventId: null } },
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
       club: { 
        ...club, 
        _id: club.id,
        clubGallery: club.media?.map(m => m.url) || [],
        clubSponsors: club.sponsors?.map(s => s.logoUrl) || []
      },
      events: events.map(serializeEvent),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── PUT /clubs/:id — update club (admin or assigned club head) ────────────────

router.put("/:id", verifyToken, allowRoles("admin", "club", "facultyCoordinator"), async (req, res) => {
  try {
    const targetClubId = req.params.id;
    const { clubId, role } = req.user;

    if (role !== "admin" && String(clubId) !== String(targetClubId)) {
      return res.status(403).json({
        message: "Access denied. You can only update your own club.",
      });
    }

    const allowedFields = [
      "clubName",
      "description",
      "category",
      "clubEmail",
      "facultyEmail",
      "facultyName",
      "clubLogo",
      "bankName",
      "accountHolderName",
      "accountNumber",
      "ifscCode",
      "upiId",
      "bankPhone",
      "studentCoordinators"

    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (updates.clubName) {
      updates.slug = await slugifyUnique(updates.clubName, 'club', 'slug', targetClubId);
    }

    const club = await prisma.club.update({
      where: { id: targetClubId },
      data: updates,
    });

    if (req.body.socialLinks && Array.isArray(req.body.socialLinks)) {
      await prisma.clubSocialLink.deleteMany({
        where: { clubId: targetClubId },
      });
      if (req.body.socialLinks.length > 0) {
        await prisma.clubSocialLink.createMany({
          data: req.body.socialLinks.map(link => ({
            id: crypto.randomBytes(12).toString("hex"),
            clubId: targetClubId,
            platform: link.platform,
            url: link.url
          }))
        });
      }
    }

    if (req.body.clubGallery && Array.isArray(req.body.clubGallery)) {
      await prisma.media.deleteMany({
        where: { clubId: targetClubId, eventId: null }
      });
      if (req.body.clubGallery.length > 0) {
        await prisma.media.createMany({
          data: req.body.clubGallery.map(url => ({
            id: crypto.randomBytes(12).toString("hex"),
            clubId: targetClubId,
            url: url,
            type: "IMAGE"
          }))
        });
      }
    }
    if (req.body.clubSponsors && Array.isArray(req.body.clubSponsors)) {
      await prisma.sponsor.deleteMany({
        where: { clubId: targetClubId, eventId: null }
      });
      if (req.body.clubSponsors.length > 0) {
        await prisma.sponsor.createMany({
          data: req.body.clubSponsors.map(url => ({
            id: crypto.randomBytes(12).toString("hex"),
            clubId: targetClubId,
            name: "Sponsor",
            logoUrl: url
          }))
        });
      }
    }


    const updatedClub = await prisma.club.findUnique({
      where: { id: targetClubId },
       include: { 
        socialLinks: true,
        media: { where: { eventId: null } },
        sponsors: { where: { eventId: null } }
      }
    });

    res.json({
      message: "Club updated successfully",
      club: { 
        ...updatedClub, 
        _id: updatedClub.id,
        clubGallery: updatedClub.media?.map(m => m.url) || [],
        clubSponsors: updatedClub.sponsors?.map(s => s.logoUrl) || []
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

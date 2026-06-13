import express from "express";
import multer from "multer";
import prisma from "../lib/prisma.js";
import { verifyToken } from "../middleware/auth.js";
import { generateSignature, uploadImage } from "../utils/cloudinary.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files (jpeg, png, webp, gif) are allowed."), false);
    }
  },
});

// Helper to check if user is blocked
const checkBlocked = async (req, res, next) => {
  try {
    const user = await prisma.studentUser.findUnique({
      where: { id: req.user.userId }
    });
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account is restricted from using Lost & Found." });
    }
    
    if (user.shopBlockedUntil && new Date(user.shopBlockedUntil) > new Date()) {
      return res.status(403).json({ message: `Your account is temporarily suspended until ${new Date(user.shopBlockedUntil).toLocaleDateString()}` });
    }
    
    req.fullUser = user;
    next();
  } catch (error) {
    res.status(500).json({ message: "Server error checking block status" });
  }
};

// POST /api/lost-found - Create a new item
router.post("/", verifyToken, checkBlocked, async (req, res) => {
  try {
    const { title, description, type, image_url, image_public_id, whatsapp } = req.body;
    const student = req.fullUser;

    // Rate limiting: 2 posts per day
    const today = new Date().setHours(0, 0, 0, 0);
    const lastPostDate = student.lastLostFoundPostDate ? new Date(student.lastLostFoundPostDate).setHours(0, 0, 0, 0) : null;

    let newCount = student.lostFoundPostCount;
    if (lastPostDate === today) {
      if (newCount >= 2) {
        return res.status(429).json({ message: "Post limit reached (2 per day). Please try again tomorrow." });
      }
      newCount += 1;
    } else {
      newCount = 1;
    }

    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.lostFoundItem.create({
        data: {
          id: createObjectId(),
          title,
          description,
          type: type === "Found" ? "FOUND" : "LOST",
          imageUrl: image_url,
          imagePublicId: image_public_id,
          whatsapp,
          userId: student.id,
        }
      });

      await tx.studentUser.update({
        where: { id: student.id },
        data: {
          lostFoundPostCount: newCount,
          lastLostFoundPostDate: new Date()
        }
      });

      return item;
    });

    res.status(201).json({ message: "Post created successfully", post: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST /api/lost-found/upload - Handle image upload
router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded." });
    }

    const result = await uploadImage(req.file.buffer, "lost-found");
    res.json({ 
      secure_url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error("Upload Route Error:", error);
    res.status(500).json({ message: "Upload failed.", error: error.message });
  }
});

// GET /api/lost-found/signature - Get signature for Cloudinary upload
router.get("/signature", verifyToken, (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = generateSignature({ timestamp, folder: "lost-found" });
    res.json({ 
      signature, 
      timestamp, 
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// GET /api/lost-found - Fetch all active items, sorted by newest first
router.get("/", verifyToken, async (req, res) => {
  try {
    const items = await prisma.lostFoundItem.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } }
      }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// GET /api/lost-found/my-posts - Fetch items posted by the user
router.get("/my-posts", verifyToken, async (req, res) => {
  try {
    const items = await prisma.lostFoundItem.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// PATCH /api/lost-found/:id/reunite - Mark as reunited
router.patch("/:id/reunite", verifyToken, async (req, res) => {
  try {
    const item = await prisma.lostFoundItem.findUnique({
      where: { id: req.params.id }
    });
    
    if (!item || item.userId !== req.user.userId) {
      return res.status(404).json({ message: "Item not found or unauthorized." });
    }

    const updated = await prisma.lostFoundItem.update({
      where: { id: req.params.id },
      data: { 
        status: "REUNITED",
        reunitedAt: new Date()
      }
    });
    
    res.json({ message: "Item marked as reunited", item: updated });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST /api/lost-found/:id/report - Report fraud
router.post("/:id/report", verifyToken, async (req, res) => {
  try {
    const item = await prisma.lostFoundItem.findUnique({
      where: { id: req.params.id }
    });
    
    if (!item) return res.status(404).json({ message: "Item not found." });
    if (item.userId === req.user.userId) {
      return res.status(400).json({ message: "You cannot report your own item." });
    }

    if (item.reportedBy.includes(req.user.userId)) {
      return res.status(400).json({ message: "You have already reported this item." });
    }

    const newReportedBy = [...item.reportedBy, req.user.userId];
    let isFraud = item.isFraud;
    
    await prisma.$transaction(async (tx) => {
      if (newReportedBy.length >= 3) {
        isFraud = true;
        await tx.studentUser.update({
          where: { id: item.userId },
          data: {
            shopBlockedUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        });
      }

      await tx.lostFoundItem.update({
        where: { id: req.params.id },
        data: {
          reportedBy: newReportedBy,
          isFraud
        }
      });
    });

    res.json({ message: "Report submitted. Thank you for keeping the community safe." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST /api/lost-found/:id/claim - Claim item (returns finder contact)
router.post("/:id/claim", verifyToken, checkBlocked, async (req, res) => {
  try {
    const item = await prisma.lostFoundItem.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true } }
      }
    });

    if (!item) return res.status(404).json({ message: "Item not found." });
    if (item.userId === req.user.userId) return res.status(400).json({ message: "You cannot claim your own item." });

    // In a full implementation, we'd send a notification here
    // For now, return the contact info to the claimer
    
    res.json({ 
      message: "Item claim requested", 
      contact: {
        name: item.user.name,
        email: item.user.email,
        whatsapp: item.whatsapp
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// POST /api/lost-found/:id/report-liar - Finder reports false claimer
router.post("/:id/report-liar", verifyToken, async (req, res) => {
  try {
    const { liarId, reason } = req.body;
    
    if (!liarId) return res.status(400).json({ message: "Liar ID is required" });

    const item = await prisma.lostFoundItem.findUnique({
      where: { id: req.params.id }
    });

    if (!item || item.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized or item not found." });
    }

    if (liarId === req.user.userId || liarId === item.userId) {
      return res.status(400).json({ message: "Invalid reported user." });
    }

    await prisma.$transaction(async (tx) => {
      await tx.lostFoundReport.create({
        data: {
          id: createObjectId(),
          itemId: item.id,
          reporterId: req.user.userId,
          liarId,
          reason: reason || "False claim"
        }
      });

      await tx.studentUser.update({
        where: { id: liarId },
        data: {
          isBlocked: true,
          accessLevel: "restricted"
        }
      });
    });

    res.json({ message: "User reported and restricted." });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

export default router;

import express from "express";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();

// Include for sender — club head (StudentUser) with their club name
const senderInclude = {
  senderStudent: {
    select: {
      id: true,
      name: true,
      email: true,
      memberships: {
        where: { role: "clubHead" },
        include: { club: { select: { clubName: true } } },
        take: 1,
      },
    },
  },
  senderAdmin: {
    select: { id: true, name: true, email: true },
  },
};

function formatSender(notification) {
  if (notification.senderStudent) {
    const s = notification.senderStudent;
    return {
      ...s,
      _id: s.id,
      clubName: s.memberships?.[0]?.club?.clubName || s.name,
    };
  }
  if (notification.senderAdmin) {
    const a = notification.senderAdmin;
    return { ...a, _id: a.id, clubName: a.name };
  }
  return null;
}

// ── POST /notifications — create & broadcast ──────────────────────────────────

router.post("/", verifyToken, allowRoles("club"), async (req, res) => {
  try {
    const { targetType, eventId, title, message } = req.body;
    const { userId: sender, userType } = req.user;

    if (!title || !message || !targetType) {
      return res.status(400).json({ message: "Incomplete fields" });
    }

    let recipients = [];

    if (targetType === "REGISTERED_STUDENTS") {
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required." });
      }

      const participations = await prisma.collegeEventParticipation.findMany({
        where: { eventId },
        select: { userId: true },
      });
      recipients = participations.map((p) => p.userId);
    }

    const notification = await prisma.notification.create({
      data: {
        id: createObjectId(),
        // Sender is always a club head (StudentUser) for now
        senderStudentId: userType === "student" ? sender : null,
        senderAdminId: userType === "admin" ? sender : null,
        targetType,
        eventId: targetType === "REGISTERED_STUDENTS" ? eventId : null,
        recipients,
        title,
        message,
      },
      include: senderInclude,
    });

    const payload = {
      ...notification,
      _id: notification.id,
      sender: formatSender(notification),
    };

    if (targetType === "ALL_STUDENTS") {
      req.io.emit("new-notification", payload);
    } else {
      recipients.forEach((uId) => {
        req.io.to(uId.toString()).emit("new-notification", payload);
      });
    }

    res.status(201).json(payload);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /notifications — notifications for the requesting user ────────────────

router.get(
  "/",
  verifyToken,
  allowRoles("member", "club", "admin", "facultyCoordinator"),
  async (req, res) => {
    try {
      const { userId, userType } = req.user;

      // Get the user's account creation time to filter ALL_STUDENTS notifications
      let userCreatedAt;
      if (userType === "admin") {
        const admin = await prisma.adminRole.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        });
        userCreatedAt = admin?.createdAt ?? new Date(0);
      } else {
        const student = await prisma.studentUser.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        });
        userCreatedAt = student?.createdAt ?? new Date(0);
      }

      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { targetType: "ALL_STUDENTS", createdAt: { gte: userCreatedAt } },
            { targetType: "REGISTERED_STUDENTS", recipients: { has: userId } },
          ],
        },
        include: senderInclude,
        orderBy: { createdAt: "desc" },
      });

      res.json(
        notifications.map((n) => ({
          ...n,
          _id: n.id,
          sender: formatSender(n),
        })),
      );
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── GET /notifications/sent — sent notifications for club head ────────────────

router.get("/sent", verifyToken, allowRoles("club"), async (req, res) => {
  try {
    const { userId, userType } = req.user;

    const where =
      userType === "admin"
        ? { senderAdminId: userId }
        : { senderStudentId: userId };

    const notifications = await prisma.notification.findMany({
      where,
      include: senderInclude,
      orderBy: { createdAt: "desc" },
    });

    res.json(
      notifications.map((n) => ({
        ...n,
        _id: n.id,
        sender: formatSender(n),
      })),
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// IMPORTANT: /read-all must come BEFORE /:id/read to avoid Express
// matching "read-all" as an :id parameter.

// ── PUT /notifications/read-all ───────────────────────────────────────────────

router.put(
  "/read-all",
  verifyToken,
  allowRoles("member", "club", "admin", "facultyCoordinator"),
  async (req, res) => {
    try {
      const { userId, userType } = req.user;

      let userCreatedAt;
      if (userType === "admin") {
        const admin = await prisma.adminRole.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        });
        userCreatedAt = admin?.createdAt ?? new Date(0);
      } else {
        const student = await prisma.studentUser.findUnique({
          where: { id: userId },
          select: { createdAt: true },
        });
        userCreatedAt = student?.createdAt ?? new Date(0);
      }

      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { targetType: "ALL_STUDENTS", createdAt: { gte: userCreatedAt } },
            { targetType: "REGISTERED_STUDENTS", recipients: { has: userId } },
          ],
        },
      });

      await Promise.all(
        notifications
          .filter((n) => !n.readBy.includes(userId))
          .map((n) =>
            prisma.notification.update({
              where: { id: n.id },
              data: { readBy: [...n.readBy, userId] },
            }),
          ),
      );

      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// ── PUT /notifications/:id/read ───────────────────────────────────────────────

router.put(
  "/:id/read",
  verifyToken,
  allowRoles("member", "club", "admin", "facultyCoordinator"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const notification = await prisma.notification.findUnique({
        where: { id: req.params.id },
      });

      if (!notification) return res.status(404).json({ message: "Not found" });

      const readBy = notification.readBy.includes(userId)
        ? notification.readBy
        : [...notification.readBy, userId];

      const updated = await prisma.notification.update({
        where: { id: req.params.id },
        data: { readBy },
      });

      res.json({ ...updated, _id: updated.id });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;

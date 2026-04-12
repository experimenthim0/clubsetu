import express from "express";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();

router.post("/", verifyToken, allowRoles("club"), async (req, res) => {
  try {
    const { targetType, eventId, title, message } = req.body;
    const { userId: sender } = req.user;

    if (!title || !message || !targetType) {
      return res.status(400).json({ message: "Incomplete fields" });
    }

    let recipients = [];

    if (targetType === "REGISTERED_STUDENTS") {
      if (!eventId) {
        return res.status(400).json({ message: "Event ID is required." });
      }

      const registrations = await prisma.registration.findMany({
        where: { eventId },
        select: { userId: true },
      });
      recipients = registrations.map((reg) => reg.userId);
    }

    const notification = await prisma.notification.create({
      data: {
        id: createObjectId(),
        senderId: sender,
        targetType,
        eventId: targetType === "REGISTERED_STUDENTS" ? eventId : null,
        recipients,
        title,
        message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            club: { select: { clubName: true } },
          },
        },
      },
    });

    const payload = {
      ...notification,
      _id: notification.id,
      sender: notification.sender
        ? {
            ...notification.sender,
            _id: notification.sender.id,
            clubName:
              notification.sender.club?.clubName || notification.sender.name,
          }
        : null,
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

router.get(
  "/",
  verifyToken,
  allowRoles("member", "club", "admin", "facultyCoordinator"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { targetType: "ALL_STUDENTS", createdAt: { gte: user.createdAt } },
            { targetType: "REGISTERED_STUDENTS", recipients: { has: userId } },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              club: { select: { clubName: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      res.json(
        notifications.map((notification) => ({
          ...notification,
          _id: notification.id,
          sender: notification.sender
            ? {
                ...notification.sender,
                _id: notification.sender.id,
                clubName:
                  notification.sender.club?.clubName ||
                  notification.sender.name,
              }
            : null,
        })),
      );
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

router.get("/sent", verifyToken, allowRoles("club"), async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { senderId: req.user.userId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            club: { select: { clubName: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      notifications.map((notification) => ({
        ...notification,
        _id: notification.id,
        sender: notification.sender
          ? {
              ...notification.sender,
              _id: notification.sender.id,
              clubName:
                notification.sender.club?.clubName || notification.sender.name,
            }
          : null,
      })),
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// IMPORTANT: /read-all must come BEFORE /:id/read to avoid Express
// matching "read-all" as an :id parameter.
router.put(
  "/read-all",
  verifyToken,
  allowRoles("member", "club", "admin", "facultyCoordinator"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const user = await prisma.user.findUnique({ where: { id: userId } });

      const notifications = await prisma.notification.findMany({
        where: {
          OR: [
            { targetType: "ALL_STUDENTS", createdAt: { gte: user.createdAt } },
            { targetType: "REGISTERED_STUDENTS", recipients: { has: userId } },
          ],
        },
      });

      await Promise.all(
        notifications
          .filter((notification) => !notification.readBy.includes(userId))
          .map((notification) =>
            prisma.notification.update({
              where: { id: notification.id },
              data: { readBy: [...notification.readBy, userId] },
            }),
          ),
      );

      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

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


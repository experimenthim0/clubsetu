import express from "express";
import Notification from "../models/Notification.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// POST /api/notifications
// Club Heads send a notification
router.post(
  "/",
  verifyToken,
  allowRoles("clubHead"),
  async (req, res) => {
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
        // Fetch all student IDs registered for this event
        const registrations = await Registration.find({ eventId });
        recipients = registrations.map(reg => reg.userId);
      }

      const notification = new Notification({
        sender,
        targetType,
        eventId: targetType === "REGISTERED_STUDENTS" ? eventId : undefined,
        recipients,
        title,
        message,
      });

      await notification.save();

      // We need to populate club info manually or add clubName to User
      // But usually notifications are sent from the Club profile.
      const populatedNotification = await notification.populate("sender", "name email");

      // Emit over sockets
      if (targetType === "ALL_STUDENTS") {
        req.io.emit("new-notification", populatedNotification);
      } else if (targetType === "REGISTERED_STUDENTS") {
        recipients.forEach(uId => {
          req.io.to(uId.toString()).emit("new-notification", populatedNotification);
        });
      }

      res.status(201).json(populatedNotification);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/notifications
// Students get their notifications
router.get(
  "/",
  verifyToken,
  allowRoles("member", "clubHead", "admin"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const user = await User.findById(userId);

      const notifications = await Notification.find({
        $or: [
          { targetType: "ALL_STUDENTS", createdAt: { $gte: user.createdAt } },
          { targetType: "REGISTERED_STUDENTS", recipients: userId }
        ]
      })
      .populate("sender", "name")
      .sort({ createdAt: -1 });

      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/notifications/sent
router.get(
  "/sent",
  verifyToken,
  allowRoles("clubHead"),
  async (req, res) => {
    try {
      const { userId: senderId } = req.user;
      const notifications = await Notification.find({ sender: senderId })
        .populate("eventId", "title")
        .sort({ createdAt: -1 });

      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/notifications/:id/read
router.put(
  "/:id/read",
  verifyToken,
  allowRoles("member", "clubHead"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const notification = await Notification.findById(req.params.id);
      if (!notification) return res.status(404).json({ message: "Not found" });

      if (!notification.readBy.includes(userId)) {
        notification.readBy.push(userId);
        await notification.save();
      }

      res.json(notification);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/notifications/read-all
router.put(
  "/read-all",
  verifyToken,
  allowRoles("member", "clubHead"),
  async (req, res) => {
    try {
      const { userId } = req.user;
      const user = await User.findById(userId);

      const notifications = await Notification.find({
        $and: [
          {
            $or: [
              { targetType: "ALL_STUDENTS", createdAt: { $gte: user.createdAt } },
              { targetType: "REGISTERED_STUDENTS", recipients: userId }
            ]
          },
          { readBy: { $ne: userId } }
        ]
      });

      for (let notif of notifications) {
        notif.readBy.push(userId);
        await notif.save();
      }

      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;

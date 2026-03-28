import express from "express";
import Notification from "../models/Notification.js";
import Registration from "../models/Registration.js";
import Student from "../models/Student.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// POST /api/notifications
// Club Heads send a notification
router.post(
  "/",
  verifyToken,
  requireRole("club-head"),
  async (req, res) => {
    try {
      const { targetType, eventId, title, message } = req.body;
      const sender = req.user.id;

      if (!title || !message || !targetType) {
        return res.status(400).json({ message: "Incomplete fields" });
      }

      let recipients = [];

      if (targetType === "REGISTERED_STUDENTS") {
        if (!eventId) {
          return res.status(400).json({ message: "Event ID is required for registered students target." });
        }
        // Fetch all student IDs registered for this event
        const registrations = await Registration.find({ eventId });
        recipients = registrations.map(reg => reg.studentId);
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

      const populatedNotification = await notification.populate("sender", "clubName clubLogo");

      // Emit over sockets
      if (targetType === "ALL_STUDENTS") {
        // Broadcast to all sockets. Note: they should ideally be authenticated students.
        req.io.emit("new-notification", populatedNotification);
      } else if (targetType === "REGISTERED_STUDENTS") {
        // Emit to specific users
        recipients.forEach(studentId => {
          req.io.to(studentId.toString()).emit("new-notification", populatedNotification);
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
  requireRole("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);

      // Fetch ALL_STUDENTS notifications sent AFTER the student registered
      // and REGISTERED_STUDENTS notifications where student is in recipients
      const notifications = await Notification.find({
        $or: [
          { targetType: "ALL_STUDENTS", createdAt: { $gte: student.createdAt } },
          { targetType: "REGISTERED_STUDENTS", recipients: studentId }
        ]
      })
      .populate("sender", "clubName clubLogo")
      .sort({ createdAt: -1 });

      res.json(notifications);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// GET /api/notifications/sent
// Club Heads get the notifications they have sent
router.get(
  "/sent",
  verifyToken,
  requireRole("club-head"),
  async (req, res) => {
    try {
      const senderId = req.user.id;
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
// Mark as read
router.put(
  "/:id/read",
  verifyToken,
  requireRole("student"),
  async (req, res) => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) return res.status(404).json({ message: "Not found" });

      if (!notification.readBy.includes(req.user.id)) {
        notification.readBy.push(req.user.id);
        await notification.save();
      }

      res.json(notification);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/notifications/read-all
// Mark all as read
router.put(
  "/read-all",
  verifyToken,
  requireRole("student"),
  async (req, res) => {
    try {
      const studentId = req.user.id;
      const student = await Student.findById(studentId);

      // Find all unread notifications for this student
      const notifications = await Notification.find({
        $and: [
          {
            $or: [
              { targetType: "ALL_STUDENTS", createdAt: { $gte: student.createdAt } },
              { targetType: "REGISTERED_STUDENTS", recipients: studentId }
            ]
          },
          { readBy: { $ne: studentId } }
        ]
      });

      for (let notif of notifications) {
        notif.readBy.push(studentId);
        await notif.save();
      }

      res.json({ message: "All notifications marked as read" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;

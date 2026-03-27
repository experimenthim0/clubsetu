import express from "express";
import Admin from "../models/Admin.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import ClubHead from "../models/ClubHead.js";
import Student from "../models/Student.js";
import { generateToken, verifyToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = generateToken(admin, "admin");

    res.json({
      success: true,
      admin: { email: admin.email, role: "admin" },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during admin login" });
  }
});

// Global Financial Overview — ADMIN ONLY
router.get(
  "/dashboard-stats",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const events = await Event.find({ entryFee: { $gt: 0 } }).populate(
        "createdBy",
      );

      const registrations = await Registration.find({
        paymentStatus: "SUCCESS",
      });

      const eventStats = events.map((event) => {
        const eventRegs = registrations.filter(
          (reg) => reg.eventId.toString() === event._id.toString(),
        );
        const totalCollected = eventRegs.reduce(
          (sum, reg) => sum + (reg.amountPaid || 0),
          0,
        );

        return {
          eventId: event._id,
          title: event.title,
          clubName: event.createdBy?.clubName || "Unknown",
          clubHeadId: event.createdBy?._id,
          totalCollected,
          regCount: eventRegs.length,
          entryFee: event.entryFee,
          payoutStatus: event.payoutStatus || "PENDING",
          registrationDeadline: event.registrationDeadline,
          startTime: event.startTime,
        };
      });

      const totalPlatformRevenue = registrations.reduce(
        (sum, reg) => sum + (reg.amountPaid || 0),
        0,
      );

      const totalStudents = await Student.countDocuments();
      const totalClubHeads = await ClubHead.countDocuments();
      const totalEvents = await Event.countDocuments();

      res.json({
        totalRevenue: totalPlatformRevenue,
        totalStudents,
        totalClubHeads,
        totalEvents,
        eventStats,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  },
);

// Update Payout Status — ADMIN ONLY
router.post(
  "/complete-payout/:eventId",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const deadline = event.registrationDeadline || event.startTime;
      if (new Date() < new Date(deadline)) {
        return res.status(400).json({
          message:
            "Payout can only be completed after the registration deadline has passed.",
        });
      }

      event.payoutStatus = "COMPLETED";
      await event.save();

      res.json({ success: true, message: "Payout marked as completed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update payout status" });
    }
  },
);

// Fetch Club Head Bank Info — ADMIN ONLY
router.get(
  "/club-head/:id",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const clubHead = await ClubHead.findById(req.params.id);
      if (!clubHead)
        return res.status(404).json({ message: "Club Head not found" });

      res.json({
        name: clubHead.name,
        clubName: clubHead.clubName,
        bankInfo: {
          bankName: clubHead.bankName,
          accountHolderName: clubHead.accountHolderName,
          accountNumber: clubHead.accountNumber,
          ifscCode: clubHead.ifscCode,
          upiId: clubHead.upiId,
          bankPhone: clubHead.bankPhone,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching club head info" });
    }
  },
);

// Get All Club Heads List — ADMIN ONLY
router.get(
  "/club-heads-list",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const clubHeads = await ClubHead.find().select("-password");
      res.json(clubHeads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch club heads" });
    }
  },
);

// Approve Club Head — ADMIN ONLY
router.patch(
  "/approve-club-head/:id",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const clubHead = await ClubHead.findById(id);
      if (!clubHead)
        return res.status(404).json({ message: "Club Head not found" });

      clubHead.isApproved = true;
      await clubHead.save();

      res.json({
        success: true,
        message: `Club Head for ${clubHead.clubName} approved successfully`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to approve club head" });
    }
  },
);

// Reject/Delete Club Head — ADMIN ONLY
router.delete(
  "/reject-club-head/:id",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const clubHead = await ClubHead.findById(id);
      if (!clubHead)
        return res.status(404).json({ message: "Club Head not found" });

      const clubName = clubHead.clubName;
      await ClubHead.findByIdAndDelete(id);

      res.json({
        success: true,
        message: `Club Head for ${clubName} rejected and deleted`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject club head" });
    }
  },
);

// Event Data Export — ADMIN ONLY
router.get(
  "/event-data-export",
  verifyToken,
  requireRole("admin"),
  async (req, res) => {
    try {
      const events = await Event.find().populate("createdBy").sort({ startTime: -1 });

      const registrations = await Registration.find({
        paymentStatus: "SUCCESS",
      });

      const eventData = events.map((event) => {
        const eventRegs = registrations.filter(
          (reg) => reg.eventId.toString() === event._id.toString(),
        );
        const totalAmountReceived = eventRegs.reduce(
          (sum, reg) => sum + (reg.amountPaid || 0),
          0,
        );

        return {
          eventName: event.title,
          clubName: event.createdBy?.clubName || "Unknown",
          totalRegistrations: event.registeredCount || 0,
          eventDate: event.startTime,
          eventType: event.entryFee > 0 ? "Paid" : "Free",
          entryFee: event.entryFee || 0,
          totalAmountReceived,
        };
      });

      res.json({ events: eventData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to fetch event data" });
    }
  },
);

export default router;

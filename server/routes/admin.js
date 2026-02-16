import express from "express";
import Admin from "../models/Admin.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import ClubHead from "../models/ClubHead.js";

const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (!admin || admin.password !== password) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }
    // Simple response for now, no JWT implementation unless requested
    res.json({ success: true, admin: { email: admin.email, role: "admin" } });
  } catch (error) {
    res.status(500).json({ message: "Server error during admin login" });
  }
});

// Global Financial Overview
router.get("/dashboard-stats", async (req, res) => {
  try {
    // Get all paid events with creators
    const events = await Event.find({ entryFee: { $gt: 0 } }).populate(
      "createdBy",
    );

    // Get all successful registrations
    const registrations = await Registration.find({ paymentStatus: "SUCCESS" });

    // Aggregate stats per event
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

    // Total platform revenue
    const totalPlatformRevenue = registrations.reduce(
      (sum, reg) => sum + (reg.amountPaid || 0),
      0,
    );

    res.json({
      totalRevenue: totalPlatformRevenue,
      eventStats,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch dashboard stats" });
  }
});

// Update Payout Status
router.post("/complete-payout/:eventId", async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Check if registration deadline or start time has passed
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
});

// Fetch Club Head Bank Info
router.get("/club-head/:id", async (req, res) => {
  try {
    const clubHead = await ClubHead.findById(req.params.id);
    if (!clubHead)
      return res.status(404).json({ message: "Club Head not found" });

    // Return bank info
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
});

export default router;

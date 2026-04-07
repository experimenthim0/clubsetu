import express from "express";
import User from "../models/User.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import ClubMember from "../models/ClubMember.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// NOTE: Global Admin Login is now handled in auth.js with role "admin".
// This route is kept for backward compatibility if needed, but refactored to use User model.
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await User.findOne({ email, role: "admin" });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const { generateToken } = await import("../middleware/auth.js");
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
  allowRoles("admin"),
  async (req, res) => {
    try {
      const events = await Event.find({ entryFee: { $gt: 0 } }).populate("createdBy");

      const registrations = await Registration.find({
        paymentStatus: "SUCCESS",
      });

      const eventStats = await Promise.all(events.map(async (event) => {
        const eventRegs = registrations.filter(
          (reg) => reg.eventId.toString() === event._id.toString(),
        );
        const totalCollected = eventRegs.reduce(
          (sum, reg) => sum + (reg.amountPaid || 0),
          0,
        );

        // Fetch club name from Club model if clubId exists, else fallback to old logic
        let clubName = "Unknown";
        if (event.clubId) {
            const club = await Club.findById(event.clubId);
            clubName = club?.clubName || "Unknown";
        } else if (event.createdBy) {
            // Fallback: search for a club where this user is the head
            const membership = await ClubMember.findOne({ userId: event.createdBy._id, role: "head" }).populate("clubId");
            clubName = membership?.clubId?.clubName || "Unknown";
        }

        return {
          eventId: event._id,
          title: event.title,
          clubName,
          clubHeadId: event.createdBy?._id,
          totalCollected,
          regCount: eventRegs.length,
          entryFee: event.entryFee,
          payoutStatus: event.payoutStatus || "PENDING",
          registrationDeadline: event.registrationDeadline,
          startTime: event.startTime,
        };
      }));

      const totalPlatformRevenue = registrations.reduce(
        (sum, reg) => sum + (reg.amountPaid || 0),
        0,
      );

      const totalStudents = await User.countDocuments({ role: "member" });
      const totalClubHeads = await User.countDocuments({ role: "clubHead" });
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
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { eventId } = req.params;
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const deadline = event.registrationDeadline || event.startTime;
      if (new Date() < new Date(deadline)) {
        return res.status(400).json({
          message: "Payout can only be completed after the registration deadline has passed.",
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

// Fetch Club Head Info — ADMIN ONLY
router.get(
  "/club-head/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user || user.role !== "clubHead")
        return res.status(404).json({ message: "Club Head not found" });

      // Find the club name
      const membership = await ClubMember.findOne({ userId: user._id, role: "head" }).populate("clubId");

      res.json({
        name: user.name,
        clubName: membership?.clubId?.clubName || user.clubName || "Unknown",
        bankInfo: {
          bankName: user.bankName,
          accountHolderName: user.accountHolderName,
          accountNumber: user.accountNumber,
          ifscCode: user.ifscCode,
          upiId: user.upiId,
          bankPhone: user.bankPhone,
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
  allowRoles("admin"),
  async (req, res) => {
    try {
      const clubHeads = await User.find({ role: "clubHead" }).select("-password");
      
      // Enhance with club names
      const headsWithClubs = await Promise.all(clubHeads.map(async (head) => {
          const membership = await ClubMember.findOne({ userId: head._id, role: "head" }).populate("clubId");
          const headObj = head.toObject();
          headObj.clubName = membership?.clubId?.clubName || head.clubName || "Unknown";
          return headObj;
      }));
      
      res.json(headsWithClubs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch club heads" });
    }
  },
);

// Event Data Export - ADMIN ONLY
router.get(
  "/event-data-export",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const events = await Event.find({})
        .populate("clubId", "clubName")
        .populate("createdBy", "name clubName")
        .sort({ startTime: -1 });

      const exportedEvents = await Promise.all(
        events.map(async (event) => {
          const successfulRegistrations = await Registration.find({
            eventId: event._id,
            paymentStatus: "SUCCESS",
          }).select("amountPaid");

          let clubName = event.clubId?.clubName || "Unknown";

          if (clubName === "Unknown" && event.createdBy?._id) {
            const membership = await ClubMember.findOne({
              userId: event.createdBy._id,
              role: "head",
            }).populate("clubId", "clubName");

            clubName =
              membership?.clubId?.clubName ||
              event.createdBy.clubName ||
              "Unknown";
          }

          return {
            eventId: event._id,
            eventName: event.title,
            clubName,
            totalRegistrations:
              event.registeredCount || successfulRegistrations.length,
            eventType: event.entryFee > 0 ? "Paid" : "Free",
            eventDate: event.startTime,
            totalAmountReceived: successfulRegistrations.reduce(
              (sum, registration) => sum + (registration.amountPaid || 0),
              0,
            ),
          };
        }),
      );

      res.json({ events: exportedEvents });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to export event data" });
    }
  },
);

// Approve Club Head — ADMIN ONLY
router.patch(
  "/approve-club-head/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user || user.role !== "clubHead")
        return res.status(404).json({ message: "Club Head not found" });

      user.isApproved = true;
      await user.save();

      res.json({
        success: true,
        message: `Club Head for approved successfully`,
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
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const user = await User.findById(id);
      if (!user || user.role !== "clubHead")
        return res.status(404).json({ message: "Club Head not found" });

      // Also clean up club and membership
      const membership = await ClubMember.findOne({ userId: user._id, role: "head" });
      if (membership) {
          await Club.findByIdAndDelete(membership.clubId);
          await ClubMember.deleteMany({ clubId: membership.clubId });
      }
      
      await User.findByIdAndDelete(id);

      res.json({
        success: true,
        message: `Club Head and associated data rejected and deleted`,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject club head" });
    }
  },
);

export default router;

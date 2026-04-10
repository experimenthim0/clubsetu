import express from "express";
import User from "../models/User.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import Club from "../models/Club.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

// NOTE: Global Admin Login is now handled in auth.js with role "admin".
// This route is kept for backward compatibility if needed, but refactored to use User model.
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await User.findOne({ 
      email, 
      role: { $in: ["admin", "paymentAdmin"] } 
    });
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const { generateToken } = await import("../middleware/auth.js");
    const token = generateToken(admin, "admin");

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      admin: { email: admin.email, role: admin.role },
      token,
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ message: "Server error during admin login" });
  }
});

// Global Financial Overview — ADMIN ONLY
router.get(
  "/dashboard-stats",
  verifyToken,
  allowRoles("admin", "paymentAdmin"),
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

        // Fetch club name from Club model
        let clubName = "Unknown";
        if (event.clubId) {
            const club = await Club.findById(event.clubId);
            clubName = club?.clubName || "Unknown";
        } else if (event.createdBy) {
            // Fallback: search for the user and get their clubId
            const user = await User.findById(event.createdBy._id).populate("clubId");
            clubName = user?.clubId?.clubName || user?.clubName || "Unknown";
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
      const totalClubs = await Club.countDocuments();
      const totalEventsActive = await Event.countDocuments({ reviewStatus: "PUBLISHED" });
      const totalEventsAll = await Event.countDocuments();

      // Year-wise stats
      const yearWiseStats = await Event.aggregate([
        {
          $group: {
            _id: { $year: "$startTime" },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id": -1 } }
      ]);

      res.json({
        totalRevenue: totalPlatformRevenue,
        totalStudents,
        totalClubs,
        totalEvents: totalEventsActive,
        totalEventsTillNow: totalEventsAll,
        yearWiseEvents: yearWiseStats,
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
  allowRoles("admin", "paymentAdmin"),
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

// Fetch Club/Faculty User Info — ADMIN ONLY
router.get(
  "/user-info/:id",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ message: "User not found" });

      res.json({
        name: user.name,
        email: user.email,
        role: user.role,
        clubId: user.clubId,
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
      res.status(500).json({ message: "Error fetching user info" });
    }
  },
);

// Get All Clubs List — ADMIN ONLY
router.get(
  "/clubs-list",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const clubs = await Club.find({}).populate("facultyCoordinators", "name email");
      res.json(clubs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clubs" });
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
      const { month, year, clubId } = req.query;
      let query = {};

      if (month && month !== "all") {
        const m = parseInt(month);
        query.startTime = { 
          ...query.startTime,
          $expr: { $eq: [{ $month: "$startTime" }, m] } 
        };
      }
      
      if (year && year !== "all") {
        const y = parseInt(year);
        // We can't use $expr easily with other filters in find(), 
        // but we can use $gte and $lte for year.
        const startOfYear = new Date(y, 0, 1);
        const endOfYear = new Date(y, 11, 31, 23, 59, 59);
        query.startTime = { ...query.startTime, $gte: startOfYear, $lte: endOfYear };
      }

      if (clubId && clubId !== "all") {
        query.clubId = clubId;
      }

      const events = await Event.find(query)
        .populate("clubId", "clubName")
        .populate("createdBy", "name")
        .sort({ startTime: -1 });

      const exportedEvents = await Promise.all(
        events.map(async (event) => {
          const successfulRegistrations = await Registration.find({
            eventId: event._id,
            paymentStatus: "SUCCESS",
          }).select("amountPaid");

          let clubName = event.clubId?.clubName || "Unknown";

          if (clubName === "Unknown" && event.createdBy?._id) {
            const user = await User.findById(event.createdBy._id).populate("clubId");
            clubName = user?.clubId?.clubName || user?.clubName || "Unknown";
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

// Create New Club and Associated Users — ADMIN ONLY
router.post(
  "/clubs",
  verifyToken,
  allowRoles("admin"),
  async (req, res) => {
    try {
      const { clubName, facultyName, facultyEmail, clubEmail } = req.body;
      const { slugify } = await import("../utils/slugify.js");
      const bcrypt = await import("bcryptjs");

      const slug = slugify(clubName);
      
      // 1. Create Club
      const newClub = new Club({
        clubName,
        slug,
        facultyName,
        facultyEmail,
        clubEmail
      });
      await newClub.save();

      const commonPassword = `${slug}@him0148`;

      // 2. Create Club User
      const clubUser = new User({
        name: clubName.toUpperCase(),
        email: clubEmail,
        password: commonPassword,
        role: "club",
        clubId: newClub._id,
        isVerified: true,
        isTwoStepEnabled: true
      });
      await clubUser.save();

      // 3. Create Faculty User
      const facultyUser = new User({
        name: facultyName,
        email: facultyEmail,
        password: commonPassword,
        role: "facultyCoordinator",
        clubId: newClub._id,
        isVerified: true,
        isTwoStepEnabled: true
      });
      await facultyUser.save();

      // 4. Update Club with Faculty reference
      newClub.facultyCoordinators.push(facultyUser._id);
      await newClub.save();

      res.status(201).json({ 
        message: "Club and associated users created successfully", 
        club: newClub 
      });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || "Failed to create club" });
    }
  }
);

export default router;

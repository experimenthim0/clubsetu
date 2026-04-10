import express from "express";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Registration from "../models/Registration.js";
import Club from "../models/Club.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";

const router = express.Router();

// GET /api/events — PUBLIC (ONLY PUBLISHED)
router.get("/", async (req, res) => {
  try {
    const events = await Event.find({ reviewStatus: "PUBLISHED" })
      .populate("createdBy", "name clubName")
      .sort({ startTime: 1 });
    
    // Enhance with club info
    const enhancedEvents = await Promise.all(events.map(async (event) => {
        const eventObj = event.toObject();
        if (event.clubId) {
            const club = await Club.findById(event.clubId).select("clubName clubLogo slug");
            eventObj.club = club;
        }
        return eventObj;
    }));

    res.json(enhancedEvents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/club/:clubId — PUBLIC
router.get("/club/:clubId", async (req, res) => {
  try {
    const events = await Event.find({ clubId: req.params.clubId }).sort({
      startTime: 1,
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/club-manage/:clubId — AUTH REQUIRED (CLUB/FACULTY ONLY)
router.get("/club-manage/:clubId", verifyToken, allowRoles("club", "facultyCoordinator", "admin"), async (req, res) => {
  try {
    const { clubId, role } = req.user;
    const targetClubId = req.params.clubId;

    // Authorization Check: Must be the assigned club or an admin
    if (role !== "admin" && clubId?.toString() !== targetClubId) {
        return res.status(403).json({ message: "Access denied. You can only view events for your assigned club." });
    }

    const events = await Event.find({ clubId: targetClubId })
        .populate("createdBy", "name")
        .populate("reviewedBy", "name")
        .sort({ startTime: -1 });
        
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/club-manage/:clubId/export — CLUB/FACULTY DATA EXPORT
router.get("/club-manage/:clubId/export", verifyToken, allowRoles("club", "facultyCoordinator", "admin"), async (req, res) => {
  try {
    const { clubId, role } = req.user;
    const targetClubId = req.params.clubId;

    if (role !== "admin" && clubId?.toString() !== targetClubId) {
        return res.status(403).json({ message: "Access denied." });
    }

    const { month, year } = req.query;

    let query = { clubId: targetClubId };

    if (month && month !== "all") {
        const m = parseInt(month);
        query.startTime = { ...query.startTime, $expr: { $eq: [{ $month: "$startTime" }, m] } };
    }

    if (year && year !== "all") {
        const y = parseInt(year);
        const startOfYear = new Date(y, 0, 1);
        const endOfYear = new Date(y, 11, 31, 23, 59, 59);
        query.startTime = { ...query.startTime, $gte: startOfYear, $lte: endOfYear };
    }

    const events = await Event.find(query)
      .populate("clubId", "clubName")
      .sort({ startTime: -1 });

    const exportedEvents = await Promise.all(
      events.map(async (event) => {
        const successfulRegistrations = await Registration.find({
          eventId: event._id,
          paymentStatus: "SUCCESS",
        }).select("amountPaid");

        return {
          eventName: event.title,
          clubName: event.clubId?.clubName || "Your Club",
          totalRegistrations: event.registeredCount || successfulRegistrations.length,
          eventDate: event.startTime,
          totalAmountReceived: successfulRegistrations.reduce(
            (sum, reg) => sum + (reg.amountPaid || 0),
            0,
          ),
        };
      })
    );

    res.json({ events: exportedEvents });
  } catch (error) {
    res.status(500).json({ message: "Failed to export club event data" });
  }
});

// GET /api/events/club-head/:clubHeadId — PUBLIC
router.get("/club-head/:clubHeadId", async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.params.clubHeadId }).sort({
      startTime: 1,
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/user/:userId — MEMBER ONLY (Previously student)
router.get(
  "/user/:userId",
  verifyToken,
  allowRoles("member", "admin"),
  async (req, res) => {
    try {
      const { userId } = req.params;
      
      if (req.user.userId !== userId && req.user.role !== "admin") {
         return res.status(403).json({ message: "Access denied." });
      }

      const registrations = await Registration.find({ userId }).populate("eventId");
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// POST /api/events — CLUB ONLY (REQUIRES REVIEW)
router.post("/", verifyToken, allowRoles("club", "admin"), async (req, res) => {
  const {
    title,
    description,
    venue,
    startTime,
    endTime,
    totalSeats,
    entryFee,
    imageUrl,
    requiredFields,
    customFields,
    allowedPrograms,
    allowedYears,
    registrationDeadline,
  } = req.body;

  try {
    const { userId, clubId, role } = req.user;
    
    if (!clubId && role !== "admin") {
        return res.status(403).json({ message: "You must be associated with a club to create events." });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const conflictingEvent = await Event.findOne({
      venue,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
      reviewStatus: "PUBLISHED" // Only conflict with published events
    });

    if (conflictingEvent) {
      return res.status(409).json({ message: "Venue is already booked." });
    }

    const newEvent = new Event({
      title,
      description,
      venue,
      startTime,
      endTime,
      totalSeats: totalSeats || 0,
      entryFee: entryFee || 0,
      imageUrl: imageUrl || "",
      requiredFields: requiredFields || [],
      customFields: customFields || [],
      createdBy: userId,
      clubId: clubId || req.body.clubId, // Use token clubId, fallback to body only if Admin
      allowedPrograms: allowedPrograms || ["BTECH", "MTECH"],
      allowedYears: allowedYears || [],
      registrationDeadline: registrationDeadline || null,
      slug: slugify(title),
      reviewStatus: "PENDING", // Initial status is PENDING
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/events/:id/review — FACULTY ONLY
router.put("/:id/review", verifyToken, allowRoles("facultyCoordinator", "admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;
    const { userId, clubId, role } = req.user;

    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // Authorization: Faculty must be linked to the same club as the event
    if (role !== "admin" && event.clubId.toString() !== clubId?.toString()) {
        return res.status(403).json({ message: "You can only review events for your assigned club." });
    }

    if (!["PUBLISHED", "REJECTED"].includes(status)) {
        return res.status(400).json({ message: "Invalid review status." });
    }

    event.reviewStatus = status;
    event.reviewComment = comment;
    event.reviewedBy = userId;
    await event.save();

    res.json({ message: `Event ${status.toLowerCase()} successfully`, event });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/:id — PUBLIC (WITH STATUS CHECK)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const event = await Event.findOne(query).populate("createdBy", "name");
    if (!event) return res.status(404).json({ message: "Event not found" });

    // If not published, check if user is authorized to view it (Admin, Creator, or assigned Faculty)
    if (event.reviewStatus !== "PUBLISHED") {
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(403).json({ message: "This event is currently under review." });

        try {
            const decoded = verifyTokenInternal(token); // Helper or inline check
            const user = await User.findById(decoded.userId);
            
            const isCreator = event.createdBy._id.toString() === user._id.toString();
            const isAdmin = user.role === "admin";
            const isAssignedFaculty = user.role === "facultyCoordinator" && event.clubId?.toString() === user.clubId?.toString();

            if (!isCreator && !isAdmin && !isAssignedFaculty) {
                return res.status(403).json({ message: "This event is currently under review." });
            }
        } catch (err) {
            return res.status(403).json({ message: "This event is currently under review." });
        }
    }
    
    const eventObj = event.toObject();
    if (event.clubId) {
        eventObj.club = await Club.findById(event.clubId);
    }

    res.json(eventObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Internal helper for inline token verification
const verifyTokenInternal = (token) => {
    const jwt = require("jsonwebtoken");
    return jwt.verify(token, process.env.JWT_SECRET);
};

// POST /api/events/:id/register — MEMBER ONLY
router.post(
  "/:id/register",
  verifyToken,
  allowRoles("member", "club", "facultyCoordinator", "admin"),
  async (req, res) => {
    const { userId } = req.user;
    const eventId = req.params.id;
    const { formResponses } = req.body;

    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (event.entryFee > 0) {
        return res.status(400).json({ message: "This is a paid event. Please register through the payment flow." });
      }

      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ message: "User not found." });

      // Eligibility checks
      if (event.allowedPrograms?.length > 0 && !event.allowedPrograms.includes(user.program)) {
        return res.status(403).json({ message: "Ineligible program." });
      }

      const existingReg = await Registration.findOne({ eventId, userId });
      if (existingReg) {
        return res.status(400).json({ message: "Already registered." });
      }

      let status = (event.totalSeats > 0 && event.registeredCount >= event.totalSeats) ? "WAITLISTED" : "CONFIRMED";

      const registration = new Registration({
        eventId,
        userId,
        status,
        formResponses: formResponses || {},
      });

      await registration.save();

      if (status === "CONFIRMED") {
        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
      } else {
        await Event.findByIdAndUpdate(eventId, { $push: { waitingList: registration._id } });
      }

      res.json({ message: "Registration successful", status });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// GET /api/events/:id/registrations — CLUB HEAD or ADMIN
router.get(
  "/:id/registrations",
  verifyToken,
  allowRoles("club", "facultyCoordinator", "admin"),
  async (req, res) => {
    try {
      const registrations = await Registration.find({ eventId: req.params.id })
        .populate("userId", "name email rollNo program year");

      const data = registrations.map(reg => {
          const r = reg.toObject();
          r.student = r.userId; // compatibility with frontend
          return r;
      });

      res.json(data);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// PUT /api/events/:id — CLUB HEAD or ADMIN
router.put(
  "/:id",
  verifyToken,
  allowRoles("club", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ message: "Event not found" });

      // Authorization Check
      if (event.createdBy.toString() !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to update this event." });
      }

      // If title changes, update slug
      if (req.body.title && req.body.title !== event.title) {
        req.body.slug = slugify(req.body.title);
      }

      const updatedEvent = await Event.findByIdAndUpdate(
        id,
        { $set: req.body },
        { new: true }
      );

      res.json(updatedEvent);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

// DELETE /api/events/:id — CLUB HEAD or ADMIN
router.delete(
  "/:id",
  verifyToken,
  allowRoles("club", "admin"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.user;

      const event = await Event.findById(id);
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (event.createdBy.toString() !== userId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to delete this event." });
      }

      await Event.findByIdAndDelete(id);
      // Clean up registrations
      await Registration.deleteMany({ eventId: id });

      res.json({ message: "Event deleted successfully." });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

// DELETE /api/events/:id/register — MEMBER ONLY
router.delete(
  "/:id/register",
  verifyToken,
  allowRoles("member", "admin"),
  async (req, res) => {
    const { studentId } = req.body; // Sent from frontend
    const eventId = req.params.id;

    try {
      if (req.user.userId !== studentId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Unauthorized to deregister this user." });
      }

      const registration = await Registration.findOneAndDelete({ eventId, userId: studentId });
      
      if (!registration) {
        return res.status(404).json({ message: "Registration not found." });
      }

      if (registration.status === "CONFIRMED") {
        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
      } else {
        await Event.findByIdAndUpdate(eventId, { $pull: { waitingList: registration._id } });
      }

      res.json({ message: "Deregistered successfully." });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  }
);

export default router;

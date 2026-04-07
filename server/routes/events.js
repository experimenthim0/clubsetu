import express from "express";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Registration from "../models/Registration.js";
import Club from "../models/Club.js";
import ClubMember from "../models/ClubMember.js";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";

const router = express.Router();

// GET /api/events — PUBLIC
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name clubName")
      .sort({ startTime: 1 });
    
    // Enhance with club info if possible
    const enhancedEvents = await Promise.all(events.map(async (event) => {
        const eventObj = event.toObject();
        if (event.clubId) {
            const club = await Club.findById(event.clubId).select("name logo slug");
            eventObj.club = club;
        } else if (event.createdBy) {
            const membership = await ClubMember.findOne({ userId: event.createdBy._id, role: "head" }).populate("clubId");
            eventObj.club = membership?.clubId;
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

// POST /api/events — CLUB HEAD ONLY
router.post("/", verifyToken, allowRoles("clubHead", "admin"), async (req, res) => {
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
    const { userId } = req.user;
    
    // Find the club this user manages
    const membership = await ClubMember.findOne({ userId, role: "head" });
    if (!membership && req.user.role !== "admin") {
        return res.status(403).json({ message: "You must be a club head to create events." });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);
    const conflictingEvent = await Event.findOne({
      venue,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
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
      clubId: membership?.clubId,
      allowedPrograms: allowedPrograms || ["BTECH", "MTECH"],
      allowedYears: allowedYears || [],
      registrationDeadline: registrationDeadline || null,
      slug: slugify(title),
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/events/:id — PUBLIC
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    let query = id.match(/^[0-9a-fA-F]{24}$/) ? { _id: id } : { slug: id };

    const event = await Event.findOne(query).populate("createdBy", "name clubName");
    if (!event) return res.status(404).json({ message: "Event not found" });
    
    const eventObj = event.toObject();
    if (event.clubId) {
        eventObj.club = await Club.findById(event.clubId);
    } else if (event.createdBy) {
         const membership = await ClubMember.findOne({ userId: event.createdBy._id, role: "head" }).populate("clubId");
         eventObj.club = membership?.clubId;
    }

    res.json(eventObj);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/register — MEMBER ONLY
router.post(
  "/:id/register",
  verifyToken,
  allowRoles("member", "clubHead", "admin"),
  async (req, res) => {
    const { userId } = req.user;
    const eventId = req.params.id;
    const { formResponses } = req.body;

    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

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
  allowRoles("clubHead", "admin"),
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
  allowRoles("clubHead", "admin"),
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
  allowRoles("clubHead", "admin"),
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

import express from "express";
import Event from "../models/Event.js";
import Student from "../models/Student.js";
import Registration from "../models/Registration.js";
import { verifyToken, requireRole } from "../middleware/auth.js";
import { slugify } from "../utils/slugify.js";

const router = express.Router();

// GET /api/events — PUBLIC
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "clubName designation")
      .sort({ startTime: 1 });
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

// GET /api/events/student/:studentId — STUDENT ONLY
router.get(
  "/student/:studentId",
  verifyToken,
  requireRole("student"),
  async (req, res) => {
    try {
      const studentId = req.params.studentId;
      
      // SECURITY FIX: Prevent IDOR. User can only view their own registrations
      if (req.user.id !== studentId && req.user.role !== "admin") {
         return res.status(403).json({ message: "Access denied. You can only view your own registrations." });
      }

      const registrations = await Registration.find({ studentId }).populate(
        "eventId",
      );
      res.json(registrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// POST /api/events — CLUB HEAD ONLY
router.post("/", verifyToken, requireRole("club-head"), async (req, res) => {
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
    createdBy,
    allowedPrograms,
    allowedYears,
    registrationDeadline,
    winners,
  } = req.body;

  // Basic conflict check
  const start = new Date(startTime);
  const end = new Date(endTime);

  try {
    const conflictingEvent = await Event.findOne({
      venue,
      $or: [{ startTime: { $lt: end }, endTime: { $gt: start } }],
    });

    if (conflictingEvent) {
      return res
        .status(409)
        .json({ message: "Venue is already booked for this time slot." });
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
      createdBy,
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
    let query;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      query = { _id: id };
    } else {
      query = { slug: id };
    }

    const event = await Event.findOne(query).populate("createdBy", "clubName description clubLogo slug");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/slug/:slug — PUBLIC (Alternative explicit route if needed)
router.get("/slug/:slug", async (req, res) => {
  try {
    const event = await Event.findOne({ slug: req.params.slug }).populate("createdBy", "clubName description clubLogo slug");
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/events/:id — CLUB HEAD ONLY
router.put("/:id", verifyToken, requireRole("club-head"), async (req, res) => {
  try {
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
      winners,
    } = req.body;

    const updateData = {
      title,
      description,
      venue,
      startTime,
      endTime,
      totalSeats: totalSeats || 0,
      entryFee,
      imageUrl,
      requiredFields,
      customFields: customFields || [],
      allowedPrograms: allowedPrograms || ["BTECH", "MTECH"],
      allowedYears: allowedYears || [],
      registrationDeadline: registrationDeadline || null,
      winners: winners || [],
    };

    if (title) {
      updateData.slug = slugify(title);
    }

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/register — STUDENT ONLY
router.post(
  "/:id/register",
  verifyToken,
  requireRole("student"),
  async (req, res) => {
    const { studentId, formResponses } = req.body;
    const eventId = req.params.id;

    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (event.status === "ENDED") {
        return res.status(400).json({ message: "Event has ended." });
      }

      // Check program and year eligibility
      const student = await Student.findById(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found." });
      }

      if (
        event.allowedPrograms &&
        event.allowedPrograms.length > 0 &&
        !event.allowedPrograms.includes(student.program)
      ) {
        return res.status(403).json({
          message: `This event is only open to ${event.allowedPrograms.join(" / ")} students.`,
        });
      }

      if (
        event.allowedYears &&
        event.allowedYears.length > 0 &&
        !event.allowedYears.includes(student.year)
      ) {
        return res.status(403).json({
          message: `This event is only open to ${event.allowedYears.join(", ")} students.`,
        });
      }

      // Check if event is full (0 = unlimited seats)
      const isUnlimited = !event.totalSeats || event.totalSeats === 0;

      if (!isUnlimited && event.registeredCount >= event.totalSeats) {
        // Seats are full - will go to waitlist
      }

      // Check registration deadline (Prefer registrationDeadline, fallback to startTime)
      const deadline = event.registrationDeadline || event.startTime;
      if (new Date() > new Date(deadline)) {
        return res.status(400).json({
          message: event.registrationDeadline
            ? "Registration deadline has passed for this event."
            : "Registration is closed as the event has already started.",
        });
      }

      const existingReg = await Registration.findOne({
        eventId,
        studentId,
      });
      if (existingReg) {
        return res
          .status(400)
          .json({ message: "You are already registered for this event." });
      }

      let status = "CONFIRMED";
      if (!isUnlimited && event.registeredCount >= event.totalSeats) {
        status = "WAITLISTED";
      }

      // Validate required custom fields
      if (event.customFields && event.customFields.length > 0) {
        const requiredCustom = event.customFields.filter((f) => f.required);
        for (const field of requiredCustom) {
          if (!formResponses || !formResponses[field.label]) {
            return res.status(400).json({
              message: `"${field.label}" is required.`,
            });
          }
        }
      }

      const registration = new Registration({
        eventId,
        studentId,
        status,
        formResponses: formResponses || {},
      });

      await registration.save();

      if (status === "CONFIRMED") {
        await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });
      } else {
        await Event.findByIdAndUpdate(eventId, { $push: { waitingList: registration._id } });
      }

      res.json({
        message:
          status === "WAITLISTED"
            ? "Added to waitlist"
            : "Registration confirmed",
        status,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// DELETE /api/events/:id/register (Deregister) — STUDENT ONLY
router.delete(
  "/:id/register",
  verifyToken,
  requireRole("student"),
  async (req, res) => {
    const { studentId } = req.body;
    const eventId = req.params.id;

    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found." });

      // Prevent deregistration if it's a paid event
      if (event.entryFee > 0) {
        return res.status(400).json({
          message:
            "Deregistration is not allowed for paid events. Please contact the administrator for refunds.",
        });
      }

      const registration = await Registration.findOneAndDelete({
        eventId,
        studentId,
      });

      if (!registration) {
        return res.status(404).json({ message: "Registration not found." });
      }

      if (event) {
        if (registration.status === "CONFIRMED") {
          await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: -1 } });
        } else {
          await Event.findByIdAndUpdate(eventId, { $pull: { waitingList: registration._id } });
        }
      }

      res.json({ message: "Deregistered successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// DELETE /api/events/:id (Delete event) — CLUB HEAD ONLY
router.delete(
  "/:id",
  verifyToken,
  requireRole("club-head"),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      // Delete all registrations for this event
      await Registration.deleteMany({
        eventId: req.params.id,
      });

      // Delete the event
      await Event.findByIdAndDelete(req.params.id);

      res.json({ message: "Event and all registrations deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

// GET /api/events/:id/registrations — CLUB HEAD or ADMIN
router.get(
  "/:id/registrations",
  verifyToken,
  requireRole("club-head", "admin"),
  async (req, res) => {
    try {
      const registrations = await Registration.find({
        eventId: req.params.id,
      }).populate({
        path: "studentId",
        select: "name email rollNo program year",
      });

      const populatedRegistrations = registrations.map((reg) => {
        const regObj = reg.toObject();
        if (reg.formResponses instanceof Map) {
          regObj.formResponses = Object.fromEntries(reg.formResponses);
        }
        return {
          ...regObj,
          student: reg.studentId
            ? reg.studentId
            : { name: "Unknown", email: "Unknown", rollNo: "Unknown" },
        };
      });

      res.json(populatedRegistrations);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  },
);

export default router;

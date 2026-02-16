const express = require("express");
const router = express.Router();
const Event = require("../models/Event");

// GET /api/events
router.get("/", async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "clubName designation")
      .sort({ startTime: 1 });
    // computed status is included via virtuals
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events
router.post("/", async (req, res) => {
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
    createdBy,
    allowedPrograms,
    allowedYears,
    registrationDeadline,
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
      createdBy,
      allowedPrograms: allowedPrograms || ["BTECH", "MTECH"],
      allowedYears: allowedYears || [],
      registrationDeadline: registrationDeadline || null,
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});
// ... (GET logic unchanged)
// PUT /api/events/:id
router.put("/:id", async (req, res) => {
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
      allowedPrograms,
      allowedYears,
      registrationDeadline,
    } = req.body;
    // In a real app, re-run conflict check if venue/time changed
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        venue,
        startTime,
        endTime,
        totalSeats: totalSeats || 0,
        entryFee,
        imageUrl,
        requiredFields,
        allowedPrograms: allowedPrograms || ["BTECH", "MTECH"],
        allowedYears: allowedYears || [],
        registrationDeadline: registrationDeadline || null,
      },
      { new: true },
    );
    res.json(event);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/events/:id/register
router.post("/:id/register", async (req, res) => {
  const { studentId } = req.body;
  const eventId = req.params.id;

  try {
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (event.status === "ENDED") {
      return res.status(400).json({ message: "Event has ended." });
    }

    // Check program and year eligibility
    const Student = require("../models/Student");
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
    if (event.totalSeats > 0 && event.registeredCount >= event.totalSeats) {
      return res.status(400).json({ message: "Event is full" });
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

    const existingReg = await require("../models/Registration").findOne({
      eventId,
      studentId,
    });
    if (existingReg) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event." });
    }

    let status = "CONFIRMED";
    if (event.registeredCount >= event.totalSeats) {
      status = "WAITLISTED";
    }

    const registration = new require("../models/Registration")({
      eventId,
      studentId,
      status,
    });

    await registration.save();

    if (status === "CONFIRMED") {
      event.registeredCount += 1;
    } else {
      event.waitingList.push(registration._id);
    }
    await event.save();

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
});

// DELETE /api/events/:id/register (Deregister)
router.delete("/:id/register", async (req, res) => {
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

    const registration =
      await require("../models/Registration").findOneAndDelete({
        eventId,
        studentId,
      });

    if (!registration) {
      return res.status(404).json({ message: "Registration not found." });
    }

    if (event) {
      if (registration.status === "CONFIRMED") {
        event.registeredCount = Math.max(0, event.registeredCount - 1);
      } else {
        event.waitingList = event.waitingList.filter(
          (id) => id.toString() !== registration._id.toString(),
        );
      }
      await event.save();
    }

    res.json({ message: "Deregistered successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/events/:id (Delete event)
router.delete("/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Delete all registrations for this event
    await require("../models/Registration").deleteMany({
      eventId: req.params.id,
    });

    // Delete the event
    await Event.findByIdAndDelete(req.params.id);

    res.json({ message: "Event and all registrations deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/:id/registrations
router.get("/:id/registrations", async (req, res) => {
  try {
    // We need student details. Since `studentId` is just a string in Registration schema (mock),
    // we might not be able to populate it if it's not an ObjectId ref.
    // Let's check Registration model again.
    // Ah, Registration schema has `studentId: { type: String, required: true }`.
    // Ideally we should have made it a ref to 'Student' model.
    // For now, we will just return the registrations.
    // A better approach is to fetch student details. Let's do a manual lookup or update Schema.

    // Let's rely on the client to fetch student details or just display studentId/Email if stored.
    // Wait, the Student registration stores email in the Student model.
    // To show "Student Information", we need to link Registration -> Student.

    const registrations = await require("../models/Registration").find({
      eventId: req.params.id,
    });

    // Manual population if studentId matches _id of Student model
    const Student = require("../models/Student");
    const populatedRegistrations = await Promise.all(
      registrations.map(async (reg) => {
        const student = await Student.findById(reg.studentId);
        return {
          ...reg.toObject(),
          student: student
            ? student
            : { name: "Unknown", email: "Unknown", rollNo: "Unknown" },
        };
      }),
    );

    res.json(populatedRegistrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/events/club-head/:clubHeadId
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

// GET /api/events/student/:studentId
router.get("/student/:studentId", async (req, res) => {
  try {
    const studentId = req.params.studentId;
    const registrations = await require("../models/Registration")
      .find({ studentId })
      .populate("eventId");
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

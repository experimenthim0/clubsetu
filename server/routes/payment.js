const express = require("express");
const router = express.Router();
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Event = require("../models/Event");
const Registration = require("../models/Registration");

// Initialize Razorpay instance with credentials from environment
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================================================
// POST /api/payment/create-order
// Create a Razorpay order for event registration payment
// ============================================================================
router.post("/create-order", async (req, res) => {
  const { eventId, studentId } = req.body;

  try {
    // Validate input
    if (!eventId || !studentId) {
      return res
        .status(400)
        .json({ message: "Event ID and Student ID are required" });
    }

    // Fetch event details
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Check if event requires payment
    if (!event.entryFee || event.entryFee === 0) {
      return res
        .status(400)
        .json({ message: "This event is free, no payment required" });
    }

    // Check if event is full
    if (event.registeredCount >= event.totalSeats) {
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

    // Check if student already registered
    const existingRegistration = await Registration.findOne({
      eventId,
      studentId,
    });

    if (existingRegistration) {
      return res
        .status(400)
        .json({ message: "You are already registered for this event" });
    }

    // Create Razorpay order (amount must be in paise - multiply by 100)
    const amountInPaise = event.entryFee * 100;

    const receiptId = `reg_${eventId.toString().slice(-6)}_${studentId.slice(-6)}_${Date.now().toString().slice(-6)}`;

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receiptId,
      notes: {
        eventId: eventId.toString(),
        studentId: studentId,
        eventTitle: event.title,
      },
    };

    const order = await razorpay.orders.create(options);

    // Return order details to frontend
    res.json({
      success: true,
      orderId: order.id,
      amount: event.entryFee, // Amount in rupees for display
      currency: "INR",
      keyId: process.env.RAZORPAY_KEY_ID, // Public key for frontend
      eventTitle: event.title,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res.status(500).json({
      message: "Failed to create payment order",
      error: error.message,
    });
  }
});

// ============================================================================
// POST /api/payment/verify
// Verify payment and create registration
// CRITICAL: This is where we verify payment authenticity
// ============================================================================
router.post("/verify", async (req, res) => {
  const { orderId, paymentId, signature, eventId, studentId } = req.body;

  try {
    // Validate all required fields
    if (!orderId || !paymentId || !signature || !eventId || !studentId) {
      return res.status(400).json({
        message: "Missing required payment verification data",
      });
    }

    // ========================================================================
    // SECURITY: Verify payment signature using Razorpay's algorithm
    // This prevents tampering and ensures payment actually went through
    // ========================================================================
    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    if (generatedSignature !== signature) {
      console.error("Payment signature verification failed");
      return res.status(400).json({
        message: "Payment verification failed. Invalid signature.",
        success: false,
      });
    }

    // Signature is valid, fetch payment details from Razorpay to double-check
    const payment = await razorpay.payments.fetch(paymentId);

    // Verify payment status is captured
    if (payment.status !== "captured") {
      return res.status(400).json({
        message: "Payment not captured yet",
        success: false,
      });
    }

    // Verify amount matches event fee (payment.amount is in paise)
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const expectedAmountInPaise = event.entryFee * 100;
    if (payment.amount !== expectedAmountInPaise) {
      console.error("Payment amount mismatch");
      return res.status(400).json({
        message: "Payment amount does not match event fee",
        success: false,
      });
    }

    // Check if already registered (prevent duplicate registrations)
    const existingRegistration = await Registration.findOne({
      eventId,
      studentId,
    });

    if (existingRegistration) {
      return res.status(400).json({
        message: "Already registered for this event",
        success: false,
      });
    }

    // Check seat availability
    if (event.registeredCount >= event.totalSeats) {
      return res.status(400).json({
        message: "Event is full",
        success: false,
      });
    }

    // ========================================================================
    // Payment verified successfully - Create registration
    // ========================================================================
    const registration = new Registration({
      eventId,
      studentId,
      status: "CONFIRMED",
      paymentId,
      orderId,
      paymentStatus: "SUCCESS",
      amountPaid: event.entryFee,
      paymentTimestamp: new Date(),
    });

    await registration.save();

    // Increment registered count
    event.registeredCount += 1;
    await event.save();

    res.json({
      success: true,
      message: "Payment verified and registration confirmed",
      registration: {
        id: registration._id,
        eventTitle: event.title,
        amountPaid: event.entryFee,
        status: registration.status,
      },
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({
      message: "Payment verification failed",
      error: error.message,
      success: false,
    });
  }
});

// ============================================================================
// GET /api/payment/event/:eventId/stats
// Get payment statistics for an event (Club Head only)
// ============================================================================
router.get("/event/:eventId/stats", async (req, res) => {
  const { eventId } = req.params;

  try {
    const event = await Event.findById(eventId).populate("createdBy");

    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    // Get all successful registrations for this event
    const registrations = await Registration.find({
      eventId,
      paymentStatus: "SUCCESS",
    });

    // Calculate total money collected
    const totalMoneyCollected = registrations.reduce((sum, reg) => {
      return sum + (reg.amountPaid || 0);
    }, 0);

    const stats = {
      eventTitle: event.title,
      entryFee: event.entryFee,
      totalSeats: event.totalSeats,
      registeredCount: event.registeredCount,
      totalMoneyCollected,
      paidRegistrations: registrations.length,
      clubName: event.createdBy?.clubName || "N/A",
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      message: "Failed to fetch payment statistics",
      error: error.message,
    });
  }
});

module.exports = router;

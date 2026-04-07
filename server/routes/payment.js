import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import User from "../models/User.js";
import dotenv from "dotenv/config";
import { verifyToken, allowRoles } from "../middleware/auth.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payment/create-order
router.post(
  "/create-order",
  verifyToken,
  allowRoles("member", "clubHead", "admin"),
  async (req, res) => {
    const { eventId, studentId } = req.body; // studentId is actually the userId

    try {
      if (!eventId || !studentId) {
        return res.status(400).json({ message: "Event ID and User ID are required" });
      }

      if (req.user.userId !== studentId && req.user.role !== "admin") {
         return res.status(403).json({ message: "Access denied." });
      }

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (!event.entryFee || event.entryFee === 0) {
        return res.status(400).json({ message: "This event is free" });
      }

      const existingRegistration = await Registration.findOne({ eventId, userId: studentId });
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered" });
      }

      const amountInPaise = event.entryFee * 100;
      const receiptId = `reg_${eventId.toString().slice(-6)}_${studentId.slice(-6)}_${Date.now().toString().slice(-6)}`;

      const options = {
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        notes: { eventId: eventId.toString(), userId: studentId, eventTitle: event.title },
      };

      const order = await razorpay.orders.create(options);

      res.json({
        success: true,
        orderId: order.id,
        amount: event.entryFee,
        currency: "INR",
        keyId: process.env.RAZORPAY_KEY_ID,
        eventTitle: event.title,
      });
    } catch (error) {
      res.status(500).json({ message: "Payment order failed", error: error.message });
    }
  },
);

// POST /api/payment/verify
router.post(
  "/verify",
  verifyToken,
  allowRoles("member", "clubHead", "admin"),
  async (req, res) => {
    const { orderId, paymentId, signature, eventId, studentId, formResponses } = req.body;

    try {
      if (!orderId || !paymentId || !signature || !eventId || !studentId) {
        return res.status(400).json({ message: "Missing data" });
      }

      if (req.user.userId !== studentId && req.user.role !== "admin") {
         return res.status(403).json({ message: "Access denied." });
      }

      const generatedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest("hex");

      if (generatedSignature !== signature) {
        return res.status(400).json({ message: "Invalid signature", success: false });
      }

      const payment = await razorpay.payments.fetch(paymentId);
      if (payment.status !== "captured") {
        return res.status(400).json({ message: "Payment not captured", success: false });
      }

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const existingRegistration = await Registration.findOne({ eventId, userId: studentId });
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered", success: false });
      }

      const registration = new Registration({
        eventId,
        userId: studentId,
        status: "CONFIRMED",
        paymentId,
        orderId,
        paymentStatus: "SUCCESS",
        amountPaid: event.entryFee,
        paymentTimestamp: new Date(),
        formResponses: formResponses || {},
      });

      await registration.save();
      await Event.findByIdAndUpdate(eventId, { $inc: { registeredCount: 1 } });

      res.json({
        success: true,
        message: "Payment verified",
        registration: {
          id: registration._id,
          eventTitle: event.title,
          amountPaid: event.entryFee,
          status: registration.status,
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Verification failed", error: error.message, success: false });
    }
  },
);

// GET /api/payment/event/:eventId/stats
router.get(
  "/event/:eventId/stats",
  verifyToken,
  allowRoles("clubHead", "admin"),
  async (req, res) => {
    const { eventId } = req.params;

    try {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      const registrations = await Registration.find({
        eventId,
        paymentStatus: "SUCCESS",
      }).populate("userId", "name email rollNo");

      const totalMoneyCollected = registrations.reduce((sum, reg) => sum + (reg.amountPaid || 0), 0);

      res.json({
        eventTitle: event.title,
        totalCollected: totalMoneyCollected,
        registrations: registrations.map((reg) => ({
          studentName: reg.userId?.name || "Unknown",
          studentEmail: reg.userId?.email || "N/A",
          studentRollNo: reg.userId?.rollNo || "N/A",
          paymentId: reg.paymentId || "N/A",
          amountPaid: reg.amountPaid || 0,
          paymentStatus: reg.paymentStatus,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Stats failed", error: error.message });
    }
  },
);

export default router;

import express from "express";
import crypto from "crypto";
import Razorpay from "razorpay";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

router.post(
  "/create-order",
  verifyToken,
  allowRoles("member", "club", "admin"),
  async (req, res) => {
    const { eventId, studentId } = req.body;

    try {
      if (!eventId || !studentId) {
        return res.status(400).json({ message: "Event ID and User ID are required" });
      }

      if (req.user.userId !== studentId && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied." });
      }

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      const user = await prisma.user.findUnique({ where: { id: studentId } });
      if (!user) return res.status(404).json({ message: "User not found." });

      if (
        event.allowedPrograms?.length > 0 &&
        user.program &&
        !event.allowedPrograms.includes(user.program)
      ) {
        return res.status(403).json({ message: "Ineligible program." });
      }

      if (!event.entryFee || event.entryFee === 0) {
        return res.status(400).json({ message: "This event is free" });
      }

      const existingRegistration = await prisma.registration.findFirst({
        where: { eventId, userId: studentId },
      });
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered" });
      }

      const receiptId = `reg_${eventId.slice(-6)}_${studentId.slice(-6)}_${Date.now().toString().slice(-6)}`;
      const order = await razorpay.orders.create({
        amount: event.entryFee * 100,
        currency: "INR",
        receipt: receiptId,
        notes: { eventId, userId: studentId, eventTitle: event.title },
      });

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

router.post(
  "/verify",
  verifyToken,
  allowRoles("member", "club", "admin"),
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

      const event = await prisma.event.findUnique({ where: { id: eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      const existingRegistration = await prisma.registration.findFirst({
        where: { eventId, userId: studentId },
      });
      if (existingRegistration) {
        return res.status(400).json({ message: "Already registered", success: false });
      }

      const registrationId = createObjectId();

      await prisma.$transaction(async (tx) => {
        await tx.registration.create({
          data: {
            id: registrationId,
            eventId,
            userId: studentId,
            status: "CONFIRMED",
            paymentId,
            orderId,
            paymentStatus: "SUCCESS",
            amountPaid: event.entryFee,
            paymentTimestamp: new Date(),
            formResponses: formResponses || {},
          },
        });

        await tx.event.update({
          where: { id: eventId },
          data: { registeredCount: { increment: 1 } },
        });
      });

      res.json({
        success: true,
        message: "Payment verified",
        registration: {
          id: registrationId,
          eventTitle: event.title,
          amountPaid: event.entryFee,
          status: "CONFIRMED",
        },
      });
    } catch (error) {
      res.status(500).json({
        message: "Verification failed",
        error: error.message,
        success: false,
      });
    }
  },
);

router.get(
  "/event/:eventId/stats",
  verifyToken,
  allowRoles("club", "admin"),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      const registrations = await prisma.registration.findMany({
        where: {
          eventId: req.params.eventId,
          paymentStatus: "SUCCESS",
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, rollNo: true },
          },
        },
      });

      const totalMoneyCollected = registrations.reduce(
        (sum, reg) => sum + (reg.amountPaid || 0),
        0,
      );

      res.json({
        eventTitle: event.title,
        totalCollected: totalMoneyCollected,
        registrations: registrations.map((reg) => ({
          studentName: reg.user?.name || "Unknown",
          studentEmail: reg.user?.email || "N/A",
          studentRollNo: reg.user?.rollNo || "N/A",
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

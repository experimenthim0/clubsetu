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

// ── POST /payment/create-order ────────────────────────────────────────────────

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

      const student = await prisma.studentUser.findUnique({ where: { id: studentId } });
      if (!student) return res.status(404).json({ message: "User not found." });

      if (
        event.allowedPrograms?.length > 0 &&
        student.program &&
        !event.allowedPrograms.includes(student.program)
      ) {
        return res.status(403).json({ message: "Ineligible program." });
      }

      if (
        event.allowedYears?.length > 0 &&
        student.year &&
        !event.allowedYears.includes(student.year)
      ) {
        return res.status(403).json({ message: "Ineligible year." });
      }

      if (
        event.allowedBranches?.length > 0 &&
        student.branch &&
        !event.allowedBranches.includes(student.branch)
      ) {
        return res.status(403).json({ message: "Ineligible branch." });
      }

      if (!event.entryFee || event.entryFee === 0) {
        return res.status(400).json({ message: "This event is free" });
      }

      const existing = await prisma.participation.findFirst({
        where: { eventId, studentId: studentId },
      });
      if (existing) {
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

// ── POST /payment/verify ──────────────────────────────────────────────────────

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

      const participationId = createObjectId();
      let registrationStatus = "REGISTERED";

      await prisma.$transaction(async (tx) => {
        const events = await tx.$queryRaw`
          SELECT * FROM "Event" WHERE id = ${eventId} FOR UPDATE
        `;
        const latestEvent = events[0];
        if (!latestEvent) throw new Error("Event not found");

        const student = await tx.studentUser.findUnique({ where: { id: studentId } });
        if (!student) throw new Error("User not found");

        if (
          latestEvent.allowedPrograms?.length > 0 &&
          student.program &&
          !latestEvent.allowedPrograms.includes(student.program)
        ) {
          throw new Error("Ineligible program.");
        }

        if (
          latestEvent.allowedYears?.length > 0 &&
          student.year &&
          !latestEvent.allowedYears.includes(student.year)
        ) {
          throw new Error("Ineligible year.");
        }

        if (
          latestEvent.allowedBranches?.length > 0 &&
          student.branch &&
          !latestEvent.allowedBranches.includes(student.branch)
        ) {
          throw new Error("Ineligible branch.");
        }

        const existing = await tx.participation.findFirst({
          where: { eventId, studentId },
        });
        if (existing) throw new Error("Already registered");

        registrationStatus =
          latestEvent.totalSeats > 0 && latestEvent.registeredCount >= latestEvent.totalSeats
            ? "WAITLISTED"
            : "REGISTERED";

        await tx.participation.create({
          data: {
            id: participationId,
            eventId,
            studentId,
            status: registrationStatus,
            paymentId,
            orderId,
            qrCode: Math.floor(1000000 + Math.random() * 9000000).toString(),
            paymentStatus: "SUCCESS",
            amountPaid: latestEvent.entryFee,
            paymentTimestamp: new Date(),
            formResponses: formResponses || {},
          },
        });

        if (registrationStatus === "REGISTERED") {
          await tx.event.update({
            where: { id: eventId },
            data: { registeredCount: { increment: 1 } },
          });
        } else {
          await tx.event.update({
            where: { id: eventId },
            data: { waitingListIds: { push: participationId } },
          });
        }
      });

      res.json({
        success: true,
        message: "Payment verified",
        registration: {
          id: participationId,
          eventTitle: event.title,
          amountPaid: event.entryFee,
          status: registrationStatus,
        },
      });
    } catch (error) {
      const statusCode = ["Already registered", "Ineligible program.", "Event not found", "User not found"].includes(error.message)
        ? 400
        : 500;
      res.status(statusCode).json({
        message: "Verification failed",
        error: error.message,
        success: false,
      });
    }
  },
);

// ── GET /payment/event/:eventId/stats ─────────────────────────────────────────

router.get(
  "/event/:eventId/stats",
  verifyToken,
  allowRoles("club", "admin"),
  async (req, res) => {
    try {
      const event = await prisma.event.findUnique({ where: { id: req.params.eventId } });
      if (!event) return res.status(404).json({ message: "Event not found" });

      if (req.user.role === "club" && event.clubId !== req.user.clubId) {
        return res.status(403).json({
          message: "Access denied. You can only view stats for your own club's events.",
        });
      }

      const participations = await prisma.participation.findMany({
        where: { eventId: req.params.eventId, paymentStatus: "SUCCESS" },
        include: {
          student: { select: { id: true, name: true, email: true, rollNo: true } },
        },
      });

      const totalMoneyCollected = participations.reduce(
        (sum, p) => sum + (p.amountPaid || 0),
        0,
      );

      res.json({
        eventTitle: event.title,
        totalCollected: totalMoneyCollected,
        registrations: participations.map((p) => ({
          studentName: p.student?.name || "Unknown",
          studentEmail: p.student?.email || "N/A",
          studentRollNo: p.student?.rollNo || "N/A",
          paymentId: p.paymentId || "N/A",
          amountPaid: p.amountPaid || 0,
          paymentStatus: p.paymentStatus,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Stats failed", error: error.message });
    }
  },
);

export default router;

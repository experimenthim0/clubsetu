const mongoose = require("mongoose");

const registrationSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    required: true,
  },
  studentId: { type: String, required: true },
  status: {
    type: String,
    enum: ["CONFIRMED", "WAITLISTED"],
    default: "CONFIRMED",
  },
  // Payment Information
  paymentId: { type: String }, // Razorpay payment_id
  orderId: { type: String }, // Razorpay order_id
  paymentStatus: {
    type: String,
    enum: ["PENDING", "SUCCESS", "FAILED"],
    default: "SUCCESS",
  },
  amountPaid: { type: Number, default: 0 }, // Amount in rupees
  paymentTimestamp: { type: Date },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Registration", registrationSchema);

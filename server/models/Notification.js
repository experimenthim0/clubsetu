import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["ALL_STUDENTS", "REGISTERED_STUDENTS"],
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      // Required mostly if targetType is REGISTERED_STUDENTS
    },
    recipients: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    title: { type: String, required: true },
    message: { type: String, required: true },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);

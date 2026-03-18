import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDB from "./connection.js";
import eventRoutes from "./routes/events.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";
import clubRoutes from "./routes/clubs.js";


import { corsOptions } from "./utils/corsConfig.js";
import errorHandler from "./middleware/errorHandler.js";
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors(corsOptions));

app.use(express.json());
app.use(cookieParser());

await connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Routes
app.get("/", (req, res) => {
  res.send("ClubSetu API Running");
});

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clubs", clubRoutes);


// Global Error Handler should be the last middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

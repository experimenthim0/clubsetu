import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import eventRoutes from "./routes/events.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";
import clubRoutes from "./routes/clubs.js";
import notificationRoutes from "./routes/notifications.js";
import certificateRoutes from "./routes/certificates.js";

import { corsOptions } from "./utils/corsConfig.js";
import errorHandler from "./middleware/errorHandler.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";
const app = express();
const PORT = process.env.PORT || 5000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions,
});

// Provide socket.io to routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket connection handler
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their personal room`);
  });
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

app.use(helmet());
app.use(cors(corsOptions));

// Rate limiter for auth route
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
app.use("/api/auth/login", authLimiter);

app.use(express.json());
app.use(cookieParser());

console.log("Using PostgreSQL via Prisma");
app.get("/", (req, res) => {
  res.send("ClubSetu API Running");
});

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/certificates", certificateRoutes);


// Global Error Handler should be the last middleware
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

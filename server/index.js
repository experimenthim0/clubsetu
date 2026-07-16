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
import clubMemberRoutes from "./routes/clubMembers.js";
import notificationRoutes from "./routes/notifications.js";
import certificateRoutes from "./routes/certificates.js";
import participationRoutes from "./routes/participation.js";
import lostFoundRoutes from "./routes/lostFound.js";
import lostFoundAdminRoutes from "./routes/lostFoundAdmin.js";
import teamRoutes from "./routes/teams.js";
import prisma from "./lib/prisma.js";

import { corsOptions } from "./utils/corsConfig.js";
import errorHandler from "./middleware/errorHandler.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import http from "http";
import { Server } from "socket.io";

const app = express();
app.set("trust proxy", 1);
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
  res.send("CampusNode API Running");
});

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/club-members", clubMemberRoutes);
app.use("/api/clubs", clubRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/participation", participationRoutes);
app.use("/api/lost-found", lostFoundRoutes);
app.use("/api/admin/lost-found", lostFoundAdminRoutes);

// Auto-cleanup for reunited items (runs every 6 hours)
const cleanupReunitedItems = async () => {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const deleted = await prisma.lostFoundItem.deleteMany({
      where: {
        status: "REUNITED",
        reunitedAt: {
          lt: threeDaysAgo
        }
      }
    });
    if (deleted.count > 0) {
      console.log(`Auto-cleaned ${deleted.count} reunited items older than 3 days.`);
    }
  } catch (error) {
    console.error("Error running auto-cleanup:", error);
  }
};

// Run on startup
cleanupReunitedItems();
// Then run every 6 hours
setInterval(cleanupReunitedItems, 6 * 60 * 60 * 1000);

// Global Error Handler should be the last middleware
app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


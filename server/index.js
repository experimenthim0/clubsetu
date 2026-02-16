import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./connection.js";
import eventRoutes from "./routes/events.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import paymentRoutes from "./routes/payment.js";
import adminRoutes from "./routes/admin.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  "https://clubsetu.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // 1. Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);

      // 2. Check if origin matches any exact string in allowedOrigins
      const isAllowed = allowedOrigins.includes(origin);

      // 3. Check if origin matches the Vercel wildcard pattern
      const isVercelPreview = /\.vercel\.app$/.test(origin);

      if (isAllowed || isVercelPreview) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json());

await connectDB(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
// Routes (Placeholder)
app.get("/", (req, res) => {
  res.send("ClubSetu API Running");
});

app.use("/api/events", eventRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/admin", adminRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

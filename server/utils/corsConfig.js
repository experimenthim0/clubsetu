export const allowedOrigins = [
  "https://clubsetu.vercel.app",
  "https://clubsetu.nikhim.me",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:5177",
  "http://localhost:5178",
  "http://localhost:5179",
  "https://ambitious-designer.outray.app",
];

export const getClientUrl = (origin) => {
  return allowedOrigins.includes(origin) ? origin : process.env.CLIENT_URL;
};

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = /\.vercel\.app$/.test(origin);
    if (isAllowed || isVercelPreview) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

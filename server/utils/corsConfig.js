export const allowedOrigins = [
  "https://clubsetu.vercel.app",
  "https://www.clubsetu.vercel.app",
  "https://clubsetu.nikhim.me",
  "https://www.clubsetu.nikhim.me",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://127.0.0.1:5173"
];

export const getClientUrl = (origin) => {
  return allowedOrigins.includes(origin) ? origin : process.env.CLIENT_URL;
};

export const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    
    // Check exact matches
    const isAllowed = allowedOrigins.includes(origin);
    
    // Check wildcards for previews and testing domains
    const isPreview = origin && (
      /\.vercel\.app$/.test(origin) || 
      /\.nikhim\.me$/.test(origin) ||
      /\.outray\.app$/.test(origin) ||
      origin.startsWith("http://192.168.") // typical local network IPs
    );
    
    if (isAllowed || isPreview) {
      callback(null, true);
    } else {
      console.warn(`[CORS Blocked] Origin missing from allowed list: ${origin}`);
      callback(new Error(`Not allowed by CORS origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

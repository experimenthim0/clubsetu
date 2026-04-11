import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
}

// Generate JWT token
export const generateToken = (user, role) => {
  const userId = user?.id;
  const clubId = user?.clubId ?? null;

  return jwt.sign(
    { 
      userId, 
      role, 
      email: user.email,
      clubId // Include clubId for authorization checks
    },
    JWT_SECRET,
    { expiresIn: "1d" },
  );
};

// Verify JWT token middleware (unified 'auth')
export const verifyToken = async (req, res, next) => {
  // Check token in cookies first, fallback to Auth header if needed
  let token = req.cookies.token;
  
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (authHeader) {
       // Simple fallback for non-Bearer auth header
       token = authHeader;
    }
  }

  if (!token) {
    return res
      .status(401)
      .json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Standard 'requireRole'/ 'allowRoles' based on your provided task list
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No token" });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL ERROR: JWT_SECRET is not defined in environment variables.");
}

/**
 * Generate JWT token.
 * @param {object} user - User object (must have .id and .email)
 * @param {string} role  - Role string: admin | facultyCoordinator | paymentAdmin | club | member | external
 * @param {string} userType - "student" | "admin" | "external"
 * @param {string|null} clubId - Club ID if the user is associated with a club
 */
export const generateToken = (user, role, userType = "student", clubId = null) => {
  return jwt.sign(
    {
      userId: user.id,
      role,
      email: user.email,
      clubId,
      userType,
    },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Verify JWT token middleware
export const verifyToken = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (authHeader) {
    token = authHeader;
  }

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, email, clubId, userType }
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Role-based access control — checks req.user.role
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

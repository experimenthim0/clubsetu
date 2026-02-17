import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "clubsetu-secret-key-change-in-production";

// Generate JWT token
export const generateToken = (user, role) => {
  return jwt.sign(
    { id: user._id, role, email: user.email || user.collegeEmail },
    JWT_SECRET,
    { expiresIn: "7d" },
  );
};

// Verify JWT token middleware
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, role, email }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
};

// Role-based access control middleware
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required." });
    }
    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({
          message: "You do not have permission to perform this action.",
        });
    }
    next();
  };
};

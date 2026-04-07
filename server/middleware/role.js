/**
 * Role-based access control middleware.
 * Uses req.user.role which should be populated by the auth middleware.
 */
export const allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "No token provided." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Requires one of: ${roles.join(", ")}` 
      });
    }

    next();
  };
};

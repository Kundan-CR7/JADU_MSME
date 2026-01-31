const jwt = require("jsonwebtoken");
const logger = require("../../utils/logger");

const JWT_SECRET =
  process.env.JWT_SECRET || "super_secret_jwt_key_change_in_production";

const roles = {
  ADMIN: "ADMIN",
  STAFF: "STAFF",
};

const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
          .status(401)
          .json({ error: "Unauthorized: No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, JWT_SECRET);

      if (!allowedRoles.includes(decoded.role)) {
        return res
          .status(403)
          .json({ error: "Forbidden: Insufficient permissions" });
      }

      req.user = decoded; // Attach user info to request
      next();
    } catch (error) {
      logger.warn("Auth Failure", { error: error.message });
      return res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
  };
};

module.exports = {
  requireRole,
  roles,
  JWT_SECRET,
};

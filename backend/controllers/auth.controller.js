const prisma = require("../utils/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../middleware/auth.middleware");
const logger = require("../utils/logger");

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.staff.findUnique({ where: { email } });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" },
      );

      res.json({ token, role: user.role, name: user.name });
    } catch (err) {
      logger.error("Login Error", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // Helper to create initial admin if none exists (safe to call on startup)
  async seedAdmin() {
    const count = await prisma.staff.count();
    if (count === 0) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await prisma.staff.create({
        data: {
          name: "System Admin",
          email: "admin@autokarya.com",
          password: hashedPassword,
          role: "ADMIN",
          isAvailable: true,
        },
      });
      logger.info("Seeded default admin: admin@autokarya.com / admin123");
    }
  }
}

module.exports = new AuthController();

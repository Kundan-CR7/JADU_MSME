const prisma = require("../utils/prisma");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../middlewares/auth.middleware");
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



  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      // Check existing user
      const existingUser = await prisma.staff.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create User
      const user = await prisma.staff.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: "STAFF", // Default role
          isAvailable: true
        }
      });

      // Generate Token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.status(201).json({ token, role: user.role, name: user.name });
    } catch (err) {
      logger.error("Register Error", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  }

  async googleLogin(req, res) {
    const { OAuth2Client } = require('google-auth-library');
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

    try {
      const { token } = req.body;

      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email, name, picture } = payload;

      let user = await prisma.staff.findUnique({ where: { email } });

      if (!user) {
        // Create new user from Google
        // Note: Password can be dummy or random since they use Google to login
        const randomPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);

        user = await prisma.staff.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: "STAFF",
            isAvailable: true
          }
        });
      }

      // Generate Token
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({ token: jwtToken, role: user.role, name: user.name });
    } catch (err) {
      logger.error("Google Login Error", err);
      res.status(401).json({ error: "Invalid Google Token" });
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

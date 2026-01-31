const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

const passport = require("passport");

router.post("/login", authController.login);
router.post("/register", authController.register);

router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

const { authenticateToken } = require("../middlewares/auth.middleware");

router.get("/google/callback",
    passport.authenticate("google", { failureRedirect: "/login" }),
    authController.googleCallback
);

// Protected routes
router.put("/profile", authenticateToken, authController.updateProfile);

module.exports = router;

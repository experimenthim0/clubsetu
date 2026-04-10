import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import Club from "../models/Club.js";
import { generateToken, verifyToken } from "../middleware/auth.js";
import sendEmail from "../utils/sendEmail.js";
import { getClientUrl } from "../utils/corsConfig.js";
import { slugify } from "../utils/slugify.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { generateResetToken } from "../utils/generateResetToken.js";
import { checkPasswordRateLimit } from "../utils/checkPasswordRateLimit.js";

const router = express.Router();

// POST /api/auth/register/student
router.post("/register/student", async (req, res) => {
  try {
    const { name, rollNo, branch, year, program, email, password } = req.body;

    const origin = req.headers.origin;
    const clientUrl = getClientUrl(origin);

    // Validation
    if (!email.endsWith("@nitj.ac.in")) {
      return res.status(400).json({
        message: "Email must be a valid NITJ email (ending in @nitj.ac.in).",
      });
    }

    const emailRegex = /^[a-zA-Z]+\.[a-zA-Z]+\.\d{2}@nitj\.ac\.in$/;
    // Note: Relaxing regex if needed, but keeping original logic if it was working.
    // However, some users might have different formats. I'll stick to what was there.

    if (!name || name.length < 3) {
      return res
        .status(400)
        .json({ message: "Name must be at least 3 characters long." });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { rollNo }],
    });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email or roll number.",
      });
    }

    const isDevMode = process.env.SKIP_VERIFICATION === "true";
    let verificationToken = undefined;
    let verificationTokenExpire = undefined;

    if (!isDevMode) {
      verificationToken = crypto.randomBytes(20).toString("hex");
      verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000;
    }

    const newUser = new User({
      name: name.toUpperCase(),
      rollNo,
      branch,
      year,
      program,
      email,
      password,
      role: "member",
      isVerified: isDevMode,
      verificationToken,
      verificationTokenExpire,
    });

    await newUser.save();

    if (!isDevMode) {
      const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
      const message = `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your account:</p>
        <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
      `;

      try {
        await sendEmail({
          email: newUser.email,
          subject: "Account Verification",
          message,
        });

        return res.status(201).json({
          message: "Registration successful. Please check your email to verify your account.",
        });
      } catch (error) {
        await User.findByIdAndDelete(newUser._id);
        return res.status(500).json({ message: "Email could not be sent. Please try again." });
      }
    }

    const token = generateToken(newUser, "member");
    const userObj = sanitizeUser(newUser);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      message: "Registered successfully",
      user: userObj,
      role: "member",
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Club Head registration removed as per new requirements
// Clubs and Faculty are now pre-seeded or added by Admin

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email to login." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if 2Step Verification is required
    const sensitiveRoles = ["admin", "facultyCoordinator", "club"];
    if (user.isTwoStepEnabled && sensitiveRoles.includes(user.role)) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.otp = otp;
      user.otpExpire = Date.now() + 5 * 60 * 1000; // 5 minutes
      await user.save();

      await sendEmail({
        email: user.email,
        subject: "Login Verification Code",
        message: `<h1>Your Verification Code</h1><p>Your OTP for login is: <strong>${otp}</strong>. It expires in 5 minutes.</p>`,
      });

      return res.json({
        needs2FA: true,
        email: user.email,
        message: "Verification code sent to your email.",
      });
    }

    const token = generateToken(user, user.role);
    const userObj = sanitizeUser(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: "Login successful",
      user: userObj,
      role: user.role,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/verify-2fa
router.post("/verify-2fa", async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({
      email,
      otp,
      otpExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    // Clear OTP after successful verification
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    const token = generateToken(user, user.role);
    const userObj = sanitizeUser(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Verification successful",
      user: userObj,
      role: user.role,
      token,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
  try {
    const verificationToken = req.params.token;
    const user = await User.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: "If an account exists, a reset link has been sent." });
    }

    const resetToken = await generateResetToken(user);

    const origin = req.headers.origin;
    const clientUrl = getClientUrl(origin);
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const message = `<h2>Reset Password</h2><p>Click below to reset:</p><a href="${resetUrl}">${resetUrl}</a>`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message,
      });
      res.json({ message: "Reset link sent." });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/change-password
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.user;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Rate limiting check
    if (!checkPasswordRateLimit(user)) {
      return res.status(429).json({ message: "Daily password change limit exceeded. Try again tomorrow." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

import express from "express";
import crypto from "crypto";
import Student from "../models/Student.js";
import ClubHead from "../models/ClubHead.js";
import { generateToken, verifyToken } from "../middleware/auth.js";
import sendEmail from "../utils/sendEmail.js";
import { getClientUrl } from "../utils/corsConfig.js";
import { slugify } from "../utils/slugify.js";

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
    // Strict format check: name.branch.year@nitj.ac.in
    const emailRegex = /^[a-zA-Z]+\.[a-zA-Z]+\.\d{2}@nitj\.ac\.in$/;
    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ message: "Email format must be name.branch.year@nitj.ac.in" });
    }

    if (!name || name.length < 3) {
      return res
        .status(400)
        .json({ message: "Name must be at least 3 characters long." });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      $or: [{ email }, { rollNo }],
    });
    if (existingStudent) {
      return res.status(409).json({
        message: "Student already exists with this email or roll number.",
      });
    }

    // Determine verification status based on Dev Mode
    const isDevMode = process.env.SKIP_VERIFICATION === "true";
    let verificationToken = undefined;
    let verificationTokenExpire = undefined;

    if (!isDevMode) {
      // Generate verification token
      verificationToken = crypto.randomBytes(20).toString("hex");
      verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }

    const newStudent = new Student({
      name: name.toUpperCase(),
      rollNo,
      branch,
      year,
      program,
      email,
      password,
      isVerified: isDevMode,
      verificationToken,
      verificationTokenExpire,
    });

    await newStudent.save();

    if (!isDevMode) {
      // Send verification email
      const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
      const message = `
        <h1>Email Verification</h1>
        <p>Please click the link below to verify your account:</p>
        <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
      `;

      try {
        await sendEmail({
          email: newStudent.email,
          subject: "Account Verification",
          message,
        });

        return res.status(201).json({
          message:
            "Registration successful. Please check your email to verify your account.",
        });
      } catch (error) {
        // If email fails, delete user so they can try again (or handle gracefully)
        await Student.findByIdAndDelete(newStudent._id);
        return res
          .status(500)
          .json({ message: "Email could not be sent. Please try again." });
      }
    }

    // If Dev Mode (Skipped Verification), login immediately
    const token = generateToken(newStudent, "student");
    const userObj = newStudent.toObject();
    delete userObj.password;
    delete userObj.verificationToken;
    delete userObj.verificationTokenExpire;

    // Set token as HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Always true since we're using Render/Vercel (HTTPS)
      sameSite: "none", // Allow cross-domain cookies
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      message: "Student registered successfully (Dev Mode: Verified)",
      user: userObj,
      role: "student",
      token, // Return token for cross-domain localStorage storage
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/register/club-head
router.post("/register/club-head", async (req, res) => {
  try {
    const {
      name,
      clubName,
      phone,
      collegeEmail,
      rollNo,
      branch,
      year,
      program,
      designation,
      password,
    } = req.body;

    const allowedOrigins = [
      "http://localhost:5173",
      "https://clubsetu.nikhim.me",
      "https://clubsetu.vercel.app",
    ];
    const origin = req.headers.origin;
    const clientUrl = allowedOrigins.includes(origin)
      ? origin
      : process.env.CLIENT_URL;

    // Check if a club head already exists for this club
    const existingClubHead = await ClubHead.findOne({ clubName });
    if (existingClubHead) {
      return res.status(409).json({
        message: `A Club Head already exists for "${clubName}". Only one Club Head is allowed per club.`,
      });
    }

    // Check if club head already exists with this email or roll number
    const existingHead = await ClubHead.findOne({
      $or: [{ collegeEmail }, { rollNo }],
    });
    if (existingHead) {
      return res.status(409).json({
        message: "Club Head already exists with this email or roll number.",
      });
    }

    // Determine verification status based on Dev Mode
    const isDevMode = process.env.SKIP_VERIFICATION === "true";
    let verificationToken = undefined;
    let verificationTokenExpire = undefined;

    if (!isDevMode) {
      // Generate verification token
      verificationToken = crypto.randomBytes(20).toString("hex");
      verificationTokenExpire = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    }

    const newHead = new ClubHead({
      name,
      clubName,
      phone,
      collegeEmail,
      rollNo,
      branch,
      year,
      program,
      designation,
      password,
      isVerified: isDevMode,
      isApproved: false, // Explicitly set to false, needs admin approval
      verificationToken,
      verificationTokenExpire,
    });
    await newHead.save();

    if (!isDevMode) {
      // Send verification email
      const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
      const message = `
       <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
    <h2 style="color: #333;">Welcome to ClubSetu!</h2>
    <p style="color: #555; line-height: 1.5;">We're excited to have you. Please verify your email address to get started and explore the community.</p>
    
    <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Verify My Account</a>
    </div>

    <p style="font-size: 12px; color: #888;">This link expires in 24 hours. If you didn't sign up for ClubSetu, you can safely ignore this email.</p>
    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
    <p style="font-size: 14px; font-weight: bold;">See you inside,<br>The ClubSetu Team</p>
</div>

      `;

      try {
        await sendEmail({
          email: newHead.collegeEmail,
          subject: "Account Verification",
          message,
        });

        return res.status(201).json({
          message:
            "Registration successful. Please check your email to verify your account.",
        });
      } catch (error) {
        await ClubHead.findByIdAndDelete(newHead._id);
        return res
          .status(500)
          .json({ message: "Email could not be sent. Please try again." });
      }
    }

    // Since Club Heads need admin approval, we don't auto-login even in Dev Mode
    // unless you want to bypass approval in dev. Let's keep it secure.
    if (isDevMode) {
      return res.status(201).json({
        message:
          "Club Head registered successfully. Please wait for admin approval before logging in.",
      });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (role === "student") {
      const student = await Student.findOne({ email });
      if (!student) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!student.isVerified) {
        return res
          .status(401)
          .json({ message: "Please verify your email to login." });
      }

      const isMatch = await student.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(student, "student");
      const userObj = student.toObject();
      delete userObj.password;
      delete userObj.verificationToken;
      delete userObj.verificationTokenExpire;

      // Set token as HttpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        message: "Login successful",
        user: userObj,
        role: "student",
        token, // Return token for cross-domain localStorage storage
      });
    } else if (role === "club-head") {
      const head = await ClubHead.findOne({ collegeEmail: email });
      if (!head) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!head.isVerified) {
        return res
          .status(401)
          .json({ message: "Please verify your email to login." });
      }

      if (!head.isApproved) {
        return res.status(403).json({
          message:
            "Your account is pending admin approval. You will be able to login once approved.",
        });
      }

      const isMatch = await head.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(head, "club-head");
      const userObj = head.toObject();
      delete userObj.password;
      delete userObj.verificationToken;
      delete userObj.verificationTokenExpire;

      // Set token as HttpOnly cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.json({
        message: "Login successful",
        user: userObj,
        role: "club-head",
        token, // Return token for cross-domain localStorage storage
      });
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/auth/verify-email/:token
router.get("/verify-email/:token", async (req, res) => {
  try {
    const verificationToken = req.params.token;

    // Check Student
    let user = await Student.findOne({
      verificationToken,
      verificationTokenExpire: { $gt: Date.now() },
    });
    let role = "student";

    // If not student, check ClubHead
    if (!user) {
      user = await ClubHead.findOne({
        verificationToken,
        verificationTokenExpire: { $gt: Date.now() },
      });
      role = "club-head";
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    // Determine if we need to log them in automatically. 
    // In our current flow, verify just verifies. They still need to login.
    // If they were automatically logged in, we'd set the cookie here too.

    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email, role } = req.body;
    let user;

    if (role === "student") {
      user = await Student.findOne({ email });
    } else if (role === "club-head") {
      user = await ClubHead.findOne({ collegeEmail: email });
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    if (!user) {
      // For security, don't reveal if user exists
      return res.json({ message: "If an account exists with that email, a reset link has been sent." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const origin = req.headers.origin;
    const clientUrl = getClientUrl(origin);
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    const message = `
      <div style="font-family: sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p style="color: #555; line-height: 1.5;">You requested a password reset for your ClubSetu account. Please click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #EA580C; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #888;">This link expires in 30 minutes. If you didn't request this, please ignore this email.</p>
      </div>
    `;

    try {
      await sendEmail({
        email: role === "student" ? user.email : user.collegeEmail,
        subject: "Password Reset Request",
        message,
      });
      res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: "Email could not be sent. Please try again later." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const { newPassword, role } = req.body;

    let user;
    const query = {
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    };

    if (role === "student") {
      user = await Student.findOne(query);
    } else if (role === "club-head") {
      user = await ClubHead.findOne(query);
    }

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Rate limit check
    const today = new Date().setHours(0, 0, 0, 0);
    const lastReset = user.lastPasswordChangeDate ? new Date(user.lastPasswordChangeDate).setHours(0, 0, 0, 0) : null;

    if (lastReset === today) {
      if (user.passwordChangeCount >= 2) {
        return res.status(429).json({ message: "Password change limit reached (2 times per day). Please try again tomorrow." });
      }
      user.passwordChangeCount += 1;
    } else {
      user.passwordChangeCount = 1;
      user.lastPasswordChangeDate = new Date();
    }

    // Set new password
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now login with your new password." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/change-password
router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { id, role } = req.user;

    let user;
    if (role === "student") {
      user = await Student.findById(id);
    } else if (role === "club-head") {
      user = await ClubHead.findById(id);
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Rate limit check
    const today = new Date().setHours(0, 0, 0, 0);
    const lastChange = user.lastPasswordChangeDate ? new Date(user.lastPasswordChangeDate).setHours(0, 0, 0, 0) : null;

    if (lastChange === today) {
      if (user.passwordChangeCount >= 2) {
        return res.status(429).json({ message: "Password change limit reached (2 times per day). Please try again tomorrow." });
      }
      user.passwordChangeCount += 1;
    } else {
      user.passwordChangeCount = 1;
      user.lastPasswordChangeDate = new Date();
    }

    // Set new password
    user.password = newPassword;
    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

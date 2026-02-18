import express from "express";
import crypto from "crypto";
import Student from "../models/Student.js";
import ClubHead from "../models/ClubHead.js";
import { generateToken } from "../middleware/auth.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// POST /api/auth/register/student
router.post("/register/student", async (req, res) => {
  try {
    const { name, rollNo, branch, year, program, email, password } = req.body;

    const allowedOrigins = [
      "http://localhost:5173",
      "https://clubsetu.nikhim.me",
      "https://clubsetu.vercel.app",
    ];
    const origin = req.headers.origin;
    const clientUrl = allowedOrigins.includes(origin)
      ? origin
      : process.env.CLIENT_URL;

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

    res.status(201).json({
      message: "Student registered successfully (Dev Mode: Verified)",
      user: userObj,
      role: "student",
      token,
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
      verificationToken,
      verificationTokenExpire,
    });
    await newHead.save();

    if (!isDevMode) {
      // Send verification email
      const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
      const message = `
        <h1>Email Verification - ClubSetu</h1>
        <p>Please click the link below to verify your account:</p>
        <a href="${verifyUrl}" clicktracking=off>${verifyUrl}</a>
        <p>This link will expire in 24 hours.</p>
        <p>Thanks for joining ClubSetu!</p>
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

    // If Dev Mode
    const token = generateToken(newHead, "club-head");
    const userObj = newHead.toObject();
    delete userObj.password;
    delete userObj.verificationToken;
    delete userObj.verificationTokenExpire;

    res.status(201).json({
      message: "Club Head registered successfully (Dev Mode: Verified)",
      user: userObj,
      role: "club-head",
      token,
    });
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

      return res.json({
        message: "Login successful",
        user: userObj,
        role: "student",
        token,
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

      const isMatch = await head.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(head, "club-head");
      const userObj = head.toObject();
      delete userObj.password;
      delete userObj.verificationToken;
      delete userObj.verificationTokenExpire;

      return res.json({
        message: "Login successful",
        user: userObj,
        role: "club-head",
        token,
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

    // After verification, we could optionally login the user or just remove token stuff
    // For now, return success message
    res
      .status(200)
      .json({ success: true, message: "Email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;

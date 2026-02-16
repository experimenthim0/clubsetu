const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const ClubHead = require("../models/ClubHead");

// POST /api/auth/register/student
router.post("/register/student", async (req, res) => {
  try {
    const { name, rollNo, branch, year, program, email, password } = req.body;

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

    const newStudent = new Student({
      name: name.toUpperCase(),
      rollNo,
      branch,
      year,
      program,
      email,
      password,
    });
    await newStudent.save();

    // In a real app, we'd return a JWT here
    res.status(201).json({
      message: "Student registered successfully",
      user: newStudent,
      role: "student",
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
    });
    await newHead.save();

    res.status(201).json({
      message: "Club Head registered successfully",
      user: newHead,
      role: "club-head",
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body; // role: 'student' or 'club-head'

    if (role === "student") {
      const student = await Student.findOne({ email });
      if (!student || student.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      return res.json({
        message: "Login successful",
        user: student,
        role: "student",
      });
    } else if (role === "club-head") {
      const head = await ClubHead.findOne({ collegeEmail: email });
      if (!head || head.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      return res.json({
        message: "Login successful",
        user: head,
        role: "club-head",
      });
    } else {
      return res.status(400).json({ message: "Invalid role specified" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

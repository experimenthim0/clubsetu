const express = require("express");
const router = express.Router();
const Student = require("../models/Student");
const ClubHead = require("../models/ClubHead");

// PUT /api/users/:role/:id
router.put("/:role/:id", async (req, res) => {
  const { role, id } = req.params;
  const updates = req.body;

  // Prevent updates to restricted fields
  delete updates.email;
  delete updates.rollNo;
  delete updates.collegeEmail; // for club head
  delete updates.password; // secure password update should be separate

  try {
    let user;
    if (role === "student") {
      user = await Student.findByIdAndUpdate(id, updates, { new: true });
    } else if (role === "club-head") {
      user = await ClubHead.findByIdAndUpdate(id, updates, { new: true });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Profile updated successfully", user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Event = require("./models/Event");

dotenv.config();

mongoose
  .connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/campus-pulse",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  )
  .then(() => {
    console.log("MongoDB Connected for Seeding");
    seedEvents();
  })
  .catch((err) => console.error(err));

const seedEvents = async () => {
  const events = [
    {
      title: "Tech Fest 2026",
      description:
        "The biggest technical festival of the year featuring hackathons, robotics, and coding challenges.",
      venue: "Main Auditorium",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days later
      totalSeats: 500,
    },
    {
      title: "Live Coding Workshop",
      description: "Learn React and Node.js in this hands-on workshop.",
      venue: "IT Building - Lab 1",
      startTime: new Date(Date.now() - 1000 * 60 * 30), // Started 30 mins ago
      endTime: new Date(Date.now() + 1000 * 60 * 60), // Ends in 1 hour
      totalSeats: 50,
    },
    {
      title: "Music Club Jam Session",
      description: "Open mic night for all music enthusiasts.",
      venue: "Student Activity Centre",
      startTime: new Date(Date.now() + 1000 * 60 * 60 * 5), // In 5 hours
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 8), // 3 hours duration
      totalSeats: 100,
    },
    {
      title: "Past Hackathon",
      description: "A hackathon that happened last week.",
      venue: "LHC",
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7), // 7 days ago
      endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
      totalSeats: 200,
    },
  ];

  try {
    const count = await Event.countDocuments();
    if (count === 0) {
      await Event.insertMany(events);
      console.log("Default events seeded successfully!");
    } else {
      console.log("Events already exist, skipping seed.");
    }
    process.exit();
  } catch (error) {
    console.error("Error seeding events:", error);
    process.exit(1);
  }
};

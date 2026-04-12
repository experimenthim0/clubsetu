import express from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { generateToken, verifyToken } from "../middleware/auth.js";
import sendEmail from "../utils/sendEmail.js";
import { getClientUrl } from "../utils/corsConfig.js";
import { sanitizeUser } from "../utils/sanitizeUser.js";
import { checkPasswordRateLimit } from "../utils/checkPasswordRateLimit.js";
import prisma from "../lib/prisma.js";
import { createObjectId } from "../utils/objectId.js";

const router = express.Router();
const ALLOWED_PROGRAMS = ["BTECH", "MTECH", "OTHER"];

router.post("/register/student", async (req, res) => {
  try {
    const { name, rollNo, branch, year, program, email, password } = req.body;
    const clientUrl = getClientUrl(req.headers.origin);

    if (!email.endsWith("@nitj.ac.in")) {
      return res.status(400).json({
        message: "Email must be a valid NITJ email (ending in @nitj.ac.in).",
      });
    }

    if (!name || name.length < 3) {
      return res.status(400).json({
        message: "Name must be at least 3 characters long.",
      });
    }

    if (!ALLOWED_PROGRAMS.includes(program)) {
      return res.status(400).json({ message: "Invalid program selected." });
    }

    if (program !== "OTHER" && (!rollNo || !branch || !year)) {
      return res.status(400).json({
        message:
          "Roll number, branch, and year are required for BTECH and MTECH registrations.",
      });
    }

    const orFilters = [{ email }];
    if (rollNo) orFilters.push({ rollNo });

    const existingUser = await prisma.user.findFirst({
      where: { OR: orFilters },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists with this email or roll number.",
      });
    }

    const isDevMode = process.env.NODE_ENV !== "production" && process.env.SKIP_VERIFICATION === "true";
    const verificationToken = isDevMode
      ? null
      : crypto.randomBytes(20).toString("hex");
    const verificationTokenExpire = isDevMode
      ? null
      : new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newUser = await prisma.user.create({
      data: {
        id: createObjectId(),
        name: name.toUpperCase(),
        rollNo: rollNo || null,
        branch: branch || null,
        year: year || null,
        program,
        email,
        password: await bcrypt.hash(password, 10),
        role: "member",
        isVerified: isDevMode,
        verificationToken,
        verificationTokenExpire,
      },
    });

    if (!isDevMode) {
      const verifyUrl = `${clientUrl}/verify-email/${verificationToken}`;
      const message = `
       <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">
  
  <h1 style="color: #FF4400; text-align: center;">
    Welcome to <span style="color:#000;">Club</span>Setu!
  </h1>

  <p style="font-size: 16px; text-align: center;">
    Hi ${name}, <br><br>
    Thank you for signing up. To complete your registration, please verify your email address.
  </p>

  <div style="text-align: center; margin: 30px 0;">
    <a href="${verifyUrl}" 
       style="background-color: #FF4400; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-size: 16px; 
              display: inline-block;">
      Verify My Account
    </a>
  </div>

  <p style="font-size: 14px; text-align: center; color: #777;">
    This link will expire in 24 hours for security reasons.
  </p>

  <p style="font-size: 14px; text-align: center; color: #777;">
    If the button doesn’t work, copy and paste this link into your browser:<br>
    <a href="${verifyUrl}" style="color: #FF7518;">${verifyUrl}</a>
  </p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

  <p style="font-size: 12px; text-align: center; color: #999;">
    If you didn’t create an account on ClubSetu, you can safely ignore this email.
  </p>

  <p style="font-size: 12px; text-align: center; color: #999;">
    This is an automated message, please do not reply.
  </p>

</div>
      `;

      try {
        await sendEmail({
          email: newUser.email,
          subject: "Account Verification",
          message,
        });

        return res.status(201).json({
          message:
            "Registration successful. Please check your email to verify your account.",
        });
      } catch {
        await prisma.user.delete({ where: { id: newUser.id } });
        return res.status(500).json({
          message: "Email could not be sent. Please try again.",
        });
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

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { club: { select: { clubName: true } } }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email to login." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const sensitiveRoles = ["admin", "facultyCoordinator", "club"];
    if (user.isTwoStepEnabled && sensitiveRoles.includes(user.role)) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpExpire = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: { otp, otpExpire },
      });

      await sendEmail({
        email: user.email,
        subject: "Login Verification Code",
        message: `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto; text-align: center;">

  <!-- Brand -->
  <h1 style="color: #FF4400;">
    <span style="color:#000;">Club</span>Setu
  </h1>

  <h2>Your Verification Code</h2>

  <p style="font-size: 16px;">
    Use the following OTP to login to your ClubSetu account:
  </p>

  <!-- OTP Box -->
  <div style="margin: 30px 0;">
    <span style="font-size: 28px; letter-spacing: 6px; font-weight: bold; background: #f4f4f4; padding: 10px 20px; border-radius: 8px; display: inline-block;">
      ${otp}
    </span>
  </div>

  <p style="font-size: 14px; color: #777;">
    This OTP will expire in <strong>5 minutes</strong>.
  </p>

  <p style="font-size: 14px; color: #777;">
    Do not share this code with anyone.
  </p>

  <p style="font-size: 14px; color: #777;">
    If you didn’t request this, please ignore this email.
  </p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

  <p style="font-size: 12px; color: #999;">
    © 2026 ClubSetu. All rights reserved.
  </p>

  <p style="font-size: 12px; color: #999;">
    This is an automated message, please do not reply.
  </p>

</div>`,
      });

      return res.json({
        needs2FA: true,
        email: user.email,
        message: "Verification code sent to your email.",
      });
    }

    const token = generateToken(user, user.role);
    const userObj = sanitizeUser(user);
    if (user.club) {
      userObj.clubName = user.club.clubName;
    }

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

router.post("/verify-2fa", async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        email,
        otp,
        otpExpire: { gt: new Date() },
      },
      include: { club: { select: { clubName: true } } }
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired OTP." });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpire: null },
    });

    const clearedUser = { ...user, otp: null, otpExpire: null };
    const token = generateToken(clearedUser, user.role);
    const userObj = sanitizeUser(clearedUser);
    if (user.club) {
      userObj.clubName = user.club.clubName;
    }

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

router.get("/verify-email/:token", async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: req.params.token,
        verificationTokenExpire: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: null,
        verificationTokenExpire: null,
      },
    });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    const resetUrl = `${getClientUrl(req.headers.origin)}/reset-password/${resetToken}`;
    const message = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: auto;">

  <!-- Brand Header -->
  <h1 style="color: #FF4400; text-align: center;">
    <span style="color:#000;">Club</span>Setu
  </h1>

  <h2 style="text-align: center;">Reset Your Password</h2>

  <p style="font-size: 16px; text-align: center;">
    We received a request to reset your ClubSetu account password.
  </p>

  <p style="font-size: 16px; text-align: center;">
    Click the button below to set a new password:
  </p>

  <!-- Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="${resetUrl}" 
       style="background-color: #FF4400; color: white; padding: 12px 24px; 
              text-decoration: none; border-radius: 5px; font-size: 16px; 
              display: inline-block;">
      Reset Password
    </a>
  </div>

  <!-- Security Info -->
  <p style="font-size: 14px; text-align: center; color: #777;">
    This link will expire in 15 minutes for security reasons.
  </p>

  <p style="font-size: 14px; text-align: center; color: #777;">
    If you didn’t request this, please ignore this email or secure your account.
  </p>

  <!-- Fallback -->
  <p style="font-size: 14px; text-align: center; color: #777;">
    If the button doesn’t work, copy and paste this link into your browser:<br>
    <a href="${resetUrl}" style="color: #FF7518;">${resetUrl}</a>
  </p>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

  <!-- Footer -->
  <p style="font-size: 12px; text-align: center; color: #999;">
    © 2026 ClubSetu. All rights reserved.
  </p>

  <p style="font-size: 12px; text-align: center; color: #999;">
    This is an automated message, please do not reply.
  </p>

</div>`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Request",
        message,
      });
      res.json({ message: "Reset link sent." });
    } catch {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetPasswordToken: null,
          resetPasswordExpire: null,
        },
      });
      return res.status(500).json({ message: "Email could not be sent." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const { newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        resetPasswordToken: null,
        resetPasswordExpire: null,
      },
    });

    res.json({ message: "Password reset successful." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/change-password", verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const { userId } = req.user;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!checkPasswordRateLimit(user)) {
      return res.status(429).json({
        message: "Daily password change limit exceeded. Try again tomorrow.",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(newPassword, 10),
        passwordChangeCount: user.passwordChangeCount + 1,
        lastPasswordChangeDate: new Date(),
      },
    });

    res.json({ message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

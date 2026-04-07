import crypto from "crypto";

/**
 * Generates a password reset token, hashes it, saves it on the user document,
 * and returns the raw (unhashed) token to be sent via email.
 */
export async function generateResetToken(user) {
  const resetToken = crypto.randomBytes(32).toString("hex");
  user.resetPasswordToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
  await user.save();
  return resetToken;
}

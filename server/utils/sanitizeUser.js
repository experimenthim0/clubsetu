/**
 * Strips sensitive fields from any user record before sending it to the client.
 * Works for StudentUser, AdminRole, and ExternalUser.
 */
export function sanitizeUser(userDoc) {
  const obj = { ...userDoc };
  [
    "password",
    "otp",
    "otpExpire",
    "verificationToken",
    "verificationTokenExpire",
    "resetPasswordToken",
    "resetPasswordExpire",
  ].forEach((k) => delete obj[k]);

  // Compatibility alias for frontend
  obj._id = obj.id;

  return obj;
}

/**
 * Strips sensitive fields from a user record before sending it to the client.
 */
export function sanitizeUser(userDoc) {
  const obj =
    typeof userDoc?.toObject === "function" ? userDoc.toObject() : { ...userDoc };
  [
    "password",
    "verificationToken",
    "verificationTokenExpire",
    "resetPasswordToken",
    "resetPasswordExpire",
  ].forEach((k) => delete obj[k]);

  // Compatibility alias for frontend
  obj._id = obj.id;
  
  return obj;
}

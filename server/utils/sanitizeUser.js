/**
 * Strips sensitive fields from a Mongoose user document before sending to client.
 */
export function sanitizeUser(userDoc) {
  const obj = userDoc.toObject();
  [
    "password",
    "verificationToken",
    "verificationTokenExpire",
    "resetPasswordToken",
    "resetPasswordExpire",
  ].forEach((k) => delete obj[k]);
  return obj;
}

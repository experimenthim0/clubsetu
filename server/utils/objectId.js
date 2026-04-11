import crypto from "crypto";

export function createObjectId() {
  return crypto.randomBytes(12).toString("hex");
}

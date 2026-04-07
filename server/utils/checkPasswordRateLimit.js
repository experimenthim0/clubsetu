/**
 * Checks and updates the daily password-change rate limit on a user document.
 * Returns true if the action is allowed, false if the limit is exceeded.
 * Mutates user.passwordChangeCount and user.lastPasswordChangeDate (caller must save).
 */
export function checkPasswordRateLimit(user) {
  const today = new Date().setHours(0, 0, 0, 0);
  const last = user.lastPasswordChangeDate
    ? new Date(user.lastPasswordChangeDate).setHours(0, 0, 0, 0)
    : null;

  if (last === today) {
    if (user.passwordChangeCount >= 2) return false;
    user.passwordChangeCount += 1;
  } else {
    user.passwordChangeCount = 1;
    user.lastPasswordChangeDate = new Date();
  }
  return true;
}

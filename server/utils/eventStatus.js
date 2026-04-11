export function getEventStatus(startTime, endTime) {
  const now = new Date();
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (now < start) return "UPCOMING";
  if (now >= start && now <= end) return "LIVE";
  return "ENDED";
}

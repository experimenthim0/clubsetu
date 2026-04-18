import { getEventStatus } from "./eventStatus.js";

export function serializeEvent(event) {
  if (!event) return event;

  return {
    ...event,
    _id: event.id,
    createdBy: event.createdBy
      ? { ...event.createdBy, _id: event.createdBy.id }
      : event.createdBy,
    reviewedBy: event.reviewedBy
      ? { ...event.reviewedBy, _id: event.reviewedBy.id }
      : event.reviewedBy,
    clubId: event.clubId ?? event.club?.id ?? null,
    club: event.club
      ? { ...event.club, _id: event.club.id }
      : event.club,
    waitingList: event.waitingListIds ?? [],
    status: getEventStatus(event.startTime, event.endTime),
  };
}

/**
 * Serialize a Participation record.
 * Normalises `student` → `user` in the API response for frontend compatibility.
 */
export function serializeParticipation(participation) {
  if (!participation) return participation;

  const user = participation.student;

  return {
    ...participation,
    _id: participation.id,
    userId: participation.studentId, // Keep userId for frontend compatibility
    user: user ? { ...user, _id: user.id } : null,
    event: participation.event ? serializeEvent(participation.event) : participation.event,
  };
}

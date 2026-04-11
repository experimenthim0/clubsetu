import { getEventStatus } from "./eventStatus.js";

export function serializeEvent(event) {
  if (!event) return event;

  return {
    ...event,
    _id: event.id,
    createdBy: event.createdBy
      ? {
          ...event.createdBy,
          _id: event.createdBy.id,
        }
      : event.createdBy,
    reviewedBy: event.reviewedBy
      ? {
          ...event.reviewedBy,
          _id: event.reviewedBy.id,
        }
      : event.reviewedBy,
    clubId: event.clubId ?? event.club?.id ?? null,
    club: event.club
      ? {
          ...event.club,
          _id: event.club.id,
        }
      : event.club,
    waitingList: event.waitingListIds ?? [],
    status: getEventStatus(event.startTime, event.endTime),
  };
}

export function serializeRegistration(registration) {
  if (!registration) return registration;

  return {
    ...registration,
    _id: registration.id,
    eventId: registration.eventId,
    userId: registration.userId,
    event: registration.event
      ? serializeEvent(registration.event)
      : registration.event,
    user: registration.user
      ? {
          ...registration.user,
          _id: registration.user.id,
        }
      : registration.user,
  };
}

/**
 * Shared constants and type definitions for the ClubSetu frontend.
 * These mirror the backend Prisma enums exactly.
 */

export const ParticipationStatus = Object.freeze({
  REGISTERED: 'REGISTERED',
  ATTENDED:   'ATTENDED',
  WAITLISTED: 'WAITLISTED',
  CANCELLED:  'CANCELLED',
});

export const ClubMemberRole = Object.freeze({
  CLUB_HEAD:   'CLUB_HEAD',
  COORDINATOR: 'COORDINATOR',
  MEMBER:      'MEMBER',
});

export const MediaType = Object.freeze({
  IMAGE:        'IMAGE',
  VIDEO:        'VIDEO',
  SPONSOR_LOGO: 'SPONSOR_LOGO',
});

/**
 * @typedef {{ name: string, logoUrl: string, websiteUrl?: string }} Sponsor
 * @typedef {{ url: string, type: 'IMAGE'|'VIDEO'|'SPONSOR_LOGO' }} Media
 * @typedef {{
 *   id: string, eventId: string, studentId: string|null,
 *   externalEmail: string|null, externalName: string|null,
 *   status: string, qrCode: string|null,
 *   attendedAt: string|null, markedByMemberId: string|null
 * }} Participation
 */

/**
 * Returns true if and only if `str` is a valid 24-character lowercase hex ObjectId.
 * @param {string} str
 * @returns {boolean}
 */
export function isValidObjectId(str) {
  return /^[a-f0-9]{24}$/.test(str);
}

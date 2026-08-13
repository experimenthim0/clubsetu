import prisma from "../lib/prisma.js";

/**
 * Check if a venue is already booked by a PUBLISHED event during [startTime, endTime].
 * Preserves the exact existing conflict rules:
 * venue == venue AND reviewStatus == "PUBLISHED" AND startTime < end AND endTime > start.
 */
export async function checkEventConflict({ venue, startTime, endTime, excludeEventId = null }) {
  if (!venue || !startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);

  const where = {
    venue,
    reviewStatus: "PUBLISHED",
    startTime: { lt: end },
    endTime: { gt: start },
  };

  if (excludeEventId) {
    where.id = { not: excludeEventId };
  }

  return prisma.event.findFirst({
    where,
    include: {
      club: { select: { id: true, clubName: true, slug: true } }
    }
  });
}

/**
 * Check if a venue has an active blackout period during [startTime, endTime].
 */
export async function checkBlackoutConflict({ venue, startTime, endTime, excludeBlackoutId = null }) {
  if (!venue || !startTime || !endTime) return null;

  const start = new Date(startTime);
  const end = new Date(endTime);

  try {
    const where = {
      venue,
      startTime: { lt: end },
      endTime: { gt: start },
    };

    if (excludeBlackoutId) {
      where.id = { not: excludeBlackoutId };
    }

    if (prisma.venueBlackout) {
      return await prisma.venueBlackout.findFirst({ where });
    } else {
      const rows = await prisma.$queryRaw`
        SELECT * FROM "VenueBlackout"
        WHERE venue = ${venue}
          AND "startTime" < ${end}
          AND "endTime" > ${start}
        LIMIT 1
      `;
      return rows[0] || null;
    }
  } catch (err) {
    console.warn("Blackout check error (table might be uninitialized):", err.message);
    return null;
  }
}

/**
 * Authoritative combined booking validator.
 * Validates both event venue conflicts and blackout windows.
 */
export async function validateBooking({ venue, startTime, endTime, excludeEventId = null, excludeBlackoutId = null }) {
  const blackoutConflict = await checkBlackoutConflict({ venue, startTime, endTime, excludeBlackoutId });
  if (blackoutConflict) {
    return {
      hasConflict: true,
      type: "BLACKOUT",
      message: `Venue "${venue}" is unavailable due to blackout: ${blackoutConflict.title}${blackoutConflict.reason ? ` (${blackoutConflict.reason})` : ''}`,
      conflictDetails: blackoutConflict
    };
  }

  const eventConflict = await checkEventConflict({ venue, startTime, endTime, excludeEventId });
  if (eventConflict) {
    return {
      hasConflict: true,
      type: "EVENT_OVERLAP",
      message: `Venue "${venue}" is already booked for "${eventConflict.title}" (${eventConflict.club?.clubName || "Club"}).`,
      conflictDetails: eventConflict
    };
  }

  return {
    hasConflict: false,
    type: null,
    message: null,
    conflictDetails: null
  };
}

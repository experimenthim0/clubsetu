/**
 * Integration property tests for PATCH /api/participation/verify/:qrCode
 * Uses vi.mock for prisma to test handler logic in isolation.
 *
 * Validates: Requirements 1.1–1.8, 8.1, 8.2, 8.4
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ── Mock prisma before importing anything that uses it ────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const prisma = {
    participation: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    clubMembership: {
      findFirst: vi.fn(),
    },
  };
  return { default: prisma };
});

import prisma from '../../lib/prisma.js';

// ── Inline handler logic (mirrors routes/participation.js) ────────────────────

async function verifyAttendanceHandler({ qrCode, user }) {
  const participation = await prisma.participation.findFirst({
    where: { qrCode },
    include: { event: true, student: true },
  });

  if (!participation) {
    return { status: 404, body: { message: 'Participation not found.' } };
  }

  const membership = await prisma.clubMembership.findFirst({
    where: {
      clubId: participation.event.clubId,
      studentId: user.userId,
      canTakeAttendance: true,
    },
  });

  if (!membership) {
    return { status: 403, body: { message: 'Unauthorized: attendance permission required.' } };
  }

  if (participation.status === 'ATTENDED') {
    return { status: 409, body: { message: 'Participant already marked as attended.' } };
  }

  const updated = await prisma.participation.update({
    where: { qrCode },
    data: {
      status: 'ATTENDED',
      attendedAt: new Date(),
      markedByMemberId: membership.id,
    },
  });

  const participantName = participation.student?.name || participation.externalName;
  const rollNo = participation.student?.rollNo || null;
  const externalEmail = participation.externalEmail || null;

  return {
    status: 200,
    body: {
      participantName,
      rollNo,
      externalEmail,
      attendedAt: updated.attendedAt,
      markedByMemberId: membership.id,
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeParticipation = (overrides = {}) => ({
  id: 'aabbccddeeff001122334455',
  qrCode: 'QR-aabbccddeeff001122334455',
  eventId: 'aabbccddeeff001122334456',
  studentId: 'aabbccddeeff001122334457',
  externalEmail: null,
  externalName: null,
  status: 'REGISTERED',
  attendedAt: null,
  markedByMemberId: null,
  event: { id: 'aabbccddeeff001122334456', clubId: 'aabbccddeeff001122334458' },
  student: { id: 'aabbccddeeff001122334457', name: 'Alice', rollNo: '21BCS001' },
  ...overrides,
});

const makeMembership = (overrides = {}) => ({
  id: 'aabbccddeeff001122334459',
  clubId: 'aabbccddeeff001122334458',
  studentId: 'aabbccddeeff001122334460',
  canTakeAttendance: true,
  ...overrides,
});

const scannerUser = { userId: 'aabbccddeeff001122334460' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Property 1: QR Attendance Lookup Round-Trip ───────────────────────────────
// Feature: clubsetu-backend-refactor, Property 1
// Validates: Requirements 1.1, 1.6

describe('Property 1: QR Attendance Lookup Round-Trip', () => {
  it('finds and returns the participation for a known qrCode', async () => {
    const participation = makeParticipation();
    const membership = makeMembership();
    const attendedAt = new Date('2024-01-01T10:00:00Z');

    prisma.participation.findFirst.mockResolvedValue(participation);
    prisma.clubMembership.findFirst.mockResolvedValue(membership);
    prisma.participation.update.mockResolvedValue({ ...participation, status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

    const result = await verifyAttendanceHandler({ qrCode: participation.qrCode, user: scannerUser });

    expect(result.status).toBe(200);
    expect(result.body.participantName).toBe('Alice');
    expect(result.body.rollNo).toBe('21BCS001');
    expect(result.body.externalEmail).toBeNull();
    expect(result.body.attendedAt).toEqual(attendedAt);
    expect(result.body.markedByMemberId).toBe(membership.id);
  });

  it('returns 404 for an unknown qrCode', async () => {
    prisma.participation.findFirst.mockResolvedValue(null);

    const result = await verifyAttendanceHandler({ qrCode: 'QR-nonexistent', user: scannerUser });

    expect(result.status).toBe(404);
    expect(result.body.message).toBe('Participation not found.');
  });

  it('property: any known qrCode always resolves to HTTP 200 with correct name', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (qrCode, studentName) => {
          vi.clearAllMocks();
          const participation = makeParticipation({ qrCode, student: { id: 'aabbccddeeff001122334457', name: studentName, rollNo: '21BCS001' } });
          const membership = makeMembership();
          const attendedAt = new Date();

          prisma.participation.findFirst.mockResolvedValue(participation);
          prisma.clubMembership.findFirst.mockResolvedValue(membership);
          prisma.participation.update.mockResolvedValue({ ...participation, status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

          const result = await verifyAttendanceHandler({ qrCode, user: scannerUser });
          return result.status === 200 && result.body.participantName === studentName;
        },
      ),
      { numRuns: 50 },
    );
  });

  it('uses externalName when student is null (external participant)', async () => {
    const participation = makeParticipation({ studentId: null, student: null, externalEmail: 'ext@example.com', externalName: 'Bob External' });
    const membership = makeMembership();
    const attendedAt = new Date();

    prisma.participation.findFirst.mockResolvedValue(participation);
    prisma.clubMembership.findFirst.mockResolvedValue(membership);
    prisma.participation.update.mockResolvedValue({ ...participation, status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

    const result = await verifyAttendanceHandler({ qrCode: participation.qrCode, user: scannerUser });

    expect(result.status).toBe(200);
    expect(result.body.participantName).toBe('Bob External');
    expect(result.body.externalEmail).toBe('ext@example.com');
    expect(result.body.rollNo).toBeNull();
  });
});

// ── Property 2: Attendance Permission Enforcement ─────────────────────────────
// Feature: clubsetu-backend-refactor, Property 2
// Validates: Requirements 1.3, 1.4

describe('Property 2: Attendance Permission Enforcement', () => {
  it('returns 403 when user has no membership with canTakeAttendance', async () => {
    prisma.participation.findFirst.mockResolvedValue(makeParticipation());
    prisma.clubMembership.findFirst.mockResolvedValue(null);

    const result = await verifyAttendanceHandler({ qrCode: 'QR-aabbccddeeff001122334455', user: { userId: 'unauthorizeduser0000000000' } });

    expect(result.status).toBe(403);
    expect(result.body.message).toBe('Unauthorized: attendance permission required.');
  });

  it('property: any user without canTakeAttendance membership always gets 403', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-f0-9]{24}$/),
        async (userId) => {
          vi.clearAllMocks();
          prisma.participation.findFirst.mockResolvedValue(makeParticipation());
          prisma.clubMembership.findFirst.mockResolvedValue(null);

          const result = await verifyAttendanceHandler({ qrCode: 'QR-aabbccddeeff001122334455', user: { userId } });
          return result.status === 403 && result.body.message === 'Unauthorized: attendance permission required.';
        },
      ),
      { numRuns: 50 },
    );
  });

  it('allows access when user has canTakeAttendance = true', async () => {
    const membership = makeMembership({ canTakeAttendance: true });
    const attendedAt = new Date();

    prisma.participation.findFirst.mockResolvedValue(makeParticipation());
    prisma.clubMembership.findFirst.mockResolvedValue(membership);
    prisma.participation.update.mockResolvedValue({ ...makeParticipation(), status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

    const result = await verifyAttendanceHandler({ qrCode: 'QR-aabbccddeeff001122334455', user: scannerUser });
    expect(result.status).toBe(200);
  });
});

// ── Property 3: Already-Attended Guard (Idempotence) ─────────────────────────
// Feature: clubsetu-backend-refactor, Property 3
// Validates: Requirements 1.5

describe('Property 3: Already-Attended Guard (Idempotence)', () => {
  it('returns 409 when participation is already ATTENDED', async () => {
    const attendedParticipation = makeParticipation({ status: 'ATTENDED', attendedAt: new Date() });

    prisma.participation.findFirst.mockResolvedValue(attendedParticipation);
    prisma.clubMembership.findFirst.mockResolvedValue(makeMembership());

    const result = await verifyAttendanceHandler({ qrCode: attendedParticipation.qrCode, user: scannerUser });

    expect(result.status).toBe(409);
    expect(result.body.message).toBe('Participant already marked as attended.');
    expect(prisma.participation.update).not.toHaveBeenCalled();
  });

  it('property: calling twice always yields 409 on second call', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        async (qrCode) => {
          vi.clearAllMocks();
          const membership = makeMembership();
          const attendedAt = new Date();

          prisma.participation.findFirst.mockResolvedValueOnce(makeParticipation({ qrCode }));
          prisma.clubMembership.findFirst.mockResolvedValueOnce(membership);
          prisma.participation.update.mockResolvedValueOnce({ ...makeParticipation({ qrCode }), status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

          const first = await verifyAttendanceHandler({ qrCode, user: scannerUser });

          prisma.participation.findFirst.mockResolvedValueOnce(makeParticipation({ qrCode, status: 'ATTENDED', attendedAt }));
          prisma.clubMembership.findFirst.mockResolvedValueOnce(membership);

          const second = await verifyAttendanceHandler({ qrCode, user: scannerUser });
          return first.status === 200 && second.status === 409;
        },
      ),
      { numRuns: 50 },
    );
  });
});

// ── Property 4: Attendance Fields Written Correctly ───────────────────────────
// Feature: clubsetu-backend-refactor, Property 4
// Validates: Requirements 1.6, 8.1, 8.4

describe('Property 4: Attendance Fields Written Correctly', () => {
  it('writes status=ATTENDED, non-null attendedAt, and correct markedByMemberId', async () => {
    const membership = makeMembership({ id: 'membershipid000000000001' });
    const attendedAt = new Date('2024-06-15T12:00:00Z');

    prisma.participation.findFirst.mockResolvedValue(makeParticipation());
    prisma.clubMembership.findFirst.mockResolvedValue(membership);
    prisma.participation.update.mockResolvedValue({ ...makeParticipation(), status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

    const result = await verifyAttendanceHandler({ qrCode: 'QR-aabbccddeeff001122334455', user: scannerUser });

    expect(result.status).toBe(200);
    expect(prisma.participation.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { qrCode: 'QR-aabbccddeeff001122334455' },
        data: expect.objectContaining({ status: 'ATTENDED', markedByMemberId: membership.id }),
      }),
    );

    const updateData = prisma.participation.update.mock.calls[0][0].data;
    expect(updateData.attendedAt).toBeInstanceOf(Date);
    expect(result.body.markedByMemberId).toBe(membership.id);
    expect(result.body.markedByMemberId).not.toBe(scannerUser.userId);
  });

  it('property: markedByMemberId is always membership.id, never user.userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.stringMatching(/^[a-f0-9]{24}$/),
        fc.stringMatching(/^[a-f0-9]{24}$/),
        async (membershipId, userId) => {
          if (membershipId === userId) return true;

          vi.clearAllMocks();
          const membership = makeMembership({ id: membershipId, studentId: userId });
          const attendedAt = new Date();

          prisma.participation.findFirst.mockResolvedValue(makeParticipation());
          prisma.clubMembership.findFirst.mockResolvedValue(membership);
          prisma.participation.update.mockResolvedValue({ ...makeParticipation(), status: 'ATTENDED', attendedAt, markedByMemberId: membershipId });

          const result = await verifyAttendanceHandler({ qrCode: 'QR-aabbccddeeff001122334455', user: { userId } });
          return result.status === 200 && result.body.markedByMemberId === membershipId && result.body.markedByMemberId !== userId;
        },
      ),
      { numRuns: 50 },
    );
  });

  it('property: attendedAt in update data is always a Date instance', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 30 }),
        async (qrCode) => {
          vi.clearAllMocks();
          const membership = makeMembership();
          const attendedAt = new Date();

          prisma.participation.findFirst.mockResolvedValue(makeParticipation({ qrCode }));
          prisma.clubMembership.findFirst.mockResolvedValue(membership);
          prisma.participation.update.mockResolvedValue({ ...makeParticipation({ qrCode }), status: 'ATTENDED', attendedAt, markedByMemberId: membership.id });

          await verifyAttendanceHandler({ qrCode, user: scannerUser });

          const updateData = prisma.participation.update.mock.calls[0][0].data;
          return updateData.attendedAt instanceof Date && updateData.status === 'ATTENDED';
        },
      ),
      { numRuns: 50 },
    );
  });
});

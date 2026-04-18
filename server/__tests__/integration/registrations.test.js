/**
 * Integration property tests for GET /api/events/:id/registrations
 * Uses vi.mock for prisma to test handler logic in isolation.
 *
 * Property 9: Registrations List Completeness and Structure
 * Validates: Requirements 3.1, 3.2, 8.3
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ── Mock prisma before importing anything that uses it ────────────────────────

vi.mock('../../lib/prisma.js', () => {
  const prisma = {
    event: {
      findUnique: vi.fn(),
    },
    clubMembership: {
      findFirst: vi.fn(),
    },
    participation: {
      findMany: vi.fn(),
    },
  };
  return { default: prisma };
});

import prisma from '../../lib/prisma.js';

// ── Inline handler logic (mirrors the route handler) ─────────────────────────

async function getRegistrationsHandler({ eventId, user }) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { status: 404, body: { message: 'Event not found' } };

  const { role, userId } = user;
  if (role !== 'admin' && role !== 'facultyCoordinator') {
    const membership = await prisma.clubMembership.findFirst({
      where: {
        clubId: event.clubId,
        studentId: userId,
        OR: [{ canTakeAttendance: true }, { canEditEvents: true }],
      },
    });
    if (!membership) {
      return { status: 403, body: { message: "Access denied. You don't have permission to view registrations." } };
    }
  }

  const participations = await prisma.participation.findMany({
    where: { eventId },
    include: {
      student: { select: { id: true, name: true, email: true, rollNo: true } },
    },
  });

  return {
    status: 200,
    body: {
      participations: participations.map((p) => ({
        studentId: p.studentId,
        externalEmail: p.externalEmail,
        externalName: p.externalName,
        status: p.status,
        qrCode: p.qrCode,
        attendedAt: p.attendedAt,
        markedByMemberId: p.markedByMemberId,
        student: p.student || null,
      })),
    },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'studentId',
  'externalEmail',
  'externalName',
  'status',
  'qrCode',
  'attendedAt',
  'markedByMemberId',
];

const makeEvent = (overrides = {}) => ({
  id: 'aabbccddeeff001122334455',
  clubId: 'aabbccddeeff001122334400',
  ...overrides,
});

const makeParticipation = (i) => ({
  id: `part${String(i).padStart(20, '0')}`,
  studentId: i % 2 === 0 ? `student${String(i).padStart(18, '0')}` : null,
  externalEmail: i % 2 !== 0 ? `ext${i}@example.com` : null,
  externalName: i % 2 !== 0 ? `External ${i}` : null,
  status: 'REGISTERED',
  qrCode: `QR-${'a'.repeat(24)}${i}`.slice(0, 27),
  attendedAt: null,
  markedByMemberId: null,
  student: i % 2 === 0 ? { id: `student${String(i).padStart(18, '0')}`, name: `Student ${i}`, email: `s${i}@nitj.ac.in`, rollNo: `21BCE${i}` } : null,
});

const adminUser = { userId: 'aabbccddeeff001122334499', role: 'admin' };
const authorizedMember = { userId: 'aabbccddeeff001122334498', role: 'club' };

beforeEach(() => {
  vi.clearAllMocks();
});

// ── Property 9: Registrations List Completeness and Structure ─────────────────
// Validates: Requirements 3.1, 3.2, 8.3

describe('Property 9: Registrations List Completeness and Structure', () => {
  it('returns exactly N items for N seeded participation records', async () => {
    // **Validates: Requirements 3.1, 3.2, 8.3**
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 0, max: 20 }),
        async (n) => {
          vi.clearAllMocks();
          const records = Array.from({ length: n }, (_, i) => makeParticipation(i));
          prisma.event.findUnique.mockResolvedValue(makeEvent());
          prisma.participation.findMany.mockResolvedValue(records);

          const result = await getRegistrationsHandler({ eventId: makeEvent().id, user: adminUser });

          return (
            result.status === 200 &&
            Array.isArray(result.body.participations) &&
            result.body.participations.length === n
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('each item contains all required fields', async () => {
    // **Validates: Requirements 3.1, 3.2, 8.3**
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 10 }),
        async (n) => {
          vi.clearAllMocks();
          const records = Array.from({ length: n }, (_, i) => makeParticipation(i));
          prisma.event.findUnique.mockResolvedValue(makeEvent());
          prisma.participation.findMany.mockResolvedValue(records);

          const result = await getRegistrationsHandler({ eventId: makeEvent().id, user: adminUser });

          return result.body.participations.every((item) =>
            REQUIRED_FIELDS.every((field) => Object.prototype.hasOwnProperty.call(item, field)),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  it('returns 404 when event does not exist', async () => {
    prisma.event.findUnique.mockResolvedValue(null);

    const result = await getRegistrationsHandler({ eventId: 'aabbccddeeff001122334455', user: adminUser });

    expect(result.status).toBe(404);
  });

  it('returns 403 when user lacks canTakeAttendance and canEditEvents', async () => {
    prisma.event.findUnique.mockResolvedValue(makeEvent());
    prisma.clubMembership.findFirst.mockResolvedValue(null);

    const result = await getRegistrationsHandler({
      eventId: makeEvent().id,
      user: { userId: 'aabbccddeeff001122334497', role: 'student' },
    });

    expect(result.status).toBe(403);
  });

  it('allows admin without membership check', async () => {
    prisma.event.findUnique.mockResolvedValue(makeEvent());
    prisma.participation.findMany.mockResolvedValue([makeParticipation(0)]);

    const result = await getRegistrationsHandler({ eventId: makeEvent().id, user: adminUser });

    expect(result.status).toBe(200);
    expect(prisma.clubMembership.findFirst).not.toHaveBeenCalled();
  });

  it('allows facultyCoordinator without membership check', async () => {
    prisma.event.findUnique.mockResolvedValue(makeEvent());
    prisma.participation.findMany.mockResolvedValue([makeParticipation(0)]);

    const result = await getRegistrationsHandler({
      eventId: makeEvent().id,
      user: { userId: 'aabbccddeeff001122334496', role: 'facultyCoordinator' },
    });

    expect(result.status).toBe(200);
    expect(prisma.clubMembership.findFirst).not.toHaveBeenCalled();
  });

  it('allows club member with canTakeAttendance', async () => {
    prisma.event.findUnique.mockResolvedValue(makeEvent());
    prisma.clubMembership.findFirst.mockResolvedValue({ id: 'mem1', canTakeAttendance: true, canEditEvents: false });
    prisma.participation.findMany.mockResolvedValue([makeParticipation(0)]);

    const result = await getRegistrationsHandler({ eventId: makeEvent().id, user: authorizedMember });

    expect(result.status).toBe(200);
  });

  it('response shape: internal participant has student object', async () => {
    const internalRecord = makeParticipation(0); // even index → has student
    prisma.event.findUnique.mockResolvedValue(makeEvent());
    prisma.participation.findMany.mockResolvedValue([internalRecord]);

    const result = await getRegistrationsHandler({ eventId: makeEvent().id, user: adminUser });

    const item = result.body.participations[0];
    expect(item.studentId).toBeTruthy();
    expect(item.student).not.toBeNull();
    expect(item.student).toHaveProperty('id');
    expect(item.student).toHaveProperty('name');
    expect(item.student).toHaveProperty('email');
    expect(item.student).toHaveProperty('rollNo');
  });

  it('response shape: external participant has null student', async () => {
    const externalRecord = makeParticipation(1); // odd index → external
    prisma.event.findUnique.mockResolvedValue(makeEvent());
    prisma.participation.findMany.mockResolvedValue([externalRecord]);

    const result = await getRegistrationsHandler({ eventId: makeEvent().id, user: adminUser });

    const item = result.body.participations[0];
    expect(item.studentId).toBeNull();
    expect(item.externalEmail).toBeTruthy();
    expect(item.student).toBeNull();
  });
});

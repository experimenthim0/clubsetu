import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma before importing controllers
vi.mock("../../lib/prisma.js", () => ({
  default: {
    clubMembership: {
      findUnique: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

// Feature: clubsetu-backend-refactor, Property 12: Last Club Head Protection
// Validates: Requirements 4.7
describe("removeClubMember - last club head protection", () => {
  let req, res, prisma;

  beforeEach(async () => {
    prisma = (await import("../../lib/prisma.js")).default;
    vi.clearAllMocks();

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("Property 12: returns HTTP 400 when attempting to remove the only CLUB_HEAD", async () => {
    // Feature: clubsetu-backend-refactor, Property 12: Last Club Head Protection
    // Validates: Requirements 4.7
    const { removeClubMember } = await import("../../controllers/clubMemberController.js");

    const membershipId = "aabbccddeeff001122334455";
    const clubId = "aabbccddeeff001122334456";

    prisma.clubMembership.findUnique.mockResolvedValue({
      id: membershipId,
      clubId,
      role: "CLUB_HEAD",
    });

    // Only 1 CLUB_HEAD exists
    prisma.clubMembership.count.mockResolvedValue(1);

    req = { params: { membershipId } };

    await removeClubMember(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Cannot remove the only Club Head") })
    );
    // Membership must NOT be deleted
    expect(prisma.clubMembership.delete).not.toHaveBeenCalled();
  });

  it("allows removing a CLUB_HEAD when another CLUB_HEAD exists", async () => {
    const { removeClubMember } = await import("../../controllers/clubMemberController.js");

    const membershipId = "aabbccddeeff001122334455";
    const clubId = "aabbccddeeff001122334456";

    prisma.clubMembership.findUnique.mockResolvedValue({
      id: membershipId,
      clubId,
      role: "CLUB_HEAD",
    });

    // 2 CLUB_HEADs exist
    prisma.clubMembership.count.mockResolvedValue(2);
    prisma.clubMembership.delete.mockResolvedValue({});

    req = { params: { membershipId } };

    await removeClubMember(req, res);

    expect(prisma.clubMembership.delete).toHaveBeenCalledWith({ where: { id: membershipId } });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Member removed successfully." })
    );
  });

  it("allows removing a non-CLUB_HEAD member without any head count check", async () => {
    const { removeClubMember } = await import("../../controllers/clubMemberController.js");

    const membershipId = "aabbccddeeff001122334455";

    prisma.clubMembership.findUnique.mockResolvedValue({
      id: membershipId,
      clubId: "aabbccddeeff001122334456",
      role: "MEMBER",
    });
    prisma.clubMembership.delete.mockResolvedValue({});

    req = { params: { membershipId } };

    await removeClubMember(req, res);

    expect(prisma.clubMembership.count).not.toHaveBeenCalled();
    expect(prisma.clubMembership.delete).toHaveBeenCalledWith({ where: { id: membershipId } });
  });
});

// Validates: Requirements 4.5
describe("updateMemberPermissions - role update derives permissions", () => {
  let req, res, prisma;

  beforeEach(async () => {
    prisma = (await import("../../lib/prisma.js")).default;
    vi.clearAllMocks();

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  it("updating role to COORDINATOR sets canEditEvents=true via derivePermissions", async () => {
    // Validates: Requirements 4.5
    const { updateMemberPermissions } = await import("../../controllers/clubMemberController.js");

    const membershipId = "aabbccddeeff001122334455";

    prisma.clubMembership.findUnique.mockResolvedValue({
      id: membershipId,
      role: "MEMBER",
    });

    prisma.clubMembership.update.mockResolvedValue({
      id: membershipId,
      role: "COORDINATOR",
      canTakeAttendance: true,
      canEditEvents: true,
      student: { name: "Test User" },
    });

    req = {
      params: { membershipId },
      body: { role: "COORDINATOR" },
    };

    await updateMemberPermissions(req, res);

    expect(prisma.clubMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "COORDINATOR",
          canTakeAttendance: true,
          canEditEvents: true,
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Permissions updated successfully." })
    );
  });

  it("updating role to MEMBER sets canEditEvents=false via derivePermissions", async () => {
    // Validates: Requirements 4.5
    const { updateMemberPermissions } = await import("../../controllers/clubMemberController.js");

    const membershipId = "aabbccddeeff001122334455";

    prisma.clubMembership.findUnique.mockResolvedValue({
      id: membershipId,
      role: "COORDINATOR",
    });

    prisma.clubMembership.update.mockResolvedValue({
      id: membershipId,
      role: "MEMBER",
      canTakeAttendance: true,
      canEditEvents: false,
      student: { name: "Test User" },
    });

    req = {
      params: { membershipId },
      body: { role: "MEMBER" },
    };

    await updateMemberPermissions(req, res);

    expect(prisma.clubMembership.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: "MEMBER",
          canTakeAttendance: true,
          canEditEvents: false,
        }),
      })
    );
  });

  it("returns HTTP 400 for an invalid role value", async () => {
    const { updateMemberPermissions } = await import("../../controllers/clubMemberController.js");

    req = {
      params: { membershipId: "aabbccddeeff001122334455" },
      body: { role: "superadmin" },
    };

    await updateMemberPermissions(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(prisma.clubMembership.update).not.toHaveBeenCalled();
  });
});

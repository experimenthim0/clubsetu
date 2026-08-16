import { describe, it, expect } from "vitest";
import { PERMISSIONS, ROLE_PERMISSIONS_MAP, hasPermission, roleHasPermission } from "../rbac.js";

describe("Granular RBAC Engine Tests", () => {
  describe("Role Permission Mapping Matrix", () => {
    it("SUPER_ADMIN / admin should possess all permissions", () => {
      const allPerms = Object.values(PERMISSIONS);
      allPerms.forEach((perm) => {
        expect(roleHasPermission("admin", perm)).toBe(true);
        expect(roleHasPermission("SUPER_ADMIN", perm)).toBe(true);
      });
    });

    it("STUDENT / member should have student capabilities and lack admin permissions", () => {
      expect(roleHasPermission("member", PERMISSIONS.EVENT_VIEW)).toBe(true);
      expect(roleHasPermission("member", PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
      expect(roleHasPermission("member", PERMISSIONS.REGISTRATION_CANCEL)).toBe(true);
      expect(roleHasPermission("member", PERMISSIONS.LOST_FOUND_CREATE)).toBe(true);

      expect(roleHasPermission("member", PERMISSIONS.EVENT_APPROVE)).toBe(false);
      expect(roleHasPermission("member", PERMISSIONS.CLUB_CREATE)).toBe(false);
      expect(roleHasPermission("member", PERMISSIONS.PAYOUT_APPROVE)).toBe(false);
    });

    it("external role should have event view, registration create, and registration cancel permissions", () => {
      expect(roleHasPermission("external", PERMISSIONS.EVENT_VIEW)).toBe(true);
      expect(roleHasPermission("external", PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
      expect(roleHasPermission("external", PERMISSIONS.REGISTRATION_CANCEL)).toBe(true);
      expect(roleHasPermission("external", PERMISSIONS.EVENT_APPROVE)).toBe(false);
      expect(roleHasPermission("external", PERMISSIONS.CLUB_CREATE)).toBe(false);
    });

    it("FACULTY / facultyCoordinator should have approval and club management capabilities", () => {
      expect(roleHasPermission("facultyCoordinator", PERMISSIONS.EVENT_APPROVE)).toBe(true);
      expect(roleHasPermission("facultyCoordinator", PERMISSIONS.CLUB_UPDATE)).toBe(true);
      expect(roleHasPermission("facultyCoordinator", PERMISSIONS.PAYMENT_VERIFY)).toBe(true);
      expect(roleHasPermission("facultyCoordinator", PERMISSIONS.CLUB_CREATE)).toBe(false);
    });

    it("LOST_FOUND_ADMIN should possess lost & found moderation privileges only", () => {
      expect(roleHasPermission("lostFoundAdmin", PERMISSIONS.LOST_FOUND_MODERATE)).toBe(true);
      expect(roleHasPermission("lostFoundAdmin", PERMISSIONS.LOST_FOUND_RESOLVE)).toBe(true);

      expect(roleHasPermission("lostFoundAdmin", PERMISSIONS.PAYMENT_REFUND)).toBe(false);
      expect(roleHasPermission("lostFoundAdmin", PERMISSIONS.EVENT_APPROVE)).toBe(false);
      expect(roleHasPermission("lostFoundAdmin", PERMISSIONS.CLUB_CREATE)).toBe(false);
    });
  });

  describe("Scoped Permission Checks", () => {
    const adminUser = { userId: "admin123", role: "admin" };
    const facultyUser = { userId: "fac123", role: "facultyCoordinator", clubId: "club_robotics" };
    const clubUser = { userId: "club123", role: "club", clubId: "club_robotics" };
    const studentUser = { userId: "stud123", role: "member" };

    it("Super admin passes all resource-scoped checks", () => {
      expect(hasPermission(adminUser, PERMISSIONS.EVENT_UPDATE, { clubId: "any_club" })).toBe(true);
      expect(hasPermission(adminUser, PERMISSIONS.EVENT_APPROVE, { clubId: "any_club" })).toBe(true);
    });

    it("Faculty Coordinator can only approve/update events for their assigned club", () => {
      expect(hasPermission(facultyUser, PERMISSIONS.EVENT_APPROVE, { clubId: "club_robotics" })).toBe(true);
      expect(hasPermission(facultyUser, PERMISSIONS.EVENT_APPROVE, { clubId: "club_coding" })).toBe(false);

      expect(hasPermission(facultyUser, PERMISSIONS.EVENT_UPDATE, { clubId: "club_robotics" })).toBe(true);
      expect(hasPermission(facultyUser, PERMISSIONS.EVENT_UPDATE, { clubId: "club_coding" })).toBe(false);
    });

    it("Club User can only update events for their assigned club", () => {
      expect(hasPermission(clubUser, PERMISSIONS.EVENT_UPDATE, { clubId: "club_robotics" })).toBe(true);
      expect(hasPermission(clubUser, PERMISSIONS.EVENT_UPDATE, { clubId: "club_coding" })).toBe(false);
    });

    it("Club users, Central Organizers, and Faculty should all be able to register for events", () => {
      expect(roleHasPermission("club", PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
      expect(roleHasPermission("club", PERMISSIONS.REGISTRATION_CANCEL)).toBe(true);
      expect(roleHasPermission("central_organizer", PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
      expect(roleHasPermission("central_organizer", PERMISSIONS.REGISTRATION_CANCEL)).toBe(true);
      expect(roleHasPermission("facultyCoordinator", PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
      expect(roleHasPermission("facultyCoordinator", PERMISSIONS.REGISTRATION_CANCEL)).toBe(true);
    });

    it("Regular student cannot approve or edit events but can register", () => {
      expect(hasPermission(studentUser, PERMISSIONS.EVENT_APPROVE, { clubId: "club_robotics" })).toBe(false);
      expect(hasPermission(studentUser, PERMISSIONS.EVENT_UPDATE, { clubId: "club_robotics" })).toBe(false);
      expect(hasPermission(studentUser, PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
      expect(hasPermission(clubUser, PERMISSIONS.REGISTRATION_CREATE)).toBe(true);
    });
  });
});

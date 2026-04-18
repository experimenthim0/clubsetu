import express from "express";
import { z } from "zod";
import { verifyToken, allowRoles } from "../middleware/auth.js";
import { validate, objectIdSchema } from "../middleware/validate.js";
import {
  addClubMember,
  getClubMembers,
  updateMemberPermissions,
  removeClubMember
} from "../controllers/clubMemberController.js";

const router = express.Router();

const clubIdParamSchema = z.object({
  params: z.object({ clubId: objectIdSchema }).passthrough(),
  body: z.any().optional(),
  query: z.any().optional(),
});

const membershipIdParamSchema = z.object({
  params: z.object({ membershipId: objectIdSchema }).passthrough(),
  body: z.any().optional(),
  query: z.any().optional(),
});

// All routes require token
router.use(verifyToken);

// GET /api/clubs/:clubId/members
router.get("/:clubId/members", validate(clubIdParamSchema), getClubMembers);

// POST /api/clubs/:clubId/members
router.post("/:clubId/members", allowRoles("admin", "club", "facultyCoordinator"), validate(clubIdParamSchema), addClubMember);

// PUT /api/clubs/members/:membershipId
router.put("/members/:membershipId", allowRoles("admin", "club", "facultyCoordinator"), validate(membershipIdParamSchema), updateMemberPermissions);

// DELETE /api/clubs/members/:membershipId
router.delete("/members/:membershipId", allowRoles("admin", "club", "facultyCoordinator"), validate(membershipIdParamSchema), removeClubMember);

export default router;

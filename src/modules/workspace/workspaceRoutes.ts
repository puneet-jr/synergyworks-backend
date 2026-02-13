import {Router} from 'express';

import { authenticate } from '../../shared/middlewares/authMiddleware.js';

import {requireWorkspaceMember,
    requireWorkspaceAdmin,
    requireWorkspaceOwner} from "../../shared/middlewares/workspaceAuth.js";

import { create, list, getById, update, remove, inviteMember, kickMember } from "./workspaceController.js";

const router=Router();

router.use(authenticate);

router.post("/",create);
router.get("/",list);


// Routes that require workspace membership
router.get("/:id", requireWorkspaceMember, getById);

// Routes that require admin/owner role
router.put("/:id", requireWorkspaceMember, requireWorkspaceAdmin, update);
router.delete("/:id", requireWorkspaceMember, requireWorkspaceOwner, remove);

// Member management (admin+ only)
router.post("/:id/members", requireWorkspaceMember, requireWorkspaceAdmin, inviteMember);
router.delete("/:id/members/:userId", requireWorkspaceMember, requireWorkspaceAdmin, kickMember);

export default router;



import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authMiddleware.js';
import {
    requireWorkspaceMember,
    requireWorkspaceAdmin,
    requireWorkspaceOwner
} from "../../shared/middlewares/workspaceAuth.js";
import {
    create,
    list,
    getById,
    update,
    remove,
    inviteMember,
    kickMember
} from "./workspaceController.js";

const router = Router();

router.use(authenticate);

router.post("/", create); 
router.get("/", list);    

// View (Any member)
router.get("/:id", requireWorkspaceMember, getById);

// Update (Admin/Owner)
router.put("/:id", requireWorkspaceAdmin, update);

// Delete (Owner only)
router.delete("/:id", requireWorkspaceOwner, remove);

// Member management (Admin/Owner)
router.post("/:id/members", requireWorkspaceAdmin, inviteMember);
router.delete("/:id/members/:userId", requireWorkspaceAdmin, kickMember);

export default router;

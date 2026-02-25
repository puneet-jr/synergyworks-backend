import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authMiddleware.js";
import {
    requireProjectAccess,
    requireProjectAdmin,
    requireProjectOwner,
    requireWorkspaceAccessForList,
} from "../../shared/middlewares/projectMiddleware.js";
import { create, listProjects, removeProject, editProject } from "./projectController.js";

const router = Router({ mergeParams: true });

// List projects for a workspace: /api/workspaces/:id/projects
router.get("/", authenticate, requireWorkspaceAccessForList, listProjects);

// Create project in a workspace: /api/workspaces/:id/projects
router.post("/", authenticate, create);

// Editing requires membership
router.put("/:projectId", authenticate, requireProjectAccess, requireProjectAdmin, editProject);

// Deletion requires ownership
router.delete("/:projectId", authenticate, requireProjectAccess, requireProjectOwner, removeProject);

export default router;

import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authMiddleware.js";
import {
    requireProjectAccess,
    requireProjectAdmin,
    requireProjectOwner
} from "../../shared/middlewares/projectMiddleware.js";
import { create, listProjects, removeProject, editProject } from "./projectController.js";

const router = Router({ mergeParams: true }); 
// mergeParams: true is critical — without it, :id from the parent 
// workspace router won't be visible inside this router

// Any authenticated workspace member can list and view projects
router.get("/",    authenticate, requireProjectAccess, listProjects);

// Creating requires authentication only (workspace membership checked in middleware)
// Note: for CREATE, the project doesn't exist yet, so requireProjectAccess
// can't fetch it — handle workspace membership separately if needed
router.post("/",   authenticate, create);

// Editing requires membership
router.put("/:projectId",    authenticate, requireProjectAccess, requireProjectAdmin, editProject);

// Deletion requires ownership
router.delete("/:projectId", authenticate, requireProjectAccess, requireProjectOwner, removeProject);

export default router;
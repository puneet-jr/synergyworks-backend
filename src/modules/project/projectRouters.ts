import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authMiddleware.js";
import {
    requireProjectAccess,
    requireProjectAdmin,
    requireProjectOwner
} from "../../shared/middlewares/projectMiddleware.js";
import { create, listProjects, removeProject, editProject } from "./projectController.js";

const router = Router({ mergeParams: true }); 


router.get("/",    authenticate, requireProjectAccess, listProjects);


router.post("/",   authenticate, create);

// Editing requires membership
router.put("/:projectId",    authenticate, requireProjectAccess, requireProjectAdmin, editProject);

// Deletion requires ownership
router.delete("/:projectId", authenticate, requireProjectAccess, requireProjectOwner, removeProject);

export default router;
import { Router } from 'express';
import { authenticate } from '../../shared/middlewares/authMiddleware.js';
import {
    requireWorkspaceMember,
    requireWorkspaceAdmin,
    requireWorkspaceOwner
} from "../../shared/middlewares/workspaceAuth.js";


import { getTaskSummary,getTasks,getTaskById,createTask,removeTask,updateTask,assignTask } from "./taskController.js";


const router=Router();

router.use(authenticate);

router.get("/:id/getTaskSummary",requireWorkspaceAdmin || requireWorkspaceOwner,getTaskSummary);

router.get("/:id/getTaskById",requireWorkspaceMember || requireWorkspaceOwner || requireWorkspaceAdmin,getTaskById);

router.get("/:id/getTasks",requireWorkspaceMember || requireWorkspaceOwner || requireWorkspaceAdmin,getTasks);
router.post("/:id/assignTask",requireWorkspaceAdmin || requireWorkspaceOwner,assignTask);

router.put("/:id/updateTask",requireWorkspaceAdmin || requireWorkspaceOwner,updateTask);

router.post("/:id/createTask", requireWorkspaceMember, createTask);

router.delete("/:id/delete/removeTask",requireWorkspaceAdmin || requireWorkspaceOwner,removeTask);

export default router;




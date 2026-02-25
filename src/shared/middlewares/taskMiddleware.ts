import { Request, Response, NextFunction } from "express";
import { findTasksById } from "../../db/queries/taskQueries.js";
import { PermissionError, AuthError, NotFoundError } from "../errors/App.Error.js";

declare global {
    namespace Express {
        interface Request {
            task?: {
                id: string;
                workspaceId: string;
                assignedTo: string | null;
            };
        }
    }
}

/**
 * THINKING: 
 * workspaceMember is already verified at this point (requireWorkspaceMember ran first).
 * So we know: user exists, user is in the workspace.
 * 
 * This middleware only needs to answer: "Does this task exist in THIS workspace?"
 * We use workspaceMember.workspaceId (not raw req.params) — already validated, never trust raw params alone.
 */
export async function requireTaskAccess(
    req: Request,
    res: Response,
    next: NextFunction
) {
    try {
        const member = req.workspaceMember;
        const taskId = req.params.taskId;

        // workspaceMember should always exist here since requireWorkspaceMember runs first
        // but we guard anyway — defensive programming
        if (!member) {
            return next(new AuthError("User not authenticated"));
        }

        if (!taskId) {
            return next(new NotFoundError("Task ID is required"));
        }

        // findTasksById checks BOTH workspaceId AND taskId in one query
        // This prevents a user from accessing a task in another workspace
        // even if they somehow know the taskId — called an IDOR (Insecure Direct Object Reference)
        const task = await findTasksById(member.workspaceId, taskId as string );

        if (!task) {
            return next(new NotFoundError("Task not found"));
        }

        // Attach to request so controllers don't need to re-fetch it
        req.task = {
            id: task.id,
            workspaceId: task.workspace_id,
            assignedTo: task.assigned_to,
        };

        next();
    } catch (error) {
        next(error);
    }
}

/**
 * THINKING:
 * Who can modify/delete a task?
 * - Admins and owners: yes, always (they manage the workspace)
 * - Regular members: only if the task is assigned to them
 * 
 * This runs AFTER requireTaskAccess, so req.task is guaranteed to exist.
 */
export function requireTaskPermission(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const member = req.workspaceMember;
    const task = req.task;

    if (!member || !task) {
        return next(new AuthError("User not authenticated"));
    }

    const isAdminOrOwner = member.role === "admin" || member.role === "owner";
    const isAssignedUser = task.assignedTo === member.userId;

    if (!isAdminOrOwner && !isAssignedUser) {
        return next(new PermissionError("You do not have permission to modify this task"));
    }

    next();
}

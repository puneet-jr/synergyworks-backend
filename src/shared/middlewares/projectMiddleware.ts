import { Request, Response, NextFunction } from 'express';
import { findMember } from "../../db/queries/workspaceQueries.js";
import { findProjectById } from "../../db/queries/projectQueries.js"; // Import the new query
import { PermissionError, AuthError, NotFoundError,ValidationError } from "../errors/App.Error.js";

// Extend Request types for TypeScript
declare global {
    namespace Express {
        interface Request {
            project?: any; // The full project object
            workspaceId?: string; // The ID of the workspace the project belongs to
            memberRole?: string; // The user's role in this workspace ('owner', 'admin', 'member')
        }
    }
}

interface ProjectParams{
    projectId:string;
}

// 1. HEAVY LIFTER: Fetch Project + Check Membership
export const requireProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.userId;
        // We assume the route is like /projects/:projectId
        const projectId = req.params.projectId as string; // Extract the projectId string

        if (!userId) {
            return next(new AuthError("User not authenticated"));
        }

        if (!projectId) {
            return next(new ValidationError("Project ID is required"));
        }

        // A. Fetch the project to find its workspace_id
        const project = await findProjectById(projectId);
        
        if (!project) {
            return next(new NotFoundError("Project not found"));
        }

        // B. Check if user is a member of that workspace
        const membership = await findMember(userId, project.workspace_id);

        if (!membership) {
            return next(new PermissionError("You do not have access to this project"));
        }

        // C. SUCCESS: Attach data to req object for the controller to use
        req.project = project;
        req.workspaceId = project.workspace_id;
        req.memberRole = membership.role; // Assuming findMember returns { role: '...' }

        next(); // Crucial: Continue to the next middleware/controller

    } catch (error) {
        next(error);
    }
};

// 2. ROLE CHECKER: Ensure User is Owner
// This must run AFTER requireProjectAccess
export const requireProjectOwner = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // We rely on req.memberRole being set by the previous middleware
        if (!req.memberRole) {
             // If this is missing, the previous middleware failed or was skipped
            return next(new AuthError("Authorization data missing"));
        }

        if (req.memberRole !== 'owner') {
            return next(new PermissionError("Only the workspace owner can perform this action"));
        }

        next();
    } catch (error) {
        next(error);
    }
};

// 3. ROLE CHECKER: Ensure User is Admin or Owner
export const requireProjectAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.memberRole) {
            return next(new AuthError("Authorization data missing"));
        }

        const isAdmin = req.memberRole === 'admin' || req.memberRole === 'owner';
        
        if (!isAdmin) {
            return next(new PermissionError("Admin privileges required"));
        }

        next();
    } catch (error) {
        next(error);
    }
};
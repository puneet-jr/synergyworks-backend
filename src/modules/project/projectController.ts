import { Request, Response, NextFunction } from "express";
import asyncHandler from "../../shared/middlewares/asyncHandler.js";
import { ValidationError, NotFoundError } from "../../shared/errors/App.Error.js";
import {
    createProject,
    getProjectsByWorkspaceId,
    updateProject,
    deleteProject
} from "../../db/queries/projectQueries.js";



export const create = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.params.id as string; // ← this is the fix. route is /workspaces/:id/projects
    const { title, description } = req.body;

    if (!title?.trim()) {
        throw new ValidationError("Title is required");
    }

    const newProjectId = await createProject(title.trim(), description?.trim() || null, workspaceId);

    res.status(201).json({
        success: true,
        message: "Project created successfully",
        data: {
            newProjectId,
            title: title.trim(),
            description: description?.trim() || null,
        },
    });
});

export const listProjects = asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = req.workspaceId!; // safe — requireProjectAccess already verified this

    const projects = await getProjectsByWorkspaceId(workspaceId);

    res.status(200).json({
        success: true,
        data: projects,
    });
});

export const removeProject = asyncHandler(async (req: Request, res: Response) => {
    const  projectId  = req.params.projectId as string; // always a string in Express route params

    await deleteProject(projectId);

    res.status(200).json({
        success: true,
        message: "Project deleted successfully",
    });
});

export const editProject = asyncHandler(async (req: Request, res: Response) => {
    const  projectId  = req.params.projectId as string;
    const { title, description } = req.body;

    if (!title?.trim()) {
        throw new ValidationError("Title is required");
    }

    const updated = await updateProject(projectId, title.trim(), description?.trim() || null);
    if (!updated) {
        throw new NotFoundError("Project not found or nothing changed");
    }

    res.status(200).json({
        success: true,
        message: "Project updated successfully",
    });
});

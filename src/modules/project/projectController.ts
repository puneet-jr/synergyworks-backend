import {Request, Response, NextFunction} from "express";

import asyncHandler from "../../shared/middlewares/asyncHandler.js";

import {
    ValidationError,
    NotFoundError,
    PermissionError,
    ConflictError
} from "../../shared/errors/App.Error.js";

import {
    getProjectsSummary,
    createProject,
    getProjectsByWorkspaceId,
    getProjectById,updateProject,
    deleteProject
} from "../../db/queries/projectQueries.js";



export const create= asyncHandler(async(req:Request, res:Response, next:NextFunction) => {

    const projectId = req.params.projectId;
    const {title, description} = req.body;

    const newProjectId = await createProject(title, description, projectId as string);

    res.status(201).json({
        success:true,
        message:"Project created successfully",
        data:{
            newProjectId,
            title: title.trim(),
            description: description?.trim() || null,
        },
    });
});

export const removeProject = asyncHandler(async(req: Request, res: Response, next: NextFunction) => {
    const { projectId } = req.params;

    const id = Array.isArray(projectId) ? projectId[0] : projectId;
    const deleted = await deleteProject(id);

    res.status(200).json({
        deleted,
        success: true,
        message: "Project deleted successfully",
    });
});
 



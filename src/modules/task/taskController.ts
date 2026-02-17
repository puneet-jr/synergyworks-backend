import { Request, Response, NextFunction } from "express";

import asyncHandler from "../../shared/middlewares/asyncHandler.js";

import {
    ValidationError,
    NotFoundError,
    PermissionError,
    ConflictError
} from "../../shared/errors/App.Error.js";

import {
    createTask,deleteTask,
    updateTask,findTaskSummaryByWorkspaceId,
    findTasksById,findTasksByWorkspaceIdPaginated,
    countTasksByWorkspaceId
} from "../../db/queries/taskQueries.js";


export const create = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const taskId= await createTask(req.params.id, req.body.title,req.body.assignedTo,req.body.description,req.body.status);

    res.status(200).json({
        success:true,
        message:{"Task created successfully"},
        
    })
});



import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

import asyncHandler from "../../shared/middlewares/asyncHandler.js";



import {
    ValidationError,
    NotFoundError
} from "../../shared/errors/App.Error.js";

import {
    createTask as createTaskQuery,
    deleteTask as deleteTaskQuery,
    updateTask as updateTaskQuery,
    findTaskSummaryByWorkspaceId,
    findTasksById,
    findTasksByWorkspaceIdPaginated,
    countTasksByWorkspaceId
} from "../../db/queries/taskQueries.js";

import {
    createTaskSchema,
    updateTaskSchema,
    assignTaskSchema
} from "../../validators/validators.js";
import { paginationSchema } from "../../validators/validators.js";

export const getTaskSummary = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.workspaceMember!.workspaceId;
    const summary = await findTaskSummaryByWorkspaceId(workspaceId);

    if (!summary) {
        return next(new NotFoundError("Workspace not found"));
    }

    res.status(200).json({
        success: true,
        data: {
            workspaceId: summary.workspaceId,
            workspaceName: summary.workspaceName,
            todoCount: summary.todoCount,
            inProgressCount: summary.inProgressCount,
            doneCount: summary.doneCount,
            totalCount: summary.totalCount,
            completionPercentage: summary.completionPercentage,
        },
    });
});

export const getTasks = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.workspaceMember!.workspaceId;
    const { page, limit, search } = paginationSchema.parse(req.query);

    const offset = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
        findTasksByWorkspaceIdPaginated(workspaceId, limit, offset, search),
        countTasksByWorkspaceId(workspaceId, search),
    ]);

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    res.status(200).json({
        success: true,
        data: {
            tasks: tasks.map((t) => ({
                id: t.id,
                title: t.title,
                description: t.description,
                status: t.status,
                workspaceId: t.workspace_id,
                assignedTo: t.assigned_to,
                createdAt: t.created_at,
                updatedAt: t.updated_at,
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
                count: tasks.length,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
        },
    });
});

export const getTaskById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const task = req.task!;
    const fullTask = await findTasksById(task.workspaceId, task.id);

    if (!fullTask) {
        return next(new NotFoundError("Task not found"));
    }

    res.status(200).json({
        success: true,
        data: {
            id: fullTask.id,
            title: fullTask.title,
            description: fullTask.description,
            status: fullTask.status,
            workspaceId: fullTask.workspace_id,
            assignedTo: fullTask.assigned_to,
            createdAt: fullTask.created_at,
            updatedAt: fullTask.updated_at,
        },
    });
});

export const createTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.workspaceMember!.workspaceId;
    const parsed = createTaskSchema.safeParse(req.body);

    if (!parsed.success) {
        const msg = parsed.error.issues.map((e: { message: string }) => e.message).join("; ");
        return next(new ValidationError(msg || "Validation failed"));
    }

    const { title, description, status } = parsed.data;
    const taskId = randomUUID();

    await createTaskQuery(
        taskId,
        title,
        description?.trim() ?? null,
        status ?? "todo",
        workspaceId,
        null
    );

    res.status(201).json({
        success: true,
        message: "Task created successfully",
        data: {
            id: taskId,
            title: title.trim(),
            description: description?.trim() ?? null,
            status: status ?? "todo",
            workspaceId,
            assignedTo: null,
        },
    });
});

export const updateTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const task = req.task!;
    const parsed = updateTaskSchema.safeParse(req.body);

    if (!parsed.success) {
        const msg = parsed.error.issues.map((e: { message: string }) => e.message).join("; ");
        return next(new ValidationError(msg || "Validation failed"));
    }

    const { title, description, status } = parsed.data;
    const current = await findTasksById(task.workspaceId, task.id);

    if (!current) {
        return next(new NotFoundError("Task not found"));
    }

    const newTitle = title !== undefined ? title.trim() : current.title;
    const newDescription = description !== undefined ? description?.trim() ?? null : current.description;
    const newStatus = status ?? current.status;

    await updateTaskQuery(
        task.id,
        newTitle,
        newDescription,
        newStatus,
        current.assigned_to
    );

    res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data: {
            id: task.id,
            title: newTitle,
            description: newDescription,
            status: newStatus,
            assignedTo: current.assigned_to,
        },
    });
});

export const assignTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const task = req.task!;
    const parsed = assignTaskSchema.safeParse(req.body);

    if (!parsed.success) {
        const msg = parsed.error.issues.map((e: { message: string }) => e.message).join("; ");
        return next(new ValidationError(msg || "Validation failed"));
    }

    const current = await findTasksById(task.workspaceId, task.id);

    if (!current) {
        return next(new NotFoundError("Task not found"));
    }

    await updateTaskQuery(
        task.id,
        current.title,
        current.description,
        current.status,
        parsed.data.assignedTo
    );

    res.status(200).json({
        success: true,
        message: "Task assigned successfully",
        data: {
            id: task.id,
            assignedTo: parsed.data.assignedTo,
        },
    });
});

export const removeTask = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const task = req.task!;

    await deleteTaskQuery(task.id);

    res.status(200).json({
        success: true,
        message: "Task deleted successfully",
    });
});

import Router from "express";


import {
    createProject,
    getProjectsByWorkspaceId,
    getProjectById,
    getProjectsSummary
} from "../../db/queries/projectQueries.js";

import { authenticate } from "../../shared/middlewares/authMiddleware.js";

import { createProjectSchema, updateProjectSchema, deleteProjectSchema } from "../../validators/validators.js";

const router= Router();


// Middleware to validate request body using Zod schema
const validateCreateProject = (req, res, next) => {
    try {
        createProjectSchema.parse(req.body);
        next();
    } catch (err) {
        return res.status(400).json({ error: err.errors });
    }
};

router.post("/:id/createProject", authenticate, validateCreateProject, createProject);



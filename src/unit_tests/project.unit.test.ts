import { Request, Response, NextFunction } from 'express';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

jest.mock("../db/queries/project.queries", () => ({
    getAllProjects: jest.fn(),
    getProjectById: jest.fn(),
    createProject: jest.fn(),
    updateProject: jest.fn(),
    deleteProject: jest.fn(),
}));

import {
    getProjectsByWorkspaceId,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    findProjectById
} from '../db/queries/projectQueries.js';

import {
    create,
    listProjects,
    editProject,
    removeProject
} from '../modules/project/projectController.js';

const mockGetProjectsByWorkspaceId = getProjectsByWorkspaceId as jest.Mock<typeof getProjectsByWorkspaceId>;
const mockCreateProject = createProject as jest.Mock<typeof createProject>;
const mockUpdateProject = updateProject as jest.Mock<typeof updateProject>;
const mockDeleteProject = deleteProject as jest.Mock<typeof deleteProject>;

function makeMocks(
    params: Record<string, any> = {},
    body: Record<string, any> = {},
    query: Record<string, any> = { workspaceId: '1' }
) {
    const req = { params, body, query } as unknown as Request;
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn() as unknown as NextFunction;
    return { req, res, next };
}

beforeEach(async() => jest.clearAllMocks());

describe("Project Controller", () => {
    describe("getAllProjectsHandler", () => {
        it("should return all projects for a workspace", async () => {
            const { req, res, next } = makeMocks();
            const mockProjects = [
                { id: '1', name: 'Project 1' },
                { id: '2', name: 'Project 2' }
            ] as unknown as any[];

            mockGetProjectsByWorkspaceId.mockResolvedValue(mockProjects);
            await listProjects(req, res, next);

            expect(mockGetProjectsByWorkspaceId).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProjects);
        });

        it("should handle errors", async () => {
            const { req, res, next } = makeMocks();
            const mockError = new Error("Database error");

            mockGetProjectsByWorkspaceId.mockRejectedValue(mockError);
            await listProjects(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });

        it("should return empty array if no projects found", async () => {
            const { req, res, next } = makeMocks();
            const mockProjects: any[] = [];

            mockGetProjectsByWorkspaceId.mockResolvedValue(mockProjects);
            await listProjects(req, res, next);

            expect(mockGetProjectsByWorkspaceId).toHaveBeenCalledWith('1');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(mockProjects);
        });

        it("should return 404 if workspace not found", async () => {
            const { req, res, next } = makeMocks();
            const mockError = new Error("Workspace not found");

            mockGetProjectsByWorkspaceId.mockRejectedValue(mockError);
            await listProjects(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });

        it("should return 500 if database error occurs", async () => {
            const { req, res, next } = makeMocks();
            const mockError = new Error("Database error");

            mockGetProjectsByWorkspaceId.mockRejectedValue(mockError);
            await listProjects(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });
    });

    describe("Create Project", () => {
        it("returns 201 and project data on successful creation", async () => {
            mockCreateProject.mockResolvedValue("123");
            const { req, res, next } = makeMocks(
                { id: '1' },
                { title: 'New Project', description: 'Project description' }
            );

            await create(req, res, next);

            expect(mockCreateProject).toHaveBeenCalledWith(
                'New Project',
                'Project description',
                '1'
            );
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project created successfully",
                data: {
                    newProjectId: "123",
                    title: 'New Project',
                    description: 'Project description'
                }
            });
        });

        it("calls next with ValidationError if title is missing", async () => {
            const { req, res, next } = makeMocks(
                { id: '1' },
                { description: 'Project description' }
            );

            await create(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: "Title is required"
            }));
        });

        it("calls next with error if createProject throws", async () => {
            const mockError = new Error("Database error");
            mockCreateProject.mockRejectedValue(mockError);

            const { req, res, next } = makeMocks(
                { id: '1' },
                { title: 'New Project', description: 'Project description' }
            );

            await create(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });
    });

    describe("Edit Project", () => {
        it("returns 200 and success message on successful update", async () => {
            mockUpdateProject.mockResolvedValue(true);
            const { req, res, next } = makeMocks(
                { projectId: '123' },
                { title: 'Updated Project', description: 'Updated description' }
            );

            await editProject(req, res, next);

            expect(mockUpdateProject).toHaveBeenCalledWith(
                '123',
                'Updated Project',
                'Updated description'
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project updated successfully",
            });
        });

        it("calls next with ValidationError if title is missing", async () => {
            const { req, res, next } = makeMocks(
                { projectId: '123' },
                { description: 'Updated description' }
            );

            await editProject(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: "Title is required"
            }));
        });

        it("calls next with error if updateProject throws", async () => {
            const mockError = new Error("Database error");
            mockUpdateProject.mockRejectedValue(mockError);

            const { req, res, next } = makeMocks(
                { projectId: '123' },
                { title: 'Updated Project', description: 'Updated description' }
            );

            await editProject(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });

        it("calls next with error if project not found", async () => {
            mockUpdateProject.mockResolvedValue(false);
            const { req, res, next } = makeMocks(
                { projectId: '123' },
                { title: 'Updated Project', description: 'Updated description' }
            );

            await editProject(req, res, next);

            expect(next).toHaveBeenCalledWith(expect.objectContaining({
                message: "Project not found or nothing changed"
            }));
        });
    });

    describe("Remove Project", () => {
        it("returns 200 and success message on successful deletion", async () => {
            mockDeleteProject.mockResolvedValue(undefined);
            const { req, res, next } = makeMocks({ projectId: '123' });

            await removeProject(req, res, next);

            expect(mockDeleteProject).toHaveBeenCalledWith('123');
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: "Project deleted successfully",
            });
        });

        it("calls next with error if deleteProject throws", async () => {
            const mockError = new Error("Database error");
            mockDeleteProject.mockRejectedValue(mockError);

            const { req, res, next } = makeMocks({ projectId: '123' });

            await removeProject(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });

        it("calls next with error if project not found", async () => {
            const mockError = new Error("Project not found");
            mockDeleteProject.mockRejectedValue(mockError);

            const { req, res, next } = makeMocks({ projectId: '123' });

            await removeProject(req, res, next);

            expect(next).toHaveBeenCalledWith(mockError);
        });
    });
});
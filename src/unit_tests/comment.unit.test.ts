import { Request, Response, NextFunction } from "express";
import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { CommentRow } from "../db/queries/commentQueries.js";

// ─── Mock the query module BEFORE importing the controller ───────────────────
jest.mock("../db/queries/commentQueries.js", () => ({
    getCommentsByProjectId: jest.fn(),
    getCommentById: jest.fn(),
    createComment: jest.fn(),
    countCommentsByProjectId: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
}));

// ─── Now import controller + mocked queries ──────────────────────────────────
import {
    listComments,
    addComment,
    getComment,
    removeComment,
    editComment,
    countComments,
} from "../modules/comment/commentController.js";

import {
    getCommentsByProjectId,
    getCommentById,
    createComment,
    countCommentsByProjectId,
    updateComment,
    deleteComment,
} from "../db/queries/commentQueries.js";

// ─── Typed mock references ────────────────────────────────────────────────────
const mockGetCommentsByProjectId = getCommentsByProjectId as jest.MockedFunction<typeof getCommentsByProjectId>;
const mockGetCommentById = getCommentById as jest.MockedFunction<typeof getCommentById>;
const mockCreateComment = createComment as jest.MockedFunction<typeof createComment>;
const mockCountComments = countCommentsByProjectId as jest.MockedFunction<typeof countCommentsByProjectId>;
const mockUpdateComment = updateComment as jest.MockedFunction<typeof updateComment>;
const mockDeleteComment = deleteComment as jest.MockedFunction<typeof deleteComment>;

// ─── Reusable mock factory ────────────────────────────────────────────────────
/**
 * Creates a minimal Express-like mock trio.
 *
 * @param params - merged into req.params
 * @param body   - merged into req.body
 * @param user   - merged into req.user (auth middleware output)
 */
function makeMocks(
    params: Record<string, string> = {},
    body: Record<string, unknown> = {},
    user: Record<string, unknown> = { userId: "user-123" }
) {
    const req = { params, body, user } as unknown as Request;
    const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    const next = jest.fn() as NextFunction;
    return { req, res, next };
}

beforeEach(async() => jest.clearAllMocks());


describe("listComments", () => {
    it("returns 200 with comments array on success", async () => {
        const fakeComments = [
            {
                id: "comment-123",
                project_id: "project-123",
                content: "Test comment",
                author_id: "user-123",
                created_at: new Date(),
                updated_at: new Date(),
            },
        ] as CommentRow[];

        mockGetCommentsByProjectId.mockResolvedValue(fakeComments);

        const { req, res, next } = makeMocks({ projectId: "project-1" });
        await listComments(req, res, next);

        expect(mockGetCommentsByProjectId).toHaveBeenCalledWith("project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: fakeComments,
        });
    });

    it("calls next(error) when the query throws", async () => {
        const dbError = new Error("DB failure");
        mockGetCommentsByProjectId.mockRejectedValue(dbError);

        const { req, res, next } = makeMocks({ projectId: "project-1" });
        await listComments(req, res, next);

        expect(next).toHaveBeenCalledWith(dbError);
    });
});


describe("addComment", () => {
    it("returns 201 with new comment id on success", async () => {
        mockCreateComment.mockResolvedValue("comment-123");

        const { req, res, next } = makeMocks({ projectId: "project-1" }, { comment: "Test comment" });
        await addComment(req, res, next);

        expect(mockCreateComment).toHaveBeenCalledWith("project-1", "Test comment", "user-123");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Comment added successfully",
            data: {
                newCommentId: "comment-123",
                content: "Test comment",
            },
        });
    });

    it("calls next(error) when createComment throws", async () => {
        mockCreateComment.mockRejectedValue(new Error("Insert failed"));

        const { req, res, next } = makeMocks({ projectId: "project-1" }, { comment: "Test comment" });
        await addComment(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});

describe("getComment", () => {
    it("returns 200 with comment data on success", async () => {
        const fakeComment = {
            id: "comment-123",
            project_id: "project-123",
            content: "Test comment",
            author_id: "user-123",
            created_at: new Date(),
            updated_at: new Date(),
        } as CommentRow;

        mockGetCommentById.mockResolvedValue(fakeComment);

        const { req, res, next } = makeMocks({ projectId: "project-1", commentId: "comment-123" });
        await getComment(req, res, next);

        expect(mockGetCommentById).toHaveBeenCalledWith("comment-123", "project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: fakeComment,
        });
    });

    it("returns 404 if comment not found", async () => {
        mockGetCommentById.mockResolvedValue(null);

        const { req, res, next } = makeMocks({ projectId: "project-1", commentId: "comment-123" });
        await getComment(req, res, next);

        expect(mockGetCommentById).toHaveBeenCalledWith("comment-123", "project-1");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Comment not found",
        });
    });

    it("calls next(error) when query fails", async () => {
        mockGetCommentById.mockRejectedValue(new Error("DB error"));

        const { req, res, next } = makeMocks({ projectId: "project-1", commentId: "comment-123" });
        await getComment(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});


describe("removeComment", () => {
    it("returns 200 on successful deletion", async () => {
        mockDeleteComment.mockResolvedValue(true);

        const { req, res, next } = makeMocks({ projectId: "project-1", commentId: "comment-123" });
        await removeComment(req, res, next);

        expect(mockDeleteComment).toHaveBeenCalledWith("comment-123", "project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Comment deleted successfully",
        });
    });

    it("returns 400 when commentId and projectId are both missing", async () => {
        const { req, res, next } = makeMocks({}, {});
        await removeComment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false });
        expect(mockDeleteComment).not.toHaveBeenCalled();
    });

    it("returns 400 when commentId is missing", async () => {
        const { req, res, next } = makeMocks({ projectId: "project-1" }, {});
        await removeComment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false });
        expect(mockDeleteComment).not.toHaveBeenCalled();
    });

    it("returns 400 when projectId is missing", async () => {
        const { req, res, next } = makeMocks({ commentId: "comment-123" }, {});
        await removeComment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({ success: false });
        expect(mockDeleteComment).not.toHaveBeenCalled();
    });

    it("calls next(error) when deleteComment throws", async () => {
        mockDeleteComment.mockRejectedValue(new Error("Delete failed"));

        const { req, res, next } = makeMocks({ commentId: "c1", projectId: "proj-1" });
        await removeComment(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});


describe("editComment", () => {
    it("returns 200 on successful update", async () => {
        mockUpdateComment.mockResolvedValue(true);

        const { req, res, next } = makeMocks(
            { projectId: "project-1", commentId: "comment-123" },
            { content: "Updated comment" }
        );
        await editComment(req, res, next);

        expect(mockUpdateComment).toHaveBeenCalledWith("comment-123", "project-1", "Updated comment");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Comment updated successfully",
        });
    });

    it("returns 404 when comment not found or nothing changed", async () => {
        mockUpdateComment.mockResolvedValue(false);

        const { req, res, next } = makeMocks(
            { projectId: "project-1", commentId: "comment-123" },
            { content: "Same text" }
        );
        await editComment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Comment not found or nothing changed",
        });
    });

    it("returns 400 when content is missing from body", async () => {
        const { req, res, next } = makeMocks(
            { projectId: "project-1", commentId: "comment-123" },
            {}
        );
        await editComment(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success: false,
            message: "Comment ID, Project ID and new content are required",
        });
        expect(mockUpdateComment).not.toHaveBeenCalled();
    });

    it("calls next(error) when updateComment throws", async () => {
        mockUpdateComment.mockRejectedValue(new Error("Update failed"));

        const { req, res, next } = makeMocks(
            { projectId: "project-1", commentId: "comment-123" },
            { content: "New text" }
        );
        await editComment(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});


describe("countComments", () => {
    it("returns 200 with comment count", async () => {
        mockCountComments.mockResolvedValue(7);

        const { req, res, next } = makeMocks({ projectId: "project-1" });
        await countComments(req, res, next);

        expect(mockCountComments).toHaveBeenCalledWith("project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: { commentCount: 7 },
        });
    });

    it("calls next(error) when query throws", async () => {
        mockCountComments.mockRejectedValue(new Error("Count failed"));

        const { req, res, next } = makeMocks({ projectId: "project-1" });
        await countComments(req, res, next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
});
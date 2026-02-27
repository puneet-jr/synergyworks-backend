import { Request, Response, NextFunction } from 'express';

jest.mock("../../db/queries/commentQueries.js", () => ({

    getCommentsByProjectId: jest.fn(),
    getCommentById: jest.fn(),
    createComment: jest.fn(),
    countCommentsByProjectId: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),

}));


import {
    listComments,
    addComment,
    getComment,
    removeComment,
    editComment,
    countComments,
} from "../../controllers/comment/commentController.js";

import {
    getCommentsByProjectId,
    getCommentById,
    createComment,
    countCommentsByProjectId,
    updateComment,
    deleteComment,
} from "../../db/queries/commentQueries.js";
import { get } from 'node:http';
import { mock } from 'node:test';
import { id } from 'zod/locales';


const mockGetCommentsByprojectId = getCommentsByProjectId as jest.MockedFunction<typeof getCommentsByProjectId>;
const mockGetCommentById = getCommentById as jest.MockedFunction<typeof getCommentById>;
const mockCreateComment = createComment as jest.MockedFunction<typeof createComment>;
const mockCountComments = countCommentsByProjectId as jest.MockedFunction<typeof countCommentsByProjectId>;
const mockUpdateComment = updateComment as jest.MockedFunction<typeof updateComment>;
const mockDeleteComment = deleteComment as jest.MockedFunction<typeof deleteComment>;

/**
 * Creates a minimal Express-like mock trio.
 *
 * @param params  - merged into req.params
 * @param body    - merged into req.body
 * @param user    - merged into req.user  (auth middleware output)
 */

function makeMocks(
    params: Record<string, string> = {},
    body: Record<string, any> = {},
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

beforeEach(() => jest.clearAllMocks());

describe("listComments", () => {
    it("returns 200 with comments array on success", async () => {
        const fakeComments = { id: "comment-123", project_id: "project-123", content: "Test comment", author_id: "user-123", created_at: new Date(), updated_at: new Date() };

        mockGetCommentsByprojectId.mockResolvedValue(fakeComments);

        const { req, res, next } = makeMocks({ projectId: "project-1" });
        await listComments(req, res, next);

        expect(mockGetCommentsByprojectId).toHaveBeenCalledWith("project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: fakeComments,
        });
    });
})


describe("addComment", () => {
    it("returns 201 with new comment Id on success", async () => {
        mockCreateComment.mockResolvedValue("comment-123");

        const { req, res, next } = makeMocks({ projectId: "project-1" }, { comment: "Test comment" });
        await addComment(req, res, next);

        expect(mockCreateComment).toHaveBeenCalledWith("project-1", "Test comment", "user-123");
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            message: "Successfully created a comemnt",
            data: {
                newCommentId: "new-comment-id", content: "Great project!"
            },
        });
    });

    it("returns 401 with error commentId on failure",async()=>{

        mockCreateComment.mockResolvedValue(new Error("Insert failed"));

        const  {req,res,next} = makeMocks({projectId:"project-1"},{comment:"Test comment"});
        await addComment(req,res,next);

        expect(res.status).toHaveBeenCalledWith(401);
    });
});


describe("getComment",()=>{

    it("returns 200 with comment data on success",async()=>{

        mockGetCommentById.mockResolveValue({ id: "comment-123", project_id: "project-123", content: "Test comment", author_id: "user-123", created_at: new Date(), updated_at: new Date() });

        const {req,res,next} = makeMocks({projectId:"project-1",commentId:"comment-123"});
        await getComment(req,res,next);

        expect(mockGetCommentById).toHaveBeenCalledWith("comment-123","project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success:true,
            data:{ id: "comment-123", project_id: "project-123", content: "Test comment", author_id: "user-123", created_at: new Date(), updated_at: new Date() },
        });
    });

    it("returns 404 if comment not found",async()=>{

        mockGetCommentById.mockResolvedValue(null);

        const {req,res,next} = makeMocks({projectId:"project-1",commentId:"comment-123"});
        await getComment(req,res,next);

        expect(mockGetCommentById).toHaveBeenCalledWith("comment-123","project-1");
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            success:false,
            message:"Comment not found",
        });
    });

    it("Calls next(error) when query fails",async()=>{

        mockGetCommentById.mockRejectedValue(new Error("DB error"));

        const {req,res,next} = makeMocks({projectId:"project-1",commentId:"comment-123"});
        await getComment(req,res,next);

        expect(next).toHaveBeenCalledWith(expect.any(Error));

    });
});

// Deletion Tests

describe("removeComment",()=>{
    it("returns 200 on successful deletion",async()=>{

        mockDeleteComment.mockResolvedValue(undefined);

        const {req,res,next} = makeMocks({projectId:"project-1",commentId:"comment-123"});
        await removeComment(req,res,next);
        expect(mockDeleteComment).toHaveBeenCalledWith("comment-123","project-1");
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success:true,
            message:"Comment deleted successfully",
        });
    });

    it("calls 400 if commentId and projectId is missing",async()=>{

        const {req,res,next} = makeMocks({},{}); 
        await removeComment(req,res,next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success:false,
        });
    });

    it("calls 400 if either commentId or projectId is missing",async()=>{

        const {req,res,next} = makeMocks({commentId:"comment-123"},{});
        await removeComment(req,res,next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success:false,
        });
    });

    it("calls 400 if either commentId or projectId is missing",async()=>{

        const {req,res,next} = makeMocks({projectId:"project-1"},{});
        await removeComment(req,res,next);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            success:false,
        });
    });


    it("calls next(error) when deleteComment throws", async () => {
    mockDeleteComment.mockRejectedValue(new Error("Delete failed"));

    const { req, res, next } = makeMocks({ commentId: "c1", projectId: "proj-1" });
    await removeComment(req, res, next);
    
    expect(next).toHaveBeenCalled();
    
  });
});








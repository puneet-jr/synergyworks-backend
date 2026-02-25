import {Request, Response, NextFunction } from "express";
import asyncHandler from "../../shared/middlewares/asyncHandler.js";
import { getDBPool } from "../../config/db.js";

import {
    getCommentById,
    getCommentsByProjectId,
    createComment,
    countCommentsByProjectId,
    updateComment,deleteComment,
 } from "../../db/queries/commentQueries.js";

export async function listComments(req: Request, res: Response, next: NextFunction) {
    try {
        const projectId = req.params.projectId as string;
        const comments = await getCommentsByProjectId(projectId);
        res.status(200).json({
            success: true,
            data: comments,
        });
    } catch (error) {
        next(error);
    }
};

export const addComment =asyncHandler(async(req:Request,res:Response)=>{

    const projectId = req.params.projectId as string;
     const {comment} =req.body;
    const authorId = req.user!.userId;
     const newCommentId = await createComment(projectId, comment, authorId);
        res.status(201).json({
            success: true,
            message: "Comment added successfully",
            data: {
                newCommentId,
                content: comment,
            },
        });
})

export const getComment = asyncHandler(async(req: Request, res: Response) => {
    const commentId = req.params.commentId as string;
    const projectId = req.params.projectId as string;
    const comment = await getCommentById(commentId, projectId);

    if (!comment) {
        res.status(404).json({        
            success: false,
            message: "Comment not found",
        });
        return;                       
    }

    res.status(200).json({
        success: true,
        data: comment,
    });
});

export const removeComment= asyncHandler(async(req:Request,res:Response)=>{

    const commentId= req.params.commentId as string;
    const projectId= req.params.projectId as string;

    if(!commentId || !projectId){
        res.status(400).json({
            success:false,
        })
        return;
    }

    await deleteComment(commentId,projectId);

    res.status(200).json({
        success:true,
        message:"Comment deleted successfully"
    })

});

export const editComment = asyncHandler(async(req:Request,res:Response)=>{

    const commentId= req.params.commentId as string;
    const projectId= req.params.projectId as string;
    const {content}= req.body;
    if(!commentId || !projectId || !content){
        res.status(400).json({
            success:false,            message:"Comment ID, Project ID and new content are required"
        })
        return;
    }
    const updated = await updateComment(commentId, projectId, content);
    if (!updated) {
        res.status(404).json({
            success: false,
            message: "Comment not found or nothing changed",
        });
        return;
    }
    res.status(200).json({
        success: true,
        message: "Comment updated successfully",
    })
});

export const countComments = asyncHandler(async(req:Request, res:Response)=>{

    const projectId = req.params.projectId as string;

    if(!projectId)
    {
        res.status(400).json({
            success:false,
            message:"Project Id is required"
        })
    }

    const count = await countCommentsByProjectId(projectId);

    res.status(200).json({
        success:true,
        data:{
            commentCount:count
        }
    });
});


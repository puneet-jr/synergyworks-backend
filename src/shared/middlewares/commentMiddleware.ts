import { Request, Response, NextFunction } from "express";
import { getCommentById } from "../../db/queries/commentQueries.js";
import { NotFoundError, AuthError } from "../errors/App.Error.js";

declare global {
    namespace Express {
        interface Request {
            comment?: {
                id: string;
                projectId: string;
                authorId: string;
                content: string;
            };
        }
    }
}


export async function requireCommentInProject(req: Request, res: Response, next: NextFunction) {

    try {
        const project = req.project;
        const commentId = req.params.commentId as string;

        if (!project) {
            return next(new AuthError("Project not found"));
        }

        if (!commentId) {
            return next(new NotFoundError("Comment ID is required"));
        }

        const comment = await getCommentById(commentId, project.id);

        if(!comment)
        {
            return next(new NotFoundError("Comment not found"));
        }

        req.comment={
            id:comment.id,
            projectId: comment.project_id,
            authorId: comment.author_id,
            content: comment.content,
        };
        next();
    } catch (error) {
        next(error);
    }
}

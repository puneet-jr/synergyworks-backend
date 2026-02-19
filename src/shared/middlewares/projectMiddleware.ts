import {Request, Response, NextFunction} from 'express';
import { findMember } from "../../db/queries/workspaceQueries.js";
import { PermissionError, AuthError } from "../errors/App.Error.js";


declare global{
    namespace Express{
        interface Request{
            projectId?: string;
            title?: string;
            description?: string;
            workspaceId?: string;
        }
    }
}

export const requireProjectAccess= async (req: Request, res: Response, next: NextFunction) => {

    const userId= req.user?.userId;
    const workspaceId= req.params.id as string;

    if(!userId){
        return next(new AuthError("User not authenticated"));
    }

};


export const requireProjectAdmin= async (req: Request, res: Response, next: NextFunction) => {

    const userId= req.user?.userId;
    const workspaceId= req.params.id as string;

    if(!userId){
        return next(new AuthError("User not authenticated"));
    }
};




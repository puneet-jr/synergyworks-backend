import { Request,Response, NextFunction } from "express";
import {findMember} from "../../db/queries/workspaceQueries.js";
import { PermissionError, AuthError } from "../errors/App.Error.js";

declare global {
    namespace Express {
        interface Request {
            user?:{
                userId: string;
                email: string;
            };
            workspaceMember?: {
                workspaceId: string;
                userId: string;
                role: "owner" | "admin" | "member";
            };
        }
    }
}

export function requireWorkspaceMember(req: Request, res: Response, next: NextFunction) {


    const userId= req.user?.userId;

    const workspaceId= req.params.id as string;

    if(!userId){
        return next(new AuthError("User not authenticated"));
    }

    findMember(workspaceId, userId).then((member)=>{
        if(!member){
            return next(new PermissionError("User is not a member of this workspace"));
        }

        req.workspaceMember={
            workspaceId,
            userId,
            role: member.role
         };   
         next();
        
    })
    .catch(next);
}

export function requireWorkspaceAdmin(
    req: Request, res: Response, next: NextFunction
){

    const member= req.workspaceMember;

    if(!member)
    {
        return next(new AuthError("User not authenticated"));
    }

    if(member.role !== "admin" && member.role !== "owner"){
        return next(new PermissionError("User does not have admin permissions in this workspace"));
    }

    next();

}

export function requireWorkspaceOwner(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const member = req.workspaceMember;

    if (!member) {
        return next(new AuthError("Authentication required"));
    }

    if (member.role !== "owner") {
        return next(new PermissionError("Only the workspace owner can perform this action"));
    }

    next();
}







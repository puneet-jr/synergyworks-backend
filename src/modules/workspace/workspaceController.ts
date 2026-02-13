import { Request,Response,NextFunction } from "express";
import asyncHandler  from "../../shared/middlewares/asyncHandler.js";

import {
    ValidationError,
    NotFoundError,
    PermissionError,
    ConflictError
} from "../../shared/errors/App.Error.js";


import {
    createWorkspace,
    findWorkspaceById,
    updateWorkspace,
    deleteWorkspace,
    addMember,
    removeMember,
    findMember,
    findWorkspacesByUserId,
    findMembersByWorkspaceId
} from "../../db/queries/workspaceQueries.js";

import {findUserByEmail} from "../../db/queries/authQueries.js";
import {createWorkspaceSchema,inviteMemberSchema,
    updateWorkspaceSchema } from "../../validators/validators.js";

export const create= asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{

    const userId= req.user?.userId;

    const {name,description}=createWorkspaceSchema.parse(req.body);

    const workspaceId= await createWorkspace(userId as string, name, description || null);

    res.status(201).json({
        success:true,
        message:"Workspace created successfully",
        data:{
            workspaceId,
            name: name.trim(),
            description: description?.trim() || null,
        },
    });
});



export const list =asyncHandler(async(req:Request, res:Response, next:NextFunction)=>{
    const userId=req.user?.userId;
    const workspaces= await findWorkspacesByUserId(userId as string);

    res.status(200).json({
        success:true,
        data:{workspaces},
    });

});

export const getById= asyncHandler(async(req:Request, res:Response, next:NextFunction)=>{

    const workspaceId=req.params.id;

    const workspace= await findWorkspaceById(workspaceId as string);

    if(!workspace){
        throw new NotFoundError("Workspace not found");
    }

    const members= await findMembersByWorkspaceId(workspaceId as string);

    res.status(200).json({
        success:true,
        data:{
            workspace,
            members,
        },
    });

});


export const update= asyncHandler(async(req:Request, res:Response, next:NextFunction)=>{

    const workspaceId=req.params.id;

    const {name,description}=updateWorkspaceSchema.parse(req.body);

    await updateWorkspace(workspaceId as string, name, description || null);

    res.status(200).json({
        success:true,
        message:"Workspace updated successfully",
    });

});



export const remove =  asyncHandler(async(req:Request, res:Response, next:NextFunction)=>{

    const workspaceId=req.params.id;

    await deleteWorkspace(workspaceId as string);

    res.status(200).json({
        success:true,
        message:"Workspace deleted successfully",
    }); 
});


export const inviteMember = asyncHandler(async(req:Request, res:Response, next:NextFunction)=>{

        const workspaceId= req.params.id;

        const {email, role}=inviteMemberSchema.parse(req.body);
        
        const memberRole= role === "admin" ? "admin" : "member";

        const user= await findUserByEmail(email);

        if(!user){
            throw new NotFoundError("User not found");
        }

        const existingMember= await findMember(workspaceId as string, user.id);

        if(existingMember){
            throw new ConflictError("User is already a member of this workspace");
        }

        await addMember(workspaceId as string, user.id, memberRole);

        res.status(201).json({
            success:true,
            message:"Member added successfully",
            data:{
                userId: user.id,
                name: user.name,    
                email: user.email,
                role: memberRole,
            }
        });

});

export const kickMember = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params.id;
    const targetUserId = req.params.userId;
    
    const targetMember = await findMember(workspaceId as string, targetUserId as string);
    if (!targetMember) {
        throw new NotFoundError("User is not a member of this workspace");
    }

    if (targetMember.role === "owner") {
        throw new PermissionError("Cannot remove the workspace owner");
    }

    await removeMember(workspaceId as string, targetUserId as string);

    res.status(200).json({
        success: true,
        message: "Member removed successfully",
    });
});


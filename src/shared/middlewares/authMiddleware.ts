import {Request, Response, NextFunction } from "express";
import { verifyAccessToken }  from "../utils/tokenUtils.js";
import {AuthError} from "../errors/App.Error.js";

declare global{

    namespace Express{
        interface Request{
            user?:{
                userId: string;
                email:string;
            }
        }
    }
}

export function authenticate(req:Request,res:Response,next:NextFunction){

    const authHeader=req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        return next(new AuthError("No token provided"));
    }

    const token=authHeader.split(" ")[1];

    try{
        const payload=verifyAccessToken(token);
        req.user={
            userId: payload.userId,
            email: payload.email,
        };
        next();
    }catch(err){
        return next(new AuthError("Invalid or expired token"));
        }
}






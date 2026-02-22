import { Request, Response, NextFunction } from 'express';
import {ZodError} from 'zod';
import {AppError} from '../errors/App.Error.js';
import {env} from '../../config/env.js';

export function errorHandler(
    err: unknown,
    req:Request,
    res:Response,
    next:NextFunction
) {

    
    if(err instanceof ZodError)
    {

        return res.status(400).json({
            success:false,
            message:"Validation Error",

            errors:err.issues.map((issue)=>({
                path:issue.path.join('.'),
                message:issue.message,
            })),
        });
    }
    

       if(err instanceof AppError)
    {
        return res.status(err.statusCode).json({

            success:false,
            message:err.message,
        });
    }

    if (env.NODE_ENV === 'development' && err instanceof Error) {
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
}


    if(err && typeof err === 'object' && 'code' in err && err.code === 'ER_DUP_ENTRY')
{
    return res.status(409).json({
        success:false,
        message:'Duplicate entry detected',
    })
}


    console.error("Unexpected Error:",err);

    return res.status(500).json({
        success:false,
        message:'Internal Server Error',
        error:env.NODE_ENV === 'development' && err instanceof Error ? err.message : undefined,
    })

}
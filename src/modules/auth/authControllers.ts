import asyncHandler from "../../shared/middlewares/asyncHandler.js";
import {AppError,AuthError,ValidationError} from "../../shared/errors/App.Error.js";
import bcrypt from "bcrypt";
import {generateAccessToken,generateRefreshToken,storeRefreshToken,
    getStoredRefreshToken,deleteRefreshToken,verifyAccessToken, 
    decodeAccessToken} from "../../shared/utils/tokenUtils.js";
import {findUserByEmail,createUser} from "../../db/queries/authQueries.js";
import { env } from "../../config/env.js";
import {Request, Response, NextFunction} from "express";
import { registerSchema, loginSchema} from "../../validators/validators.js";

const COOKIE_OPTIONS={
    httpOnly:true,
    secure:env.NODE_ENV==="production",
    sameSite:"strict" as const,
    maxAge: 7*24*60*60*1000,   
}


export const register =asyncHandler(async(
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    const {name,email,password}= registerSchema.parse(req.body);


    const existingUser=await findUserByEmail(email);

    if(existingUser){
        throw new AppError("User with this email already exists",400);
    }

    const password_hash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    const userId= await createUser(name,email,password_hash);

    const accessToken= generateAccessToken({userId,email});

    const refreshToken=generateRefreshToken();

    await storeRefreshToken(userId,refreshToken);

    res.cookie("refreshToken", refreshToken,COOKIE_OPTIONS);

    res.status(201).json({
        success:true,
        message:"Registration successful",
        data:{
            accessToken,
            user:{
                userId,name,email
            }
        },
    });

});



export const login=asyncHandler(async(
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    const {email,password}= loginSchema.parse(req.body);

    const user= await findUserByEmail(email);

    if(!user){
        throw new AuthError("Invalid email or password");
    }

    const isPasswordValid= await bcrypt.compare(password,user.password_hash);

    if(!isPasswordValid){
        throw new AuthError("Invalid email or password");
    }

    const accessToken= generateAccessToken({userId:user.id,email:user.email});

    const refreshToken= generateRefreshToken();

    await storeRefreshToken(user.id,refreshToken);

    res.cookie("refreshToken",refreshToken,COOKIE_OPTIONS);

    res.status(200).json({
        success:true,
        message:"Login successful",
        data:{
            accessToken,
            user:{id:user.id,name:user.name,email:user.email},
        },
    });

});

export const refreshToken=asyncHandler(async(
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    const refreshToken = req.cookies.refreshToken;

    if(!refreshToken){
        throw new AuthError("No refresh Token");
    }

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        throw new AuthError("No access token provided");
    }

    let payload;

    try{
        payload= decodeAccessToken(authHeader.split(" ")[1]);
    }catch(err){
        throw new AuthError("Invalid access token");
    }

    const storedRefreshToken= await getStoredRefreshToken(payload.userId);

    if(!storedRefreshToken || storedRefreshToken !== refreshToken){
        throw new AuthError("Invalid refresh token");
    }
    
    const newAccessToken= generateAccessToken({userId:payload.userId,email:payload.email});
    const newRefreshToken= generateRefreshToken();

    await storeRefreshToken(payload.userId,newRefreshToken);    

    res.cookie("refreshToken",newRefreshToken,COOKIE_OPTIONS);

    res.status(200).json({
        success:true,
        message:"Token refreshed successfully",
        data:{
            accessToken:newAccessToken,
        },
    });

});

export const logout=asyncHandler(async(
    req: Request,
    res: Response,
    next: NextFunction
)=>{

    const authHeader=req.headers.authorization;

    if(!authHeader || !authHeader.startsWith("Bearer ")){
        throw new AuthError("No access token provided");
    }

    let payload;

    try{
        payload= verifyAccessToken(authHeader.split(" ")[1]);
        await deleteRefreshToken(payload.userId);
    }catch(err){
        throw new AuthError("Invalid access token");
    }

    res.clearCookie("refreshToken",COOKIE_OPTIONS);
    res.status(200).json({
        success:true,
        message:"Logout successful",
    });

});


import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env.js";
import { getRedisClient } from "../../config/client.js";
import type {StringValue} from "ms";

export interface AccessTokenPayload {
    userId: string;
    email: string;
}

// ─── ACCESS TOKEN ────────────────────────

export function generateAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, env.ACCESS_TOKEN_SECRET,{
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as StringValue,
    });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.ACCESS_TOKEN_SECRET) as AccessTokenPayload;
}

// ─── REFRESH TOKEN ───────────────────────

export function generateRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
}

// STORE refresh token in Redis with TTL
export async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const redis = getRedisClient();
    const ttl = parseExpiry(env.REFRESH_TOKEN_EXPIRES_IN);
    await redis.set(`refresh_token:${userId}`, refreshToken, { EX: ttl });
}

// Decode Access Token even if it's expired (for token refresh flow)
export function decodeAccessToken(token: string): AccessTokenPayload {

    return jwt.verify(token,env.ACCESS_TOKEN_SECRET,{
        ignoreExpiration:true,
    }) as AccessTokenPayload;

};


// GET stored refresh token from Redis
export async function getStoredRefreshToken(userId: string): Promise<string | null> {
    const redis = getRedisClient();
    return await redis.get(`refresh_token:${userId}`);
}

// DELETE refresh token from Redis (logout)
export async function deleteRefreshToken(userId: string): Promise<void> {
    const redis = getRedisClient();
    await redis.del(`refresh_token:${userId}`);
}

// ─── HELPER ──────────────────────────────

function parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);

    if (!match) {
        return 604800; 
    }

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
        case "d": return value * 86400;
        case "h": return value * 3600;
        case "m": return value * 60;
        case "s": return value;
        default: return 604800;
    }
}
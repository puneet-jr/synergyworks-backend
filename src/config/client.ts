import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;

export async function initializeRedisClient(): Promise<RedisClientType> {
    if (!client) {
        client = createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            socket: {
                reconnectStrategy: retries => Math.min(retries * 50, 2000),
                connectTimeout: 10000, // 10 seconds
                keepAlive: true,
            }
        });

        client.on('error', (error: Error) => {
            console.error('Redis Client Error', error);
        });

        client.on('connect', () => {
            console.log('Redis client connected');
        });

        client.on('disconnect', () => {
            console.log('Redis client disconnected');
        });

        try {
            await client.connect();
        } catch (error) {
            console.error('failed to connect to redis', error);
            throw new Error("Redis connection failed");
        }
    }
    return client;
}

export async function disconnectRedisClient(): Promise<void> {
    if (client) {
        try {
            await client.quit();
            console.log("Redis client disconnected successfully");
        } catch (err) {
            console.error("Error disconnecting Redis client", err);
        }
        client = null;
    }
}

export function getRedisClient(): RedisClientType {
    if (!client) {
        throw new Error("Redis client not initialized. Call initializeRedisClient() first.");
    }
    return client;
}
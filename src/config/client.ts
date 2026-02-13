import {createClient,type RedisClientType} from "redis";


let client: RedisClientType | null=null;

export async function initializeRedisClient(): Promise<RedisClientType>{

    if(!client)
    {
        client=createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
        });

        client.on('error',(error:Error)=>{
            console.error('Redis Client Error',error);
        });

        client.on('connect',()=>{
            console.log('Redis client connected');
        });

        client.on('disconnect',()=>{
            console.log('Redis client disconnected');
        });

        try{
            await client.connect();
        }
        catch(error)
        {
            console.error('failed to connect to redis',error);
            throw new Error("Redis connection failed");
        }

    }
    return client;
}

export async function disconnectRedisClient(): Promise<void>{
    if(client){
        await client.quit();
        client=null;
        console.log("Redis client disconnected successfully");
    }
}

export function getRedisClient(): RedisClientType{
    if(!client)
    {
        throw new Error("Redis client not initialized. Call initializeRedisClient() first.");

    }
    return client;
}
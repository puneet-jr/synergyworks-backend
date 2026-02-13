import { getDBPool } from "../../config/db.js";
import {RowDataPacket,ResultSetHeader} from "mysql2";

export interface UserRow extends RowDataPacket{

    id: string;
    name:string;
    email:string;
    password_hash:string;
    created_at: Date;
    updated_at: Date;
}


export async function findUserByEmail(email:string): Promise<UserRow | null>{

    const pool=getDBPool();

    const [rows]=await pool.execute<UserRow[]>(
        "SELECT id, name, email, password_hash FROM users WHERE email = ?",
    [email]
    );
    return rows.length>0 ? rows[0]:null;
}


export async function findUserById(id:string):Promise<UserRow | null>{

    const pool=getDBPool();

    const [rows]= await pool.execute<UserRow[]>(
        "SELECT id, name, email, password_hash FROM users WHERE id = ?",[id]
    );
    return rows.length>0 ? rows[0]:null;
}


export async function createUser(
    name:string,
    email:string,
    password_hash:string
):Promise<string>{
    const pool=getDBPool();

    await pool.execute<ResultSetHeader>(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, password_hash]
    );


    const user = await findUserByEmail(email);
    if(!user){
        throw new Error("User creation failed");
    }
    return user.id;
}






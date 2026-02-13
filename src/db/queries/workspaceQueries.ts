import { getDBPool}  from "../../config/db.js";

import {RowDataPacket,ResultSetHeader} from "mysql2";

export interface WorkspaceRow extends RowDataPacket{

    id: string;
    name:string;
    description:string | null;
    owner_id:string;
    created_at: Date;
    updated_at: Date;
}

export interface WorkspaceMemberRow extends RowDataPacket{
    id: string;
    workspace_id: string;
    user_id: string;
    roles:"owner" | "admin" | "member";
    joined_at:Date;
    name?:string;
    email?:string;
}


export async function createWorkspace(
    ownerId: string,
    name: string,
    description: string | null,
   
): Promise<string> {
    const pool = getDBPool();  
    const connection = await pool.getConnection();

    try{
        await connection.beginTransaction();

        const [result]=await connection.execute<ResultSetHeader>(
            "INSERT INTO workspaces (name,description ,owner_id) values (?, ?, ?)",
            [name, description, ownerId]
        );

        const [rows] = await connection.execute<WorkspaceRow[]>(
            "SELECT id FROM workspaces WHERE id = ?",
            [result.insertId]
        );

        if(rows.length === 0){
            throw new Error("Workspace creation failed");
        }

        const workspaceId = rows[0].id;


        await connection.execute<ResultSetHeader>(
            "INSERT INTO workspace_members (workspace_id, user_id, roles) VALUES (?, ?, ?)",
            [workspaceId, ownerId, "owner"]
        );

        await connection.commit();

        return workspaceId;
    } catch(error)
    {
        await connection.rollback();
        throw error;
    } finally{
        connection.release();
    }
}

export async function findWorkspaceById(id:string):Promise<WorkspaceRow | null>{

    const pool = getDBPool();

    const [rows] = await pool.execute<WorkspaceRow[]>(
        "SELECT * FROM workspaces WHERE id = ?", [id]
    );
    return rows.length > 0 ? rows[0] : null;

}

export async function findWorkspacesByUserId(userId:string): Promise<WorkspaceRow[]>{
    const pool = getDBPool();

    const [rows] = await pool.execute<WorkspaceRow[]>(
        ` SELECT w.* from workspaces w
        INNER JOIN workspace_members wm on w.id = wm.workspace_id
        where wm.user_id = ?

        order by w.created_at DESC`, [userId]
    );
    return rows;
}

export async function updateWorkspace(
  id: string,
  name: string,
  description: string | null
): Promise<void> {
  const pool = getDBPool();

  const query = `
    UPDATE workspaces
    SET name = ?, description = ?
    WHERE id = ?
  `;

  await pool.execute(query, [name, description, id]);
}


export async function deleteWorkspace(workspaceId:string):Promise<void> {

    const pool= getDBPool();

    await pool.execute<ResultSetHeader>(
        "DELETE FROM workspaces WHERE id = ?", [workspaceId]
    );  

}


export async function addMember(
    workspaceId: string,
    userId: string,
    roles: "admin" | "member" = "member"
): Promise<void> {
    const pool = getDBPool();
    await pool.execute<ResultSetHeader>(
        "INSERT INTO workspace_members (workspace_id, user_id, roles) VALUES (?, ?, ?)",
        [workspaceId, userId, roles]
    );
}

export async function removeMember(workspaceId:string,userId:string):Promise<void>{
    const pool = getDBPool();
    await pool.execute<ResultSetHeader>(
        "DELETE FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
        [workspaceId, userId]
     );
}

export async function findMember(
  workspaceId: string,
  userId: string
): Promise<WorkspaceMemberRow | null> {
  const pool = getDBPool();

  const [rows] = await pool.execute<WorkspaceMemberRow[]>(
    "SELECT * FROM workspace_members WHERE workspace_id = ? AND user_id = ?",
    [workspaceId, userId]   // now matches: 2 ? and 2 values
  );

  return rows.length > 0 ? rows[0] : null;
}

export async function findMembersByWorkspaceId(workspaceId:string):Promise<WorkspaceMemberRow[]>{
    const pool = getDBPool();

    const [rows] = await pool.execute<WorkspaceMemberRow[]>(
        `SELECT wm.*, u.name, u.email FROM workspace_members wm
        INNER JOIN users u ON wm.user_id = u.id
        WHERE wm.workspace_id = ?`, [workspaceId]
    );
    return rows;
}




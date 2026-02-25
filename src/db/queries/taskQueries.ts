import { getDBPool } from "../../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface TaskSummaryRow extends RowDataPacket {
    workspaceId: string;
    workspaceName?: string;
    todoCount: number;
    inProgressCount: number;
    doneCount: number;
    totalCount: number;
    completionPercentage: number;
}

export interface TaskRow extends RowDataPacket {
    id: string;
    title: string;
    description: string | null;
    status: "todo" | "in_progress" | "done";
    workspace_id: string;
    assigned_to: string | null;
    created_at: Date;
    updated_at: Date;
}

export async function findTaskSummaryByWorkspaceId(workspaceId: string): Promise<TaskSummaryRow | null> {
    const pool = getDBPool();
    const [rows] = await pool.execute<TaskSummaryRow[]>(
        `SELECT
            w.id AS workspaceId,
            w.name AS workspaceName,
            SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todoCount,
            SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS inProgressCount,
            SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS doneCount,
            COUNT(t.id) AS totalCount,
            CASE
                WHEN COUNT(t.id) = 0 THEN 0
                ELSE ROUND(SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) / COUNT(t.id) * 100, 2)
            END AS completionPercentage
        FROM workspaces w
        LEFT JOIN tasks t ON w.id = t.workspace_id
        WHERE w.id = ?
        GROUP BY w.id, w.name`,
        [workspaceId]
    );
    return rows.length > 0 ? rows[0] : null;
}

export async function countTasksByWorkspaceId(
    workspaceId: string,
    search?: string
): Promise<number> {
    const pool = getDBPool();
    let sql = `
        SELECT COUNT(*) AS totalCount 
        FROM tasks 
        WHERE workspace_id = ?
    `;
    const params: any[] = [workspaceId];

    if (search) {
        sql += " AND title LIKE ?";
        params.push(`%${search}%`);
    }

    const [rows] = await pool.execute<RowDataPacket[]>(sql, params);
    const total = rows[0]?.totalCount;
    return typeof total === "number" ? total : Number(total) || 0;
}

export async function findTasksByWorkspaceIdPaginated(
    workspaceId: string,
    limit: number,
    offset: number,
    search?: string
): Promise<TaskRow[]> {
    const pool = getDBPool();
    let sql = `
        SELECT t.* FROM tasks t
        WHERE t.workspace_id = ?
    `;
    const params: any[] = [workspaceId];

    if (search) {
        sql += " AND t.title LIKE ?";
        params.push(`%${search}%`);
    }

    sql += " ORDER BY t.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const [rows] = await pool.execute<TaskRow[]>(sql, params);
    return rows;
}


export async function canUserAccessTask(
    userId: string, 
    taskId: string
): Promise<boolean> {
    const pool = getDBPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT 1 
         FROM tasks t
         INNER JOIN workspace_members wm 
             ON t.workspace_id = wm.workspace_id
         WHERE t.id = ? AND wm.user_id = ?`,
        [taskId, userId]
    );
    return rows.length > 0;
}


export async function findTasksById(workspaceId: string, taskId: string): Promise<TaskRow | null> {
    const pool = getDBPool();
    const [rows] = await pool.execute<TaskRow[]>(
        "SELECT * FROM tasks WHERE workspace_id = ? AND id = ?",
        [workspaceId, taskId]
    );
    return rows.length > 0 ? rows[0] : null;
}

export async function createTask(
    taskId: string,
    title: string,
    description: string | null,
    status: "todo" | "in_progress" | "done",
    workspaceId: string,
    assignedTo: string | null
): Promise<string> {
    const pool = getDBPool();

    const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO tasks (id, title, description, status, workspace_id, assigned_to) VALUES (?, ?, ?, ?, ?, ?)",
        [taskId, title, description, status, workspaceId, assignedTo]
    );
    
    if (result.affectedRows === 0) {
        throw new Error("Failed to create task");
    }
    
    return taskId;
}

export async function updateTask(
    taskId: string,
    title: string,
    description: string | null,
    status: "todo" | "in_progress" | "done",
    assignedTo: string | null
): Promise<string> {
    const pool = getDBPool();

    const [result] = await pool.execute<ResultSetHeader>(
        `UPDATE tasks SET title = ?, description = ?, status = ?, assigned_to = ? WHERE id = ?`,
        [title, description, status, assignedTo, taskId]
    );

    if (result.affectedRows === 0) {
        throw new Error("Task not found");
    }
    
    return taskId;
}

export async function deleteTask(taskId: string): Promise<void> {
    const pool = getDBPool();
    const [result] = await pool.execute<ResultSetHeader>(
        "DELETE FROM tasks WHERE id = ?",
        [taskId]
    );
    
    if (result.affectedRows === 0) {
        throw new Error("Task not found");
    }
}

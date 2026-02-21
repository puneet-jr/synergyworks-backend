import { getDBPool } from "../../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface CommentRow extends RowDataPacket {
    id: string;
    project_id: string;
    content: string;
    author_id: string;
    created_at: Date;
    updated_at: Date;
}

// Create a comment and return its ID
export async function createComment(
    projectId: string,
    content: string,
    authorId: string
): Promise<string> {
    const pool = getDBPool();
    const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO comments (project_id, content, author_id) VALUES (?, ?, ?)",
        [projectId, content, authorId]
    );
    return result.insertId?.toString() ?? "";
}

// Get all comments for a project, newest first
export async function getCommentsByProjectId(
    projectId: string
): Promise<CommentRow[]> {
    const pool = getDBPool();
    const [rows] = await pool.execute<CommentRow[]>(
        "SELECT id, project_id, content, author_id, created_at, updated_at FROM comments WHERE project_id = ? ORDER BY created_at DESC",
        [projectId]
    );
    return rows;
}

// Get a single comment by ID and project (for access checks)
export async function getCommentById(
    commentId: string,
    projectId: string
): Promise<CommentRow | null> {
    const pool = getDBPool();
    const [rows] = await pool.execute<CommentRow[]>(
        "SELECT id, project_id, content, author_id, created_at, updated_at FROM comments WHERE id = ? AND project_id = ?",
        [commentId, projectId]
    );
    return rows.length > 0 ? rows[0] : null;
}

// Count comments for a project
export async function countCommentsByProjectId(
    projectId: string
): Promise<number> {
    const pool = getDBPool();
    const [rows] = await pool.execute<RowDataPacket[]>(
        "SELECT COUNT(*) AS commentCount FROM comments WHERE project_id = ?",
        [projectId]
    );
    // rows[0].commentCount will be a number
    return rows.length > 0 ? Number((rows[0] as any).commentCount) : 0;
}

export async function updateComment(
    commentId: string,
    projectId: string,
    content: string
): Promise<boolean> {
    const pool = getDBPool();
    const [result] = await pool.execute<ResultSetHeader>(
        "UPDATE comments SET content = ? WHERE id = ? AND project_id = ?",
        [content, commentId, projectId]
    );
    return result.affectedRows > 0;
}

// Optional: Delete a comment (restrict by project)
export async function deleteComment(
    commentId: string,
    projectId: string
): Promise<boolean> {
    const pool = getDBPool();
    const [result] = await pool.execute<ResultSetHeader>(
        "DELETE FROM comments WHERE id = ? AND project_id = ?",
        [commentId, projectId]
    );
    return result.affectedRows > 0;
}
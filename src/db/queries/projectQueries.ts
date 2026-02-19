import { getDBPool } from "../../config/db.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface ProjectRow extends RowDataPacket {
    id: string;
    title: string;
    description: string;
    workspace_id: string;
    created_at: Date;
    updated_at: Date;
}

interface WorkspaceIdRow extends RowDataPacket {
    workspace_id: string;
}

export async function getProjectsSummary(): Promise<WorkspaceIdRow[]> {
    const pool = getDBPool();
    const [rows] = await pool.execute<WorkspaceIdRow[]>(
        "SELECT DISTINCT workspace_id FROM projects"
    );
    return rows;
}

// Create a new project
export async function createProject(
    title: string,
    description: string,
    workspaceId: string
): Promise<string> {
    const pool = getDBPool();
    const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO projects (title, description, workspace_id) VALUES (?, ?, ?)",
        [title, description, workspaceId]
    );
    if (!result.insertId) {
        throw new Error("Project creation failed");
    }
    return result.insertId.toString();
}

// Get all projects for a workspace
export async function getProjectsByWorkspaceId(workspaceId: string): Promise<ProjectRow[]> {
    const pool = getDBPool();
    const [rows] = await pool.execute<ProjectRow[]>(
        "SELECT id, title, description, workspace_id, created_at, updated_at FROM projects WHERE workspace_id = ?",
        [workspaceId]
    );
    return rows;
}

// Get a single project by workspace and project ID
export async function getProjectById(workspaceId: string, projectId: string): Promise<ProjectRow | null> {
    const pool = getDBPool();
    const [rows] = await pool.execute<ProjectRow[]>(
        "SELECT id, title, description, workspace_id, created_at, updated_at FROM projects WHERE workspace_id = ? AND id = ?",
        [workspaceId, projectId]
    );
    return rows.length > 0 ? rows[0] : null;
}

// Update a project
export async function updateProject(
    projectId: string,
    title: string,
    description: string
): Promise<boolean> {
    const pool = getDBPool();
    const [result]: any = await pool.execute<ResultSetHeader>(
        "UPDATE projects SET title = ?, description = ? WHERE id = ?",
        [title, description, projectId]
    );
    return result.affectedRows > 0;
}

// Delete a project
export async function deleteProject(projectId: string): Promise<void> {
    const pool = getDBPool();
    await pool.execute(
        "DELETE FROM projects WHERE id = ?",
        [projectId]
    );
}
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

// Create a new project - FIXED VERSION
export async function createProject(
    title: string,
    description: string,
    workspaceId: string
): Promise<string> {
    const pool = getDBPool();
    
    // Generate UUID in code or let MySQL do it - here we let MySQL handle it
    const [result] = await pool.execute<ResultSetHeader>(
        "INSERT INTO projects (id, title, description, workspace_id) VALUES (UUID(), ?, ?, ?)",
        [title, description, workspaceId]
    );
    
    // Since insertId is 0 for UUID, fetch the last inserted row
    const [rows] = await pool.execute<ProjectRow[]>(
        "SELECT id FROM projects WHERE workspace_id = ? AND title = ? ORDER BY created_at DESC LIMIT 1",
        [workspaceId, title]
    );
    
    if (!rows.length) {
        throw new Error("Project creation failed");
    }
    
    return rows[0].id;
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
    const [result] = await pool.execute<ResultSetHeader>(
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

// Find a project by ID alone (needed for middleware)
export async function findProjectById(projectId: string): Promise<ProjectRow | null> {
    const pool = getDBPool();
    const [rows] = await pool.execute<ProjectRow[]>(
        "SELECT id, title, description, workspace_id, created_at, updated_at FROM projects WHERE id = ?",
        [projectId]
    );
    return rows.length > 0 ? rows[0] : null;
}
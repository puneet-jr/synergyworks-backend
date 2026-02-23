# Test failures: what was wrong and what was fixed

## Summary

Three issues caused the failures:

1. **Database column name mismatch** → workspace create returned 500, so projects/comments setup failed.
2. **LIMIT/OFFSET prepared statement** → list workspaces returned 500.
3. **Workspace id after insert** → create workspace could fail when using UUID primary key with `insertId`.

Fixing (1) and (2) made workspace create and list succeed, so `workspaceId` was set and "get workspace by id" could pass (it was 403 before because `workspaceId` was undefined when create failed).

---

## 1. Error: `Unknown column 'role' in 'field list'`

### What you saw

- **Where:** `createWorkspace` in `workspaceQueries.ts` (INSERT into `workspace_members`).
- **Log:**  
  `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)`  
  `sqlMessage: "Unknown column 'role' in 'field list'"`

### Root cause

- The **migration** that created `workspace_members` defined the column as **`roles`** (plural).
- The **code** used **`role`** (singular) in every INSERT/SELECT.
- So at runtime the table had no column named `role` → MySQL error.

### Fix (where and why)

| File | Before | After | Why |
|------|--------|--------|-----|
| `src/db/migrations/workSpace.sql` | `role ENUM(...)` | `roles ENUM(...)` | So new DBs are created with the same name the code uses. |
| `src/db/queries/workspaceQueries.ts` | `INSERT ... (workspace_id, user_id, role)` | `INSERT ... (workspace_id, user_id, roles)` | Matches the real column name. |
| Same file | `addMember` used column `role` | `addMember` uses column `roles` | Same reason. |
| Same file | `findMember` / `findMembersByWorkspaceId`: `SELECT *` (returns `roles`) | `SELECT ..., roles AS role, ...` | Code and Express still use `req.workspaceMember.role`; the alias keeps the API as `.role` while the DB column stays `roles`. |

If your database was already created with the column named **`role`**, run once:

`src/db/migrations/fix-workspace-members-role-column.sql`  
so the column is renamed to **`roles`** and matches the code.

---

## 2. Error: `Incorrect arguments to mysqld_stmt_execute`

### What you saw

- **Where:** `findWorkspacesByUserIdPaginated` in `workspaceQueries.ts` (list workspaces).
- **SQL:**  
  `SELECT w.* ... WHERE wm.user_id = ? ORDER BY w.created_at DESC LIMIT ? OFFSET ?`
- **Log:** `sqlMessage: 'Incorrect arguments to mysqld_stmt_execute'`

### Root cause

- With MySQL2 prepared statements, `LIMIT ?` and `OFFSET ?` sometimes get values that are not plain integers (e.g. string `"20"` from query parsing).
- The driver then complains about “incorrect arguments” for the statement.

### Fix (where and why)

| File | Before | After | Why |
|------|--------|--------|-----|
| `src/db/queries/workspaceQueries.ts` | `params.push(limit, offset)` | `params.push(Number(limit), Number(offset))` | Ensures MySQL2 receives integers for LIMIT/OFFSET and avoids the execute error. |

---

## 3. Workspace id after insert (UUID)

### What was wrong

- **Where:** `createWorkspace` in `workspaceQueries.ts`.
- **Before:** After `INSERT INTO workspaces (...)`, the code did  
  `SELECT id FROM workspaces WHERE id = ?` with `result.insertId`.
- **Problem:** `id` is `CHAR(36) DEFAULT (UUID())`, so there is no auto-increment. `result.insertId` is `0`. The `SELECT` with `id = 0` returns no row → “Workspace creation failed” and the transaction rolls back before the `workspace_members` INSERT.

### Fix (where and why)

| File | Before | After | Why |
|------|--------|--------|-----|
| `src/db/queries/workspaceQueries.ts` | `SELECT id FROM workspaces WHERE id = ?` with `[result.insertId]` | `SELECT id FROM workspaces WHERE owner_id = ? AND name = ? ORDER BY created_at DESC LIMIT 1` with `[ownerId, name]` | We don’t have an auto-increment id; we get the newly inserted row by owner and name and use its UUID. |

---

## 4. Why “get workspace by id” was 403

- **Before:** “should create a workspace” failed (500) because of (1) and (3).
- So `workspaceId` was never set (or was wrong).
- “should get workspace by id” then called e.g. `GET /api/workspaces/undefined` or an invalid id → membership check failed → **403 “User is not a member of this workspace”**.

**After:** Create and list workspaces succeed, `workspaceId` is set correctly, and “get workspace by id” gets a valid id and returns 200.

---

## 5. Cascading failures (projects + comments)

- **Before:** Projects and comments tests use `beforeAll` to create a user, login, then **create a workspace**. That workspace create failed with 500 (same `role`/workspace id issues). So `workspaceId` was missing → project create failed → “Project setup workspace failed” and both project and comment tests failed.

**After:** With workspace create fixed, setup completes, so project and comment tests can run and pass.

---

## Quick checklist after pulling these fixes

1. **DB column:** If you already had `workspace_members` with column **`role`**, run  
   `src/db/migrations/fix-workspace-members-role-column.sql`  
   once so the column is **`roles`**.
2. **New DBs:** Use the updated `workSpace.sql` (with `roles`); no extra step.
3. Run `npm test` again; workspace, project, and comment tests should pass.

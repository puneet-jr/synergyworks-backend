-- Run this only if your workspace_members table has column "role" and you get:
--   Unknown column 'role' in 'field list'
-- This renames the column to "roles" to match the application code.
-- If your table was created with workSpace.sql that already has "roles", skip this.

ALTER TABLE workspace_members
  CHANGE COLUMN role roles ENUM('owner','admin','member') NOT NULL DEFAULT 'member';

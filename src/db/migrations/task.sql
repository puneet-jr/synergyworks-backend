CREATE TABLE tasks (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    workspace_id CHAR(36) NOT NULL,
    
    -- Task Details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('todo', 'in_progress', 'done', 'archived') NOT NULL DEFAULT 'todo',
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
     
    -- Dates
    due_date DATETIME NULL,
    completed_at TIMESTAMP NULL, 
    
    -- People
    assigned_to CHAR(36) NULL,
    created_by CHAR(36) NULL,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_tasks_workspace 
        FOREIGN KEY (workspace_id) 
        REFERENCES workspaces(id) 
        ON DELETE CASCADE,
    
    CONSTRAINT fk_tasks_assigned_to
        FOREIGN KEY (assigned_to)
        REFERENCES users(id)
        ON DELETE SET NULL,
    
    CONSTRAINT fk_tasks_created_by
        FOREIGN KEY (created_by)
        REFERENCES users(id)
        ON DELETE SET NULL,
    
    -- Indexes
    INDEX idx_workspace_id (workspace_id),
    INDEX idx_status (status),
    INDEX idx_priority (priority), 
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_due_date (due_date), 
    INDEX idx_workspace_status (workspace_id, status),
    INDEX idx_workspace_assigned (workspace_id, assigned_to)
);
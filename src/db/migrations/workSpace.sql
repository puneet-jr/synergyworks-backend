CREATE TABLE workspaces (
    id char(36) PRIMARY KEY default (UUID()),
    name varchar(100) not null,
    description text,
    owner_id char(36) not null,
    created_at timestamp default CURRENT_TIMESTAMP,
    updated_at timestamp default CURRENT_TIMESTAMP on update CURRENT_TIMESTAMP,
    foreign KEY (owner_id) references users(id) on delete CASCADE
);

CREATE table workspace_members(
    workspace_id char(36) not null,
    user_id char(36) not null,
    roles ENUM('owner','admin','member') NOT NULL default 'member',
    joined_at timestamp default CURRENT_TIMESTAMP,
    primary key (workspace_id, user_id),
    foreign key (workspace_id) references workspaces(id) on delete CASCADE,
    foreign key (user_id) references users(id) on delete cascade
);
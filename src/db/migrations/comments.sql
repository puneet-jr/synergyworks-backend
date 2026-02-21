CREATE TABLE comments(

    id INT auto_increment primary key,
    project_id int not null,
    content text not null,
    author_id char(36) not null,
    created_at timestamp default current_timestamp,
    updated_at timestamp default current_timestamp on update current_timestamp,
    foreign key (project_id) references projects(id) on delete cascade,
    foreign key (author_id) references users(id) on delete cascade,
    index idx_comments_project_id(project_id),
    index idx_comments_author_id(author_id),
)

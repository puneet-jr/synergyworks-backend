CREATE TABLE users(
        id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name varchar(100) not null,
        email varchar(255) unique not null,
        password_hash text NOT NULL,
        created_at timestamp default current_timestamp,
        updated_at timestamp default current_timestamp on update current_timestamp
)
   


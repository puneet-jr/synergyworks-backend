# Synergyworks Backend

A robust, scalable Node.js/TypeScript backend API for workspace and project management with task tracking, team collaboration, and real-time commenting features.

## 🚀 Features

### Core Functionality
- **Authentication & Authorization**: JWT-based auth with access/refresh token flow
- **Workspace Management**: Create and manage collaborative workspaces with role-based permissions
- **Project Organization**: Nested projects within workspaces with full CRUD operations
- **Task Management**: Comprehensive task tracking with status, priority, and assignment features
- **Commenting System**: Real-time commenting on projects with full CRUD support
- **Role-Based Access Control**: Three-tier permission system (Owner, Admin, Member)

### Technical Highlights
- **TypeScript**: Full type safety across the entire codebase
- **MySQL Database**: Relational data with foreign keys and cascading deletes
- **Redis Integration**: Session management and refresh token storage
- **Input Validation**: Zod schemas for robust request validation
- **Error Handling**: Centralized error handling with custom error classes
- **Security**: Helmet.js, bcrypt password hashing, HTTP-only cookies
- **Testing**: Jest test suite with integration tests
- **Pagination**: Built-in pagination support for list endpoints

## 📋 Prerequisites

- **Node.js**: v18+ 
- **MySQL**: v8+
- **Redis**: v6+
- **npm** or **yarn**

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd puneet-jr-synergyworks-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```env
# Application
NODE_ENV=development
PORT=3000

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=work_management
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_CONNECTION_LIMIT=10

# Redis
REDIS_URL=redis://localhost:6379

# JWT Secrets (Change these in production!)
ACCESS_TOKEN_SECRET=your_access_token_secret_here
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# Bcrypt
BCRYPT_SALT_ROUNDS=10
```

### 4. Set up the database

Run the SQL migration files in order:

```bash
# Connect to MySQL
mysql -u root -p

# Create database
CREATE DATABASE work_management;
USE work_management;

# Run migrations in order
source src/db/migrations/createUsers.sql
source src/db/migrations/workSpace.sql
source src/db/migrations/project.sql
source src/db/migrations/task.sql
source src/db/migrations/comments.sql
```

### 5. Start the development server

```bash
npm run dev
```

The server will start at `http://localhost:3000`

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Authorization: Bearer <access_token>
Cookie: refreshToken=<refresh_token>
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access_token>
```

### Workspace Endpoints

#### Create Workspace
```http
POST /api/workspaces
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "My Workspace",
  "description": "A workspace for our team"
}
```

#### List Workspaces (Paginated)
```http
GET /api/workspaces?page=1&limit=20&search=project
Authorization: Bearer <access_token>
```

#### Get Workspace by ID
```http
GET /api/workspaces/:id
Authorization: Bearer <access_token>
```

#### Update Workspace
```http
PUT /api/workspaces/:id
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "name": "Updated Workspace Name",
  "description": "Updated description"
}
```
**Requires:** Admin or Owner role

#### Delete Workspace
```http
DELETE /api/workspaces/:id
Authorization: Bearer <access_token>
```
**Requires:** Owner role

#### Invite Member
```http
POST /api/workspaces/:id/members
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "email": "newmember@example.com",
  "role": "admin"
}
```
**Requires:** Admin or Owner role

#### Remove Member
```http
DELETE /api/workspaces/:id/members/:userId
Authorization: Bearer <access_token>
```
**Requires:** Admin or Owner role

### Project Endpoints

#### Create Project
```http
POST /api/workspaces/:id/projects
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "New Project",
  "description": "Project description"
}
```

#### List Projects
```http
GET /api/workspaces/:id/projects
Authorization: Bearer <access_token>
```

#### Update Project
```http
PUT /api/workspaces/:id/projects/:projectId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated Project Title",
  "description": "Updated description"
}
```
**Requires:** Admin or Owner role

#### Delete Project
```http
DELETE /api/workspaces/:id/projects/:projectId
Authorization: Bearer <access_token>
```
**Requires:** Owner role

### Task Endpoints

#### Get Task Summary
```http
GET /api/taskRoutes/:id/getTaskSummary
Authorization: Bearer <access_token>
```
**Requires:** Admin or Owner role

**Response:**
```json
{
  "success": true,
  "data": {
    "workspaceId": "uuid",
    "workspaceName": "My Workspace",
    "todoCount": 5,
    "inProgressCount": 3,
    "doneCount": 12,
    "totalCount": 20,
    "completionPercentage": 60.00
  }
}
```

#### List Tasks (Paginated)
```http
GET /api/taskRoutes/:id/getTasks?page=1&limit=20&search=urgent
Authorization: Bearer <access_token>
```

#### Get Task by ID
```http
GET /api/taskRoutes/:id/getTaskById
Authorization: Bearer <access_token>
```

#### Create Task
```http
POST /api/taskRoutes/:id/createTask
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Implement authentication",
  "description": "Add JWT-based auth system",
  "status": "todo"
}
```

#### Update Task
```http
PUT /api/taskRoutes/:id/updateTask
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Updated task title",
  "description": "Updated description",
  "status": "in_progress"
}
```
**Requires:** Admin or Owner role

#### Assign Task
```http
POST /api/taskRoutes/:id/assignTask
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "assignedTo": "user-uuid"
}
```
**Requires:** Admin or Owner role

#### Delete Task
```http
DELETE /api/taskRoutes/:id/delete/removeTask
Authorization: Bearer <access_token>
```
**Requires:** Admin or Owner role

### Comment Endpoints

#### List Comments
```http
GET /api/projects/:projectId/comments
Authorization: Bearer <access_token>
```

#### Add Comment
```http
POST /api/projects/:projectId/comments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "comment": "Great progress on this project!"
}
```

#### Get Comment by ID
```http
GET /api/projects/:projectId/comments/:commentId
Authorization: Bearer <access_token>
```

#### Update Comment
```http
PUT /api/projects/:projectId/comments/:commentId
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "Updated comment text"
}
```

#### Delete Comment
```http
DELETE /api/projects/:projectId/comments/:commentId
Authorization: Bearer <access_token>
```

#### Count Comments
```http
GET /api/projects/:projectId/comments/count
Authorization: Bearer <access_token>
```

## 🏗️ Project Structure

```
src/
├── config/              # Configuration files
│   ├── client.ts        # Redis client setup
│   ├── db.ts           # MySQL connection pool
│   └── env.ts          # Environment variables
├── db/
│   ├── migrations/      # SQL schema files
│   └── queries/         # Database query functions
├── modules/             # Feature modules
│   ├── auth/           # Authentication
│   ├── comment/        # Comments
│   ├── project/        # Projects
│   ├── task/           # Tasks
│   └── workspace/      # Workspaces
├── shared/
│   ├── errors/         # Custom error classes
│   ├── middlewares/    # Express middlewares
│   └── utils/          # Utility functions
├── tests/              # Test files
├── validators/         # Zod validation schemas
├── index.ts           # Express app setup
└── server.ts          # Server bootstrap
```

## 🔐 Authentication Flow

1. **Registration/Login**: User receives access token (15min) and refresh token (7 days)
2. **Refresh token** stored in Redis with TTL
3. **HTTP-only cookie** holds refresh token
4. **Access token** sent in Authorization header: `Bearer <token>`
5. **Token refresh**: Use `/api/auth/refresh` when access token expires

## 🛡️ Permission Levels

| Role | Create | Read | Update | Delete | Invite Members | Manage Tasks |
|------|--------|------|--------|--------|----------------|--------------|
| **Owner** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Admin** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Member** | ✅ | ✅ | ❌ | ❌ | ❌ | ⚠️ (Own tasks) |

## 🧪 Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Coverage
- Authentication flow (register, login, refresh, logout)
- Workspace CRUD operations
- Project management
- Comment system
- Health check endpoint

## 📦 Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm run clean        # Remove dist folder
npm run rebuild      # Clean and build
npm test             # Run Jest tests
npm run test:watch   # Run tests in watch mode
```

## 🗄️ Database Schema

### Users
- `id` (UUID, PK)
- `name`
- `email` (unique)
- `password_hash`
- `created_at`
- `updated_at`

### Workspaces
- `id` (UUID, PK)
- `name`
- `description`
- `owner_id` (FK → users)
- `created_at`
- `updated_at`

### Workspace Members
- `workspace_id` (FK → workspaces)
- `user_id` (FK → users)
- `role` (owner, admin, member)
- `joined_at`

### Projects
- `id` (UUID, PK)
- `workspace_id` (FK → workspaces)
- `title`
- `description`
- `created_at`
- `updated_at`

### Tasks
- `id` (UUID, PK)
- `workspace_id` (FK → workspaces)
- `title`
- `description`
- `status` (todo, in_progress, done, archived)
- `priority` (low, medium, high, urgent)
- `due_date`
- `assigned_to` (FK → users)
- `created_by` (FK → users)
- `created_at`
- `updated_at`

### Comments
- `id` (INT, PK, Auto-increment)
- `project_id` (FK → projects)
- `content`
- `author_id` (FK → users)
- `created_at`
- `updated_at`

## 🔧 Technology Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MySQL 2
- **Cache/Session**: Redis (ioredis)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **Testing**: Jest + Supertest
- **Security**: Helmet.js
- **Dev Tools**: tsx, nodemon, ts-node

## 🚦 Error Handling

The API uses standardized error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden / Permission Denied
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 🌐 Environment Configuration

### Development
```env
NODE_ENV=development
```
- Detailed error messages
- Stack traces visible
- CORS enabled

### Production
```env
NODE_ENV=production
```
- Secure cookies (HTTPS only)
- Minimal error details
- Enhanced security headers

## 📝 Best Practices

1. **Never commit `.env` file** - Use `.env.example` template
2. **Change default secrets** in production
3. **Use strong passwords** for database and Redis
4. **Enable HTTPS** in production
5. **Set up database backups** regularly
6. **Monitor Redis memory** usage
7. **Implement rate limiting** for production APIs
8. **Use connection pooling** (already configured)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🐛 Troubleshooting

### Common Issues

**MySQL Connection Error**
```bash
# Check if MySQL is running
sudo service mysql status

# Verify credentials in .env
DB_USER=root
DB_PASSWORD=your_password
```

**Redis Connection Error**
```bash
# Check if Redis is running
redis-cli ping
# Should return: PONG

# Start Redis
redis-server
```

**Port Already in Use**
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation
- Review test files for usage examples

---

Built using Node.js, TypeScript, and Express

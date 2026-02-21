import express, { Application } from 'express';
import helmet from 'helmet';
import authRoutes from './modules/auth/authRouters.js';
import workspaceRoutes from './modules/workspace/workspaceRoutes.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import taskRoutes from './modules/task/taskRoutes.js';
import projectRoutes from './modules/project/projectRouters.js';
import commentRoutes from './modules/comment/commentRouters.js';

const app: Application = express();

app.use(helmet());

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.use("/api/taskRoutes",taskRoutes);

app.use("/api/projects",projectRoutes);
app.use("/api/comments",commentRoutes);

app.use(errorHandler);

export default app;


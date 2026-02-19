import express, { Application } from 'express';
import helmet from 'helmet';
import authRoutes from './modules/auth/authRouters.js';
import workspaceRoutes from './modules/workspace/workspaceRoutes.js';
import { errorHandler } from './shared/middlewares/errorHandler.js';
import taskRoutes from './modules/task/taskRoutes.js';

const app: Application = express();

app.use(helmet());

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);

app.use("/api/taskRoutes",taskRoutes);

app.use(errorHandler);

export default app;


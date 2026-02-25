import app from './index.js';
import { env } from './config/env.js';
import { testDBConnection,closeDBPool } from './config/db.js';
import { initializeRedisClient } from './config/client.js';

async function bootstrap(): Promise<void> {
  await testDBConnection();
  await initializeRedisClient();

  app.listen(env.PORT, () => {
    console.log(`Server running on http://localhost:${env.PORT}`);
    console.log(`Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

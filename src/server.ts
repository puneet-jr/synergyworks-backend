import app from './index.js';
import { env } from './config/env.js';
import { testDBConnection,closeDBPool } from './config/db.js';
import { initializeRedisClient } from './config/client.js';

async function bootstrap(): Promise<void> {
  try {
    await testDBConnection();
    await initializeRedisClient();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on http://localhost:${env.PORT}`);
    });

    // Handle manual shutdowns 
    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('HTTP server closed.');
        await closeDBPool(); // Close DB only after server stops accepting requests
        console.log('Database pool closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  } catch (error) {
    console.error('Failed to start server:', error);
    await closeDBPool(); // Cleanup if startup fails
    process.exit(1);
  }
}

bootstrap();
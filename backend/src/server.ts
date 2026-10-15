import { app } from './app';
import { config } from './config';
import { prisma } from './prisma';

async function startServer() {
  try {
    await prisma.$connect();
    console.log(`[DATABASE] Connected to database at: ${process.env.DATABASE_URL || 'dev.db'}`);

    const server = app.listen(config.port, () => {
      console.log(`[GARAA_API] Server listening on http://localhost:${config.port}`);
      console.log(`[GARAA_DOCS] Swagger API documentation available at http://localhost:${config.port}/api/v1/docs`);
      console.log(`[HEALTH] Health check active at http://localhost:${config.port}/health`);
    });

    const shutdown = async () => {
      console.log('[GARAA_API] Gracefully shutting down...');
      server.close(async () => {
        await prisma.$disconnect();
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('[SERVER_INIT_FAILURE]', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

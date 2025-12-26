import { createApp } from '../../app.js';
import { env, initDatabase, closeDatabase } from '../../config/index.js';
import { log } from '../../shared/middleware/logger.js';
import { initSupabase, setupDefaultRoles } from '../../domains/auth/index.js';
import { razorpay } from '../../domains/payments/index.js';
import { seedDefaultPlans } from '../../db/seed.js';

// Graceful shutdown handler
const gracefulShutdown = async (signal: string): Promise<void> => {
  log.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    await closeDatabase();
    log.info('Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    log.error('Error during shutdown', error);
    process.exit(1);
  }
};

// Main server startup
const main = async (): Promise<void> => {
  try {
    // Initialize Supabase
    log.info('Initializing Supabase...');
    await initSupabase();

    // Setup default roles
    await setupDefaultRoles();

    // Initialize database
    log.info('Initializing database connection...');
    await initDatabase();

    // Seed default billing plans
    log.info('Seeding default billing plans...');
    const seedResult = await seedDefaultPlans();
    log.info(`Plans seeding: ${seedResult.created} created, ${seedResult.skipped} already exist`);

    // Initialize Razorpay (if configured)
    if (env.razorpay.keyId && env.razorpay.keySecret) {
      log.info('Initializing Razorpay...');
      razorpay.initRazorpay({
        key_id: env.razorpay.keyId,
        key_secret: env.razorpay.keySecret,
        webhook_secret: env.razorpay.webhookSecret,
      });
    } else {
      log.warn('Razorpay not configured - payment features will be unavailable');
    }

    // Create Express app
    const app = createApp();

    // Start server
    const { host, port } = env.server;
    const server = app.listen(port, host, () => {
      log.info(`Server started on http://${host}:${port}`);
      log.info(`Environment: ${env.nodeEnv}`);
    });

    // Handle server errors
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        log.error(`Port ${port} is already in use`);
      } else {
        log.error('Server error', error);
      }
      process.exit(1);
    });

    // Register shutdown handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      log.error('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      log.error('Unhandled rejection', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    log.error('Failed to start server', error);
    process.exit(1);
  }
};

// Run the server
main();


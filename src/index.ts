import fastify, { FastifyInstance } from 'fastify';
import { config } from '@/config';
import { loggers, logStartup } from '@/utils/logger';
import DatabaseConnection from '@/database/connection';
import CacheManager from '@/cache/manager';
import { userRoutes } from '@/components/user';
import { AppError } from '@/utils/errors';
import { ResponseHandler } from '@/utils/response';

// Create Fastify instance with logging
const createServer = (): FastifyInstance => {
  const server = fastify({
    logger: false, // We use our own logger
    trustProxy: true,
    ignoreTrailingSlash: true,
  });

  // Request logging middleware
  server.addHook('onRequest', async request => {
    loggers.http.info(
      {
        method: request.method,
        url: request.url,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      },
      'Incoming request'
    );
  });

  // Response logging middleware
  server.addHook('onResponse', async (request, reply) => {
    loggers.http.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        responseTime: reply.getResponseTime(),
      },
      'Request completed'
    );
  });

  // Global error handler
  server.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      return ResponseHandler.error(reply, error);
    }

    loggers.http.error(
      {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
        },
      },
      'Unhandled server error'
    );

    return ResponseHandler.error(reply, error, 500);
  });

  // 404 handler
  server.setNotFoundHandler((request, reply) => {
    loggers.http.warn(
      {
        method: request.method,
        url: request.url,
      },
      'Route not found'
    );

    return ResponseHandler.error(reply, new Error('Route not found'), 404);
  });

  return server;
};

// Setup Swagger documentation (development only)
const setupSwagger = async (server: FastifyInstance): Promise<void> => {
  if (!config.swagger.enabled) {
    return;
  }

  await server.register(require('@fastify/swagger'), {
    openapi: {
      openapi: '3.0.0',
      info: {
        title: 'Dev Dummy Service API',
        description: 'A robust Node.js + TypeScript + Fastify starter project',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@example.com',
        },
      },
      servers: [
        {
          url: `http://${config.host}:${config.port}`,
          description: 'Development server',
        },
      ],
      tags: [
        {
          name: 'Users',
          description: 'User management endpoints',
        },
        {
          name: 'Health',
          description: 'System health and status endpoints',
        },
      ],
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: false },
              error: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  code: { type: 'string' },
                  statusCode: { type: 'integer' },
                  details: { type: 'object' },
                },
              },
              timestamp: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  });

  await server.register(require('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
    staticCSP: true,
    transformStaticCSP: (header: string) => header,
    transformSpecification: (swaggerObject: unknown) => swaggerObject,
    transformSpecificationClone: true,
  });

  loggers.app.info('Swagger documentation available at /docs');
};

// Setup routes
const setupRoutes = async (server: FastifyInstance): Promise<void> => {
  // Health check endpoint
  server.get('/health', {
    schema: {
      tags: ['Health'],
      summary: 'Health check',
      description: 'Returns the health status of the application and its dependencies',
      response: {
        200: {
          description: 'Service is healthy',
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'healthy' },
                timestamp: { type: 'string', format: 'date-time' },
                version: { type: 'string', example: '1.0.0' },
                environment: { type: 'string', example: 'development' },
                uptime: { type: 'number', example: 123.456 },
                dependencies: {
                  type: 'object',
                  properties: {
                    database: { type: 'string', example: 'healthy' },
                    redis: { type: 'string', example: 'healthy' },
                  },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
    handler: async (request, reply) => {
      try {
        // Check database health
        await DatabaseConnection.query('SELECT 1', [], true);
        const dbStatus = 'healthy';

        // Check Redis health
        await CacheManager.ping();
        const redisStatus = 'healthy';

        const healthData = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          environment: config.nodeEnv,
          uptime: process.uptime(),
          dependencies: {
            database: dbStatus,
            redis: redisStatus,
          },
        };

        return ResponseHandler.success(reply, healthData, 'Service is healthy');
      } catch (error) {
        return ResponseHandler.error(reply, new Error('Service is unhealthy'), 503);
      }
    },
  });

  // API routes
  server.register(userRoutes, { prefix: '/api/v1' });
};

// Initialize application
const initializeApp = async (): Promise<FastifyInstance> => {
  try {
    logStartup();

    // Initialize database
    await DatabaseConnection.initialize();

    // Initialize cache
    await CacheManager.initialize();

    // Create server
    const server = createServer();

    // Setup Swagger (development only)
    await setupSwagger(server);

    // Setup routes
    await setupRoutes(server);

    return server;
  } catch (error) {
    loggers.app.error({ error }, 'Failed to initialize application');
    throw error;
  }
};

// Graceful shutdown handler
const setupGracefulShutdown = (server: FastifyInstance): void => {
  const gracefulShutdown = async (signal: string): Promise<void> => {
    loggers.app.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

    try {
      // Close HTTP server
      await server.close();
      loggers.app.info('HTTP server closed');

      // Close database connections
      await DatabaseConnection.close();

      // Close Redis connection
      await CacheManager.close();

      loggers.app.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      loggers.app.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

// Start server
const start = async (): Promise<void> => {
  try {
    const server = await initializeApp();

    // Setup graceful shutdown
    setupGracefulShutdown(server);

    // Start listening
    await server.listen({
      port: config.port,
      host: config.host,
    });

    loggers.app.info(
      {
        port: config.port,
        host: config.host,
        environment: config.nodeEnv,
        swaggerEnabled: config.swagger.enabled,
      },
      'Server started successfully'
    );

    if (config.swagger.enabled) {
      loggers.app.info(
        `📚 API documentation available at: http://${config.host}:${config.port}/docs`
      );
    }
  } catch (error) {
    loggers.app.error({ error }, 'Failed to start server');
    process.exit(1);
  }
};

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', error => {
  loggers.app.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  loggers.app.fatal({ reason, promise }, 'Unhandled promise rejection');
  process.exit(1);
});

// Start the application
if (require.main === module) {
  start();
}

export default initializeApp;

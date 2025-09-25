import pino from 'pino';
import { config } from '@/config';
import fs from 'fs';
import path from 'path';

// Ensure logs directory exists
const ensureLogDir = (): void => {
  if (config.logging.fileEnabled && config.logging.filePath) {
    const logDir = path.dirname(config.logging.filePath);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
};

// Create logger configuration
const createLoggerConfig = () => {
  const baseConfig = {
    level: config.logging.level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string) => ({ level: label }),
    },
  };

  if (config.logging.prettyPrint) {
    return {
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      },
    };
  }

  return baseConfig;
};

// Initialize logger
ensureLogDir();
let logger = pino(createLoggerConfig());

// Add file stream if enabled
if (config.logging.fileEnabled && config.logging.filePath) {
  const fileStream = pino.destination(config.logging.filePath);
  const streams = [{ stream: process.stdout }, { stream: fileStream }];

  if (!config.logging.prettyPrint) {
    logger = pino(createLoggerConfig(), pino.multistream(streams));
  }
}

// Enhanced logger with context methods
export const createLogger = (context: string) => {
  return logger.child({ context });
};

// Application lifecycle logging
export const loggers = {
  app: createLogger('APP'),
  db: createLogger('DATABASE'),
  redis: createLogger('REDIS'),
  http: createLogger('HTTP'),
  auth: createLogger('AUTH'),
  user: createLogger('USER'),
};

// Log application startup
export const logStartup = (): void => {
  loggers.app.info(
    {
      nodeEnv: config.nodeEnv,
      port: config.port,
      host: config.host,
      logLevel: config.logging.level,
      prettyLogs: config.logging.prettyPrint,
      fileLogging: config.logging.fileEnabled,
    },
    'Application starting up'
  );
};

// Log database operations
export const logDbOperation = (operation: string, table: string, duration?: number): void => {
  loggers.db.info(
    {
      operation,
      table,
      duration: duration ? `${duration}ms` : undefined,
    },
    `Database operation: ${operation} on ${table}`
  );
};

// Log Redis operations
export const logRedisOperation = (operation: string, key?: string, duration?: number): void => {
  loggers.redis.info(
    {
      operation,
      key,
      duration: duration ? `${duration}ms` : undefined,
    },
    `Redis operation: ${operation}${key ? ` for key: ${key}` : ''}`
  );
};

export default logger;

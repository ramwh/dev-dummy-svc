import { AppConfig } from '@/types/config';

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${key} is required`);
  }
  return value ? parseInt(value, 10) : defaultValue!;
};

const getEnvBoolean = (key: string, defaultValue: boolean = false): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
};

export const config: AppConfig = {
  nodeEnv: getEnvVar('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 3000),
  host: getEnvVar('HOST', '0.0.0.0'),

  database: {
    primary: {
      host: getEnvVar('DB_PRIMARY_HOST', 'localhost'),
      port: getEnvNumber('DB_PRIMARY_PORT', 3306),
      user: getEnvVar('DB_PRIMARY_USER', 'root'),
      password: getEnvVar('DB_PRIMARY_PASSWORD', 'password'),
      database: getEnvVar('DB_PRIMARY_NAME', 'dev_dummy_svc'),
    },
    replica: {
      host: getEnvVar('DB_REPLICA_HOST', 'localhost'),
      port: getEnvNumber('DB_REPLICA_PORT', 3307),
      user: getEnvVar('DB_REPLICA_USER', 'root'),
      password: getEnvVar('DB_REPLICA_PASSWORD', 'password'),
      database: getEnvVar('DB_REPLICA_NAME', 'dev_dummy_svc'),
    },
  },

  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getEnvNumber('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    db: getEnvNumber('REDIS_DB', 0),
  },

  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    fileEnabled: getEnvBoolean('LOG_FILE_ENABLED', true),
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
    prettyPrint: getEnvBoolean('PRETTY_LOGS', process.env.NODE_ENV === 'development'),
  },

  swagger: {
    enabled: getEnvBoolean('SWAGGER_ENABLED', process.env.NODE_ENV === 'development'),
  },
};

export interface DatabaseConfig {
  primary: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
  replica: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
}

export interface LogConfig {
  level: string;
  fileEnabled: boolean;
  filePath?: string;
  prettyPrint: boolean;
}

export interface AppConfig {
  nodeEnv: string;
  port: number;
  host: string;
  database: DatabaseConfig;
  redis: RedisConfig;
  logging: LogConfig;
  swagger: {
    enabled: boolean;
  };
}

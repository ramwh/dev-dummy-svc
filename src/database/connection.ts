import mysql from 'mysql2/promise';
import { config } from '@/config';
import { loggers, logDbOperation } from '@/utils/logger';
import { DatabaseError } from '@/utils/errors';

export class DatabaseConnection {
  private static primaryPool: mysql.Pool;
  private static replicaPool: mysql.Pool;

  static async initialize(): Promise<void> {
    try {
      // Create primary connection pool
      this.primaryPool = mysql.createPool({
        host: config.database.primary.host,
        port: config.database.primary.port,
        user: config.database.primary.user,
        password: config.database.primary.password,
        database: config.database.primary.database,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Create replica connection pool
      this.replicaPool = mysql.createPool({
        host: config.database.replica.host,
        port: config.database.replica.port,
        user: config.database.replica.user,
        password: config.database.replica.password,
        database: config.database.replica.database,
        connectionLimit: 10,
        queueLimit: 0,
      });

      // Test connections
      await this.testConnection();

      loggers.db.info(
        {
          primary: {
            host: config.database.primary.host,
            port: config.database.primary.port,
            database: config.database.primary.database,
          },
          replica: {
            host: config.database.replica.host,
            port: config.database.replica.port,
            database: config.database.replica.database,
          },
        },
        'Database connections initialized'
      );
    } catch (error) {
      loggers.db.error({ error }, 'Failed to initialize database connections');
      throw new DatabaseError('Database initialization failed', {
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  private static async testConnection(): Promise<void> {
    try {
      // Test primary connection
      const primaryConnection = await this.primaryPool.getConnection();
      await primaryConnection.ping();
      primaryConnection.release();

      // Test replica connection
      const replicaConnection = await this.replicaPool.getConnection();
      await replicaConnection.ping();
      replicaConnection.release();

      loggers.db.info('Database connection tests successful');
    } catch (error) {
      throw new DatabaseError('Database connection test failed', {
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    }
  }

  static async query<T = mysql.RowDataPacket[]>(
    sql: string,
    values?: unknown[],
    useReplica: boolean = false
  ): Promise<T> {
    const startTime = Date.now();
    const pool = useReplica ? this.replicaPool : this.primaryPool;
    const operation = useReplica ? 'READ' : 'WRITE';

    try {
      const [rows] = await pool.execute(sql, values);
      const duration = Date.now() - startTime;

      logDbOperation(operation, this.extractTableFromQuery(sql), duration);

      return rows as T;
    } catch (error) {
      const duration = Date.now() - startTime;
      loggers.db.error(
        {
          sql,
          values,
          operation,
          duration,
          error,
        },
        'Database query failed'
      );

      throw new DatabaseError(`Database ${operation.toLowerCase()} operation failed`, {
        context: {
          sql,
          values,
          operation,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    }
  }

  static async transaction<T>(
    callback: (connection: mysql.PoolConnection) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    const connection = await this.primaryPool.getConnection();

    try {
      await connection.beginTransaction();
      loggers.db.info('Transaction started');

      const result = await callback(connection);

      await connection.commit();
      const duration = Date.now() - startTime;
      logDbOperation('TRANSACTION', 'multiple', duration);

      return result;
    } catch (error) {
      await connection.rollback();
      const duration = Date.now() - startTime;

      loggers.db.error(
        {
          duration,
          error,
        },
        'Transaction rolled back due to error'
      );

      throw new DatabaseError('Transaction failed', {
        context: { error: error instanceof Error ? error.message : 'Unknown error' },
      });
    } finally {
      connection.release();
    }
  }

  private static extractTableFromQuery(sql: string): string {
    const match = sql.match(/(?:FROM|INTO|UPDATE|JOIN)\s+`?(\w+)`?/i);
    return match?.[1] || 'unknown';
  }

  static async close(): Promise<void> {
    try {
      await this.primaryPool.end();
      await this.replicaPool.end();
      loggers.db.info('Database connections closed');
    } catch (error) {
      loggers.db.error({ error }, 'Error closing database connections');
    }
  }
}

export default DatabaseConnection;

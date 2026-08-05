import { DataSource } from 'typeorm';
import path from 'path';
import { getEnvs } from '@/shared/utils/getEnv';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { TYPES } from '@/shared/constants/identifiers';
import { inject, injectable } from 'inversify';

const { POSTGRES_DB, POSTGRES_HOST, POSTGRES_PASSWORD, POSTGRES_PORT, POSTGRES_USER, NODE_ENV } =
  getEnvs({
    POSTGRES_HOST: 'localhost',
    POSTGRES_PORT: '5432',
    POSTGRES_DB: 'auth',
    POSTGRES_USER: 'postgres',
    POSTGRES_PASSWORD: 'password',
    NODE_ENV: 'development',
  });

@injectable()
export class AppDataSource {
  private readonly _datasource: DataSource;

  public constructor(@inject(TYPES.LoggerService) private readonly _logger: ILoggerService) {
    this._datasource = new DataSource({
      type: 'postgres', // Specifies the database type
      host: POSTGRES_HOST.toString(), // Database connection URL
      port: parseInt(POSTGRES_PORT.toString() || '5432', 10)!,
      password: POSTGRES_PASSWORD.toString(),
      username: POSTGRES_USER.toString(),
      database: POSTGRES_DB.toString(),
      synchronize: true, //NODE_ENV !== 'production', // Disable synchronization in production
      entities: [path.resolve(__dirname, '../entities/*.{ts,js}')], // Paths to the entity files
      migrations: [path.resolve(__dirname, '../migrations/*.{ts,js}')], // Paths to the migration files
      logging: ['error', 'warn'], // Enables logging for errors and migrations
      cache: {
        duration: 30000, // Cache duration in milliseconds (30 seconds)
      },
      extra: {
        max: 20, // maximum number of connections in the pool
        min: 5, // minimum number of connections in the pool
        idleTimeoutMillis: 30000, // close idle connections after 30 seconds
        connectionTimeoutMillis: 4000, // return an error after 4 seconds if connection could not be established
        ssl: false && NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      },
    });
  }

  public initializeDb = async (): Promise<void> => {
    try {
      this._logger.info('initializing db', {
        db: POSTGRES_DB,
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        user: POSTGRES_USER,
      });
      await this._datasource.initialize();
    } catch (error) {
      this._logger.error('Error while initializing db', {
        db: POSTGRES_DB,
        host: POSTGRES_HOST,
        port: POSTGRES_PORT,
        user: POSTGRES_USER,
        error,
      });
      throw error;
    }
  };

  public get dataSource(): DataSource {
    return this._datasource;
  }
}

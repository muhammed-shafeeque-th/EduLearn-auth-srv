import { TYPES } from './shared/constants/identifiers';
import './infrastructure/database/cron/delete-expired-tokens.cron';
import { GrpcAppServer } from './presentation/grpc/server';
import { ICacheService } from './application/adaptors/cache.service';
import { inject, injectable } from 'inversify';
import { AppDataSource } from './infrastructure/database/data-source/data-source';
import { ILoggerService } from './application/adaptors/logger.service';
import { KafkaAppServer } from './presentation/kafka/kafka.server';
import { AppHealthController } from './infrastructure/health/health-server';
import { MetricsEngine } from './infrastructure/observability/metric/setup';

@injectable()
export class AuthApplication {
  private isShuttingDown = false;

  public constructor(
    @inject(TYPES.LoggerService) private readonly _logger: ILoggerService,
    @inject(TYPES.HealthController) private readonly _healthServer: AppHealthController,
    @inject(TYPES.MetricsEngine) private readonly _metricsEngine: MetricsEngine,
    @inject(TYPES.DBDataSource) private readonly _appDatasource: AppDataSource,
    @inject(TYPES.KafkaAppServer) private readonly _kafkaServer: KafkaAppServer,
    @inject(TYPES.ICacheService) private readonly _cacheService: ICacheService,
    @inject(TYPES.GrpcAppServer) private readonly _grpcAppServer: GrpcAppServer,
  ) {}

  public async initialize(): Promise<void> {
    this.setupGlobalErrorHandlers();
    await this.initDb();

    await this.initKafka();

    await this.initCache();

    this.initGrpcSever();

    await this.initServices();
    this._logger.info('Application started successfully ');
  }

  private async initKafka(): Promise<void> {
    try {
      // Initialize Kafka manager
      await this._kafkaServer.initialize();
    } catch (error) {
      this._logger.error('Error while initializing  Kafka ', { error });
      throw error;
    }
  }
  private async initServices(): Promise<void> {
    try {
      this._healthServer.initialize();
      this._logger.info('Health service initialized');

      await this._metricsEngine.start();
      this._logger.info('Metrics service initialized');
    } catch (error) {
      this._logger.error('Error while initializing services ', { error });
      throw error;
    }
  }
  private async initDb(): Promise<void> {
    try {
      await this._appDatasource.initializeDb();
      await this._appDatasource.dataSource.runMigrations();
      this._logger.info('Connected to db');
      // Initialize Kafka manager
    } catch (error) {
      this._logger.error('Error while Connecting DB ', { error });
      throw error;
    }
  }

  private async initCache(): Promise<void> {
    try {
      // Connect to redis
      await this._cacheService.getClient().connect();
    } catch (error) {
      this._logger.error('Error while connecting to Redis', { error });
      throw error;
    }
  }

  private initGrpcSever(): void {
    this._grpcAppServer.initialize();
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this._logger.error('Unhandled Rejection at:', {
        promise,
        reason,
        stack: reason instanceof Error ? reason.stack : undefined,
      });
      throw reason;
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this._logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack,
      });

      // Don't exit immediately, give time for cleanup
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    });
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    this._logger.info('Shutting down Auth server...');
    try {
      await this._grpcAppServer.shutdown();
      this._logger.info('gRPC server stopped ');

      await this._kafkaServer.shutdown();
      this._logger.info('Kafka manager got shutdown');

      await this._appDatasource.dataSource.destroy();
      this._logger.info('Database connection closed ');

      await this._cacheService.getClient().disconnect();
      this._logger.info('Cache connection closed ');

      await this._metricsEngine.shutdown();
      this._logger.info('Metrics engine closed ');

      process.exit(0);
    } catch (error) {
      this._logger.error('Error during App shutdown' + { ctx: AuthApplication.name, error });
    }
  }
}

import { container } from './infrastructure/di/container';
import { TYPES } from './shared/constants/identifiers';
import { RedisCacheService } from './infrastructure/redis/cache.service';
import './infrastructure/database/cron/delete-expired-tokens.cron';
import path from 'path';
import { startHealthServer } from './infrastructure/health/health-server';
import { AppDataSource, initializeDb } from './infrastructure/database/data-source/data-source';
import { GrpcServer } from './infrastructure/gRPC/server/server';
import { getEnvs } from './shared/utils/getEnv';
import { AuthServiceServer } from './infrastructure/gRPC/generated/auth_service';
import { KafkaManager } from './infrastructure/kafka';
import { LoggerService } from './infrastructure/observability/logger/logger.service';

const { HEALTH_PORT, GRPC_PORT } = getEnvs({ HEALTH_PORT: 8081, GRPC_PORT: 50051 });

export class App {
  private server: GrpcServer<AuthServiceServer>;
  private controllers: AuthServiceServer;
  private redis: RedisCacheService;
  private db: typeof AppDataSource;
  private kafkaManager: KafkaManager;

  private logger = LoggerService.getInstance('App');

  public async initialize(): Promise<void> {
    this.setupGlobalErrorHandlers();
    await this.connectDB();

    await this.setupKafka();

    await this.connectRedis();
    this.setupControllers();

    this.setupServer();

    startHealthServer(this.redis, this.db, Number(HEALTH_PORT));
    this.logger.info('Application started successfully ');
    // this.redis.logMetrics();
  }

  private async setupKafka(): Promise<void> {
    try {
      // Initialize Kafka manager
      this.kafkaManager = container.get(TYPES.KafkaManager);

      // Initialize with event handlers
      await this.kafkaManager.initializeHandlers([container.get(TYPES.IEventConsumerController)]);
    } catch (error) {
      this.logger.error('Error while setting up Kafka ', { error });
      throw error;
    }
  }

  private async connectDB(): Promise<void> {
    try {
      this.db = AppDataSource;
      await initializeDb();
      await this.db.runMigrations();
      this.logger.info('Connected to db');
      // Initialize Kafka manager
    } catch (error) {
      this.logger.error('Error while Connecting DB ', { error });
      throw error;
    }
  }

  private async connectRedis(): Promise<void> {
    try {
      // Connect to redis
      this.redis = RedisCacheService.getInstance();
      // await this.redis.connect();
    } catch (error) {
      this.logger.error('Error while connecting to Redis', { error });
      throw error;
    }
  }

  private setupControllers(): void {
    try {
      this.controllers = container.get(TYPES.IAuthServiceController);
    } catch (error) {
      this.logger.error('Error while setting up controllers ', { error });
      throw error;
    }
  }

  private setupServer(): void {
    // Initialize gRPC server
    try {
      this.logger.info(`gRPC server starting...`);
      this.server = new GrpcServer<AuthServiceServer>(
        {
          protoPath: path.join(process.cwd(), 'proto', 'auth_service.proto'),
          packageName: 'auth_service',
          serviceName: 'AuthService',
          port: Number(GRPC_PORT),
        },
        this.controllers,
      );

      this.server.start();
      this.logger.info(`gRPC AuthService server started at port ${GRPC_PORT}`);
    } catch (error) {
      this.logger.error('Error while starting gRPC server ', { error });
      throw error;
    }
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled Rejection at:', {
        promise,
        reason,
        stack: reason instanceof Error ? reason.stack : undefined,
      });
      throw reason;
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught Exception:', {
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
    try {
      if (this.server) {
        await this.server.shutdown();
        this.logger.info('gRPC server stopped ');
      }

      if (this.kafkaManager) {
        await this.kafkaManager.shutdown();
        this.logger.info('Kafka manager got shutdown');
      }

      await this.db.destroy();
      this.logger.info('Database connection closed ');
      await this.redis.disconnect();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during App shutdown' + { ctx: App.name, error });
    }
  }
}

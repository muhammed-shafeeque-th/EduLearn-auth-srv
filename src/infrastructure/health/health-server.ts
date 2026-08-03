import { TYPES } from '@/shared/constants/identifiers';
import { HealthServer, IHealthCheck } from '@edulearn/core';
import { Server } from 'http';
import { inject, injectable } from 'inversify';

@injectable()
export class AppHealthController {
  private readonly healthServer: HealthServer;

  public constructor(
    @inject(TYPES.HttpServer) server: Server,
    @inject(TYPES.DBHealthCheck) dbChecker: IHealthCheck,
    @inject(TYPES.RedisHealthCheck) redisChecker: IHealthCheck,
    @inject(TYPES.KafkaHealthCheck) kafkaHealthCheck: IHealthCheck,
  ) {
    this.healthServer = new HealthServer(server, [dbChecker, redisChecker, kafkaHealthCheck]);
  }

  public initialize(): void {
    this.healthServer.register();
  }
}

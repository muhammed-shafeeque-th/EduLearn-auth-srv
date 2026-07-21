import { TYPES } from '@/shared/constants/identifiers';
import { getEnvs, HealthServer, IHealthCheck } from '@edulearn/core';
import { inject, injectable } from 'inversify';

const { HEALTH_PORT } = getEnvs({ HEALTH_PORT: 8081 });

@injectable()
export class AppHealthServer {
  private readonly healthServer: HealthServer;

  public constructor(
    @inject(TYPES.DBHealthCheck) dbChecker: IHealthCheck,
    @inject(TYPES.RedisHealthCheck) redisChecker: IHealthCheck,
  ) {
    this.healthServer = new HealthServer({ port: Number(HEALTH_PORT) }, [dbChecker, redisChecker]);
  }

  public initialize(): void {
    this.healthServer.register();
  }
}

import { ICacheService } from '@/application/adaptors/cache.service';
import { TYPES } from '@/shared/constants/identifiers';
import { HealthCheckResult, IHealthCheck } from '@edulearn/core';
import { inject, injectable } from 'inversify';

@injectable()
export class RedisHealthCheck implements IHealthCheck {
  constructor(@inject(TYPES.ICacheService) private readonly _cache: ICacheService) {}

  async check(): Promise<HealthCheckResult> {
    let healthy = true;
    let _error;
    try {
      await this._cache.getClient().ping();
      healthy = true;
    } catch (error) {
      _error = error;
      healthy = false;
    }

    return {
      name: 'cache',
      status: healthy ? 'up' : 'down',
      error: (_error as Error)?.message ?? 'unknown',
    };
  }
}

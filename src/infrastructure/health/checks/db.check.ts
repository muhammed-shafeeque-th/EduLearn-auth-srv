import { AppDataSource } from '@/infrastructure/database/data-source/data-source';
import { TYPES } from '@/shared/constants/identifiers';
import { HealthCheckResult, IHealthCheck } from '@edulearn/core';
import { inject } from 'inversify';

export class DBHealthCheck implements IHealthCheck {
  constructor(@inject(TYPES.DBDataSource) private readonly _source: AppDataSource) {}

  async check(): Promise<HealthCheckResult> {
    let healthy = true;
    let _error;
    try {
      await this._source.dataSource.query('SELECT 1');
      healthy = true;
    } catch (error) {
      _error = error;
      healthy = false;
    }

    return {
      name: 'DB',
      status: healthy ? 'up' : 'down',
      error: (_error as Error)?.message ?? 'unknown',
    };
  }
}

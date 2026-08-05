import { KafkaClient } from '@/infrastructure/kafka';
import { TYPES } from '@/shared/constants/identifiers';
import { HealthCheckResult, IHealthCheck } from '@edulearn/core';
import { inject, injectable } from 'inversify';

@injectable()
export class KafkaHealthCheck implements IHealthCheck {
  constructor(@inject(TYPES.KafkaClient) private readonly _kafka: KafkaClient) {}

  async check(): Promise<HealthCheckResult> {
    const result = await this._kafka.healthCheck();
    const healthy = result.status === 'healthy';

    return {
      name: 'kafka',
      status: healthy ? 'up' : 'down',
      error: result.details?.error ?? 'unknown',
    };
  }
}

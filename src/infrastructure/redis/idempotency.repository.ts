import { ICacheService } from '@/application/adaptors/cache.service';
import { IIdempotencyRepository } from '@/domain/repository/idempotency.repository';
import { TYPES } from '@/shared/constants/identifiers';
import { inject, injectable } from 'inversify';
import Redis from 'ioredis';

@injectable()
export class RedisIdempotencyRepository implements IIdempotencyRepository {
  private readonly redis: Redis;
  constructor(@inject(TYPES.ICacheService) private readonly cacheService: ICacheService) {
    this.redis = this.cacheService.getClient();
  }

  private buildKey(key: string) {
    return `idmp:${key}`;
  }

  async saveProcessed(idempotencyKey: string, entityId: string): Promise<boolean> {
    const redisKey = this.buildKey(idempotencyKey);

    const result = await this.redis.set(
      redisKey,
      entityId,
      'NX' as any,
      'EX' as any,
      (60 * 60 * 24) as any, // 24 hours
    );

    return result === 'OK';
  }

  async findByIdempotency(idempotencyKey: string) {
    const redisKey = this.buildKey(idempotencyKey);

    const entityId = await this.redis.get(redisKey);

    if (!entityId) return null;

    return {
      idempotencyKey,
      entityId,
    };
  }
}

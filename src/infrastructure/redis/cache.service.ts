import { getEnvs } from '@/shared/utils/getEnv';
import { ICacheService } from '@/application/adaptors/cache.service';
import { RedisClient } from '@edulearn/core';
import { injectable } from 'inversify';

const {
  REDIS_DB,
  REDIS_HOST,
  REDIS_KEY_PREFIX,
  REDIS_PORT,
  REDIS_LAZY_CONNECT,
  REDIS_MAX_RETRIES,
} = getEnvs({
  REDIS_PORT: 6379,
  REDIS_HOST: 'localhost',
  REDIS_DB: 1,
  REDIS_KEY_PREFIX: 'edulearn:auth:',
  REDIS_LAZY_CONNECT: 'true',
  REDIS_MAX_RETRIES: 3,
  REDIS_PASSWORD: '',
});

@injectable()
export class RedisCacheService extends RedisClient implements ICacheService {
  public constructor() {
    super({
      db: Number(REDIS_DB),
      host: String(REDIS_HOST),
      keyPrefix: String(REDIS_KEY_PREFIX),
      port: Number(REDIS_PORT),
      lazyConnect: REDIS_LAZY_CONNECT === 'true',
      maxRetriesPerRequest: Number(REDIS_MAX_RETRIES),
    });
  }

  public async keys(pattern: string): Promise<string[]> {
    try {
      return await this.getClient().keys(pattern);
    } catch (error) {
      console.error(`Cache keys failed for pattern ${pattern}`, { error });
    }
    return [];
  }
}

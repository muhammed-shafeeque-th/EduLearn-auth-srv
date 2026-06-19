import { ICacheService } from '@/application/adaptors/cache.service';

export function createMockCacheService(): jest.Mocked<ICacheService> {
  return {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    getMultiple: jest.fn(),
    setMultiple: jest.fn(),
    keys: jest.fn(),
    flush: jest.fn(),
    incrBy: jest.fn(),
    decrBy: jest.fn(),
    getTTL: jest.fn(),
    getClient: jest.fn(),
  } as unknown as jest.Mocked<ICacheService>;
}

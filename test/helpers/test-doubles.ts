import { createMockLogger } from '../mocks/logger.mock';
import { createMockTracer } from '../mocks/tracer.mock';

export { createMockLogger, createMockSpan } from '../mocks/logger.mock';
export { createMockTracer } from '../mocks/tracer.mock';
export { createMockUserRepository } from '../mocks/user-repository.mock';
export { createMockCacheService } from '../mocks/cache.mock';
export { createMockMetricService } from '../mocks/metric.mock';
export { createMockHashService } from '../mocks/hash.mock';
export { createMockUuidService } from '../mocks/uuid.mock';
export { createMockTokenService } from '../mocks/token.mock';
export { createMockEventPublisher } from '../mocks/event-publisher.mock';
export { createMockRefreshTokenRepository } from '../mocks/refresh-token-repository.mock';
export { createMockResetTokenRepository } from '../mocks/reset-token-repository.mock';
export { createMockAuthProviderContext } from '../mocks/auth-provider.mock';
export { createMockTemplateRenderer } from '../mocks/template-renderer.mock';

export function createObservabilityMocks() {
  return {
    tracer: createMockTracer(),
    logger: createMockLogger(),
  };
}

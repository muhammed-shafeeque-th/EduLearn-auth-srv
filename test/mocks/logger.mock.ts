import { ILoggerService } from '@/application/adaptors/logger.service';

import { Span } from '@opentelemetry/api';

export function createMockSpan(): Span {
  return {
    setAttributes: jest.fn(),
    setAttribute: jest.fn(),
    end: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
  } as unknown as Span;
}

export function createMockLogger(): ILoggerService {
  return {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    shutdown: jest.fn().mockResolvedValue(undefined),
  };
}

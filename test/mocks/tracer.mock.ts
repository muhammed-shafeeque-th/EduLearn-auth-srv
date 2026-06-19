import { ITraceService } from '@/application/adaptors/trace.service';
import { createMockSpan } from './logger.mock';

export function createMockTracer(): ITraceService {
  const span = createMockSpan();
  return {
    startActiveSpan: jest.fn((_name, fn) => fn(span)) as ITraceService['startActiveSpan'],
    startSpan: jest.fn(() => span),
    endSpan: jest.fn(),
    recordException: jest.fn(),
    setStatus: jest.fn(),
    setAttribute: jest.fn(),
    getCurrentSpan: jest.fn(),
  };
}

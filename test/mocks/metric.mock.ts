import { IMetricService } from '@/application/adaptors/metric.service';

export function createMockMetricService(): jest.Mocked<IMetricService> {
  return {
    measureDBOperationDuration: jest.fn(() => jest.fn()),
    measureRequestDuration: jest.fn(() => jest.fn()),
    incrementRequestCounter: jest.fn(),
    incrementDBRequestCounter: jest.fn(),
    incrementErrorCounter: jest.fn(),
    getMetrics: jest.fn().mockResolvedValue(''),
  } as unknown as jest.Mocked<IMetricService>;
}

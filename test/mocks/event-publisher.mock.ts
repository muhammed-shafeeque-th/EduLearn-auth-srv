import IEventPublisher from '@/application/adaptors/event-publisher.service';

export function createMockEventPublisher(): jest.Mocked<IEventPublisher> {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
    publishBatch: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<IEventPublisher>;
}

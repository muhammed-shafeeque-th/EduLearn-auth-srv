import IEventPublisher from '@/application/services/event-publisher.service';
import { KafkaPublisher } from '../kafka/kafka.publisher';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import { KafkaManager } from '../kafka';

@injectable()
export class EventPublisherService implements IEventPublisher {
  private kafkaPublisher: KafkaPublisher;

  public constructor(@inject(TYPES.KafkaManager) private readonly kafkaManager: KafkaManager) {}

  public async publish<T>(
    topic: string,
    data: T,
    key?: any,
    headers?: Record<string, string>,
    options?: {
      schemaOptions?: { keySchema?: string; valueSchema?: string };
      timeout?: number;
    },
  ): Promise<void> {
    this.initPublisher();

    await this.kafkaPublisher.send(topic, data, key, headers, options);
  }

  public async publishBatch<T>(
    topic: string,
    messages: Array<{
      data: T;
      key?: any;
      headers?: Record<string, string>;
    }>,
    options?: {
      schemaOptions?: { keySchema?: string; valueSchema?: string };
      timeout?: number;
    },
  ): Promise<void> {
    this.initPublisher();

    await this.kafkaPublisher.sendBatch(topic, messages, options);
  }

  // Lazy initialization
  private initPublisher(): void {
    if (!this.kafkaPublisher) {
      this.kafkaPublisher = this.kafkaManager.getPublisher();
    }
  }
}

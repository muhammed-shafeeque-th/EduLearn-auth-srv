import IEventPublisher from '@/application/adaptors/event-publisher.service';
import { KafkaPublisher } from '../kafka/kafka.publisher';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';

@injectable()
export class EventPublisherService implements IEventPublisher {
  public constructor(
    @inject(TYPES.KafkaPublisher) private readonly kafkaPublisher: KafkaPublisher,
  ) {}

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
    // this.initPublisher();

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
    // this.initPublisher();

    await this.kafkaPublisher.sendBatch(topic, messages, options);
  }

  // Lazy initialization
  // private initPublisher(): void {
  //   if (!this.kafkaPublisher) {
  //     this.kafkaPublisher = this.kafkaPublisher.getPublisher();
  //   }
  // }
}

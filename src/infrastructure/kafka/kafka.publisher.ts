import { injectable } from 'inversify';
import { LoggingService } from '../observability/logging/logging.service';
import { KafkaClient } from './kafka.client';

@injectable()
export class KafkaPublisher {
  private readonly logger = LoggingService.getInstance();
  private static instance: KafkaPublisher;

  private constructor(private readonly kafkaClient: KafkaClient) {}

  public static getInstance(kafkaClient: KafkaClient): KafkaPublisher {
    if (!KafkaPublisher.instance) {
      if (!kafkaClient) {
        throw new Error('config is required for KafkaPublisher initialization');
      }

      KafkaPublisher.instance = new KafkaPublisher(kafkaClient);
    }
    return KafkaPublisher.instance;
  }

  async emit<T>(
    topic: string,
    data: T,
    key?: any,
    headers?: Record<string, string>,
    options?: {
      schemaOptions?: { keySchema?: string; valueSchema?: string };
      timeout?: number;
    },
  ): Promise<void> {
    const emitOperation = async () => {
      await this.kafkaClient.publish(topic, data, key, headers, options?.schemaOptions);
    };

    if (options?.timeout) {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Publish timeout error')), options.timeout);
      });

      await Promise.race([emitOperation(), timeoutPromise]);
    } else {
      await emitOperation();
    }

    this.logger.debug(`Event emitted to topic: ${topic}`, {
      dataType: typeof data,
      hasKey: !!key,
      hasHeaders: !!headers,
      hasSchema: !!options?.schemaOptions,
    });
  }

  // Batch emit for better performance
  async sendBatch<T>(
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
    const batchPromises = messages.map((msg) =>
      this.emit(topic, msg.data, msg.key, msg.headers, {
        schemaOptions: options?.schemaOptions,
        timeout: options?.timeout,
      }),
    );

    await Promise.all(batchPromises);
    this.logger.info(`Batch of ${messages.length} events emitted to topic: ${topic}`);
  }

  // Send with acknowledgment
  async send<T>(
    topic: string,
    data: T,
    key?: any,
    headers?: Record<string, string>,
    options?: {
      schemaOptions?: { keySchema?: string; valueSchema?: string };
      timeout?: number;
    },
  ): Promise<void> {
    return this.emit(topic, data, key, headers, options);
  }
}

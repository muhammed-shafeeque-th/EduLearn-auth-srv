import { inject, injectable } from 'inversify';
import { KafkaClient } from './kafka.client';
import { TYPES } from '@/shared/constants/identifiers';
import { ILoggerService } from '@/application/adaptors/logger.service';

@injectable()
export class KafkaPublisher {
  public constructor(
    @inject(TYPES.KafkaClient) private readonly kafkaClient: KafkaClient,
    @inject(TYPES.LoggerService) private readonly _logger: ILoggerService,
  ) {}

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

    this._logger.debug(`Event emitted to topic: ${topic}`, {
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
    this._logger.debug(`Batch of ${messages.length} events emitted to topic: ${topic}`);
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

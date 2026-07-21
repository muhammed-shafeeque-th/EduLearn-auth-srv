import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import { KafkaClient } from '@/infrastructure/kafka';
import { ILoggerService } from '@/application/adaptors/logger.service';
import { EventConsumerController } from './event.consumer.controller';

@injectable()
export class KafkaAppServer {
  private isInitialized = false;

  public constructor(
    @inject(TYPES.LoggerService) private readonly _logger: ILoggerService,
    @inject(TYPES.KafkaClient) private readonly kafkaClient: KafkaClient,
    @inject(TYPES.IEventConsumerController)
    private readonly consumerHandlers: EventConsumerController,
  ) {
    // this._initializeHandlers([consumerHandlers]);
  }

  public initialize(): void {
    this._initializeHandlers([this.consumerHandlers]);
  }

  private async _initializeHandlers(eventHandlerInstances: unknown[] = []): Promise<void> {
    if (this.isInitialized) {
      this._logger.warn('KafkaAppServer already initialized');
      return;
    }

    try {
      await this.kafkaClient.connect();

      if (eventHandlerInstances.length > 0) {
        this.kafkaClient.registerEventHandlers(eventHandlerInstances);
        await this.kafkaClient.startConsumers();
      }

      this.isInitialized = true;
      this._logger.info('KafkaAppServer initialized successfully');
    } catch (error) {
      this._logger.error('Failed to initialize KafkaAppServer', { error });
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.kafkaClient.disconnect();
      this.isInitialized = false;
      this._logger.info('KafkaAppServer shut down successfully');
    } catch (error) {
      this._logger.error('Error during KafkaAppServer shutdown', { error });
      throw error;
    }
  }
}

import { LoggingService } from '../observability/logging/logging.service';
import { KafkaClient } from './kafka.client';
import { KafkaPublisher } from './kafka.publisher';
import { KafkaConfig } from './kafka.types';

export class KafkaManager {
  private readonly logger = LoggingService.getInstance();
  private client: KafkaClient;
  private publisher: KafkaPublisher;
  private isInitialized = false;
  private static instance: KafkaManager;

  private constructor(private readonly config: KafkaConfig) {
    this.client = KafkaClient.getInstance(config);
    this.publisher = KafkaPublisher.getInstance(this.client);
  }

  async initializeHandlers(eventHandlerInstances: any[] = []): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('KafkaManager already initialized');
      return;
    }

    try {
      await this.client.connect();

      if (eventHandlerInstances.length > 0) {
        this.client.registerEventHandlers(eventHandlerInstances);
        await this.client.startConsumers();
      }

      this.isInitialized = true;
      this.logger.info('KafkaManager initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize KafkaManager', { error });
      throw error;
    }
  }

  public static getInstance(config?: KafkaConfig): KafkaManager {
    if (!KafkaManager.instance) {
      if (!config) {
        throw new Error('config is required for KafkaManager initialization');
      }

      KafkaManager.instance = new KafkaManager(config);
    }
    return KafkaManager.instance;
  }

  async shutdown(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await this.client.disconnect();
      this.isInitialized = false;
      this.logger.info('KafkaManager shut down successfully');
    } catch (error) {
      this.logger.error('Error during KafkaManager shutdown', { error });
      throw error;
    }
  }

  getPublisher(): KafkaPublisher {
    if (!this.isInitialized) {
      throw new Error('KafkaManager not initialized. Call initialize() first.');
    }
    return this.publisher;
  }

  getClient(): KafkaClient {
    if (!this.isInitialized) {
      throw new Error('KafkaManager not initialized. Call initialize() first.');
    }
    return this.client;
  }
}

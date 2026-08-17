import {
  Kafka,
  Producer,
  Consumer,
  EachMessagePayload,
  KafkaConfig as KConfig,
  logLevel,
} from 'kafkajs';
import { SchemaRegistry, SchemaType } from '@kafkajs/confluent-schema-registry';
import { KafkaConfig, DeserializedMessage, EventPatternMetadata } from './kafka.types';

import { getEventPatterns } from './decorators.kafka';
import { inject, injectable } from 'inversify';
import { TYPES } from '@/shared/constants/identifiers';
import { ILoggerService } from '@/application/adaptors/logger.service';

@injectable()
export class KafkaClient {
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private schemaRegistry: SchemaRegistry | null = null;
  private isProducerConnected = false;
  private isConsumerConnected = false;
  private eventHandlers = new Map<string, EventPatternMetadata[]>();

  public constructor(
    @inject(TYPES.LoggerService) private readonly _logger: ILoggerService,
    @inject(TYPES.KafkaConfigs) private readonly config: KafkaConfig,
  ) {
    this.kafka = new Kafka({
      ...(this.config.client as KConfig),
      logLevel: logLevel.ERROR, // Reduce noise in logs
      retry: {
        initialRetryTime: 100,
        retries: 8,
        factor: 2,
        maxRetryTime: 30000,
        restartOnFailure: async (e) => {
          this._logger.error('Kafka client restart on failure', { error: e });
          return true;
        },
      },
    });
    this.producer = this.kafka.producer(this.config.producer);
    this.consumer = this.kafka.consumer(this.config.consumer);

    if (this.config.schemaRegistry) {
      this.schemaRegistry = new SchemaRegistry({
        host: this.config.schemaRegistry.host,
        auth: this.config.schemaRegistry.auth,
      });
    }
  }

  // async connect(): Promise<void> {
  //   await Promise.all([this.connectProducer(), this.connectConsumer()]);
  // }

  public async connect(): Promise<void> {
    try {
      this._logger.info('Connecting Kafka...', {
        brokers: this.config.client.brokers,
        clientId: this.config.client.clientId,
      });

      await this.connectProducer();
      await this.connectConsumer();

      this._logger.info('Kafka producer and consumer connected successfully');
    } catch (error) {
      this.isProducerConnected = false;
      this.isConsumerConnected = false;

      try {
        await this.disconnect();
      } catch (disconnectError) {
        this._logger.error('Failed to cleanup Kafka connections', {
          error: disconnectError,
        });
      }

      throw error;
    }
  }

  private async connectProducer(): Promise<void> {
    try {
      this._logger.info('Producer trying to connect', {
        brokers: this.config.client.brokers,
        clientId: this.config.client.clientId,
      });
      await this.producer.connect();
      this.isProducerConnected = true;
      this._logger.info('Producer connected successfully', {
        brokers: this.config.client.brokers,
        clientId: this.config.client.clientId,
      });
    } catch (error) {
      this._logger.error('Failed to connect producer', {
        brokers: this.config.client.brokers,
        error,
      });
      throw error;
    }
  }

  private async connectConsumer(): Promise<void> {
    try {
      await this.consumer.connect();
      this.isConsumerConnected = true;
      this._logger.info('Consumer connected successfully');
    } catch (error) {
      this._logger.error('Failed to connect consumer', { error });
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.isProducerConnected) {
      promises.push(this.producer.disconnect());
    }

    if (this.isConsumerConnected) {
      promises.push(this.consumer.disconnect());
    }

    await Promise.all(promises);
    this._logger.info('Kafka client disconnected');
  }

  public registerEventHandlers(instances: any[]): void {
    for (const instance of instances) {
      this.registerInstance(instance);
    }
  }

  private registerInstance(instance: any): void {
    const patterns = getEventPatterns(instance);

    for (const patternMetadata of patterns) {
      const { pattern } = patternMetadata;

      if (!this.eventHandlers.has(pattern.topic)) {
        this.eventHandlers.set(pattern.topic, []);
      }

      // Bind the handler to the instance
      const boundHandler = patternMetadata.handler.bind(instance);
      const boundMetadata = {
        ...patternMetadata,
        handler: boundHandler,
      };

      this.eventHandlers.get(pattern.topic)!.push(boundMetadata);
      this._logger.info(`Registered handler for topic: ${pattern.topic}`);
    }
  }

  async startConsumers(): Promise<void> {
    const topics = Array.from(this.eventHandlers.keys());

    if (topics.length === 0) {
      this._logger.warn('No event handlers registered');
      return;
    }

    // await this.consumer.subscribe({ topics });

    // const runConfig: ConsumerRunConfig = {
    //   eachMessage: async (payload: EachMessagePayload) => {
    //     await this.processMessage(payload);
    //   },
    // };

    // await this.consumer.run(runConfig);
    // this._logger.info(`Started consuming topics: ${topics.join(', ')}`);

    // compute per-topic fromBeginning
    const topicPrefs = new Map<string, boolean>();
    for (const [topic, metas] of this.eventHandlers.entries()) {
      topicPrefs.set(
        topic,
        metas.some((m) => m.pattern.fromBeginning),
      );
    }

    // KafkaJS expects one subscribe per topic
    for (const topic of topics) {
      await this.consumer.subscribe({
        topic,
        fromBeginning: !!topicPrefs.get(topic),
      });
    }

    await this.consumer.run({
      eachMessage: async (payload) => this.processMessage(payload),
    });

    this._logger.info(`Started consuming topics: ${topics.join(', ')}`);
  }

  private async processMessage(payload: EachMessagePayload): Promise<void> {
    const handlers = this.eventHandlers.get(payload.topic) || [];

    for (const handlerMetadata of handlers) {
      try {
        // Apply partition filtering if specified
        if (
          handlerMetadata.pattern.partition !== undefined &&
          payload.partition !== handlerMetadata.pattern.partition
        ) {
          continue;
        }

        const deserializedMessage = await this.deserializeMessage(payload);
        await handlerMetadata.handler(deserializedMessage.value, deserializedMessage);

        this._logger.debug(`Successfully processed message for topic: ${payload.topic}`);
      } catch (error) {
        this._logger.error(`Error processing message for topic ${payload.topic}`, { error });
        // Could implement dead letter queue or retry logic here
      }
    }
  }
  private safeParse(buf?: Buffer | null) {
    if (!buf) return null;
    const s = buf.toString();
    try {
      return JSON.parse(s);
    } catch {
      return s;
    } // fall back to raw string
  }

  private async deserializeMessage(payload: EachMessagePayload): Promise<DeserializedMessage> {
    let key = null;
    let value = null;

    // Deserialize key
    if (payload.message.key) {
      if (this.schemaRegistry) {
        try {
          key = await this.schemaRegistry.decode(payload.message.key);
        } catch (error) {
          this._logger.warn(
            'Failed to deserialize key with schema registry, falling back to JSON',
            {
              error,
            },
          );
          key = this.safeParse(payload.message.key);
        }
      } else {
        key = this.safeParse(payload.message.key);
      }
    }

    // Deserialize value
    if (payload.message.value) {
      if (this.schemaRegistry) {
        try {
          value = await this.schemaRegistry.decode(payload.message.value);
        } catch (error) {
          this._logger.warn(
            'Failed to deserialize value with schema registry, falling back to JSON',
            { error },
          );
          value = this.safeParse(payload.message.value);
        }
      } else {
        value = this.safeParse(payload.message.value);
      }
    }

    return {
      key,
      value,
      headers: this.deserializeHeaders(payload.message.headers as Record<string, Buffer>),
      topic: payload.topic,
      partition: payload.partition,
      offset: payload.message.offset,
      timestamp: payload.message.timestamp,
    };
  }

  private deserializeHeaders(
    headers?: Record<string, Buffer>,
  ): Record<string, string | Buffer> | undefined {
    if (!headers) return undefined;

    const deserializedHeaders: Record<string, string | Buffer> = {};
    for (const [key, value] of Object.entries(headers)) {
      if (value === null || value === undefined) continue;
      deserializedHeaders[key] = Buffer.isBuffer(value) ? value.toString() : String(value);
    }
    return deserializedHeaders;
  }

  async publish(
    topic: string,
    message: any,
    key?: any,
    headers?: Record<string, string>,
    schemaOptions?: { keySchema?: string; valueSchema?: string },
  ): Promise<void> {
    if (!this.isProducerConnected) {
      throw new Error('Producer is not connected');
    }

    try {
      let serializedKey: Buffer | null = null;
      let serializedValue: Buffer | null = null;

      // Serialize key
      if (key !== undefined) {
        if (this.schemaRegistry && schemaOptions?.keySchema) {
          const keySchemaId = await this.getSchemaId(schemaOptions.keySchema);
          serializedKey = await this.schemaRegistry.encode(keySchemaId, key);
        } else {
          serializedKey = Buffer.from(JSON.stringify(key));
        }
      }

      // Serialize value
      if (this.schemaRegistry && schemaOptions?.valueSchema) {
        const valueSchemaId = await this.getSchemaId(schemaOptions.valueSchema);
        serializedValue = await this.schemaRegistry.encode(valueSchemaId, message);
      } else {
        serializedValue = Buffer.from(JSON.stringify(message));
      }

      await this.producer.send({
        topic,
        // acks: -1,
        messages: [
          {
            key: serializedKey,
            value: serializedValue,
            headers: headers ? this.serializeHeaders(headers) : undefined,
          },
        ],
      });

      this._logger.debug(`Message published to topic: ${topic}`);
    } catch (error) {
      this._logger.error(`Failed to publish message to topic ${topic}`, { error });
      throw error;
    }
  }

  private async getSchemaId(schemaSubject: string): Promise<number> {
    if (!this.schemaRegistry) {
      throw new Error('Schema registry not configured');
    }

    try {
      const id = await this.schemaRegistry.getLatestSchemaId(schemaSubject);
      return id;
    } catch (error) {
      this._logger.error(`Failed to get schema ID for subject: ${schemaSubject}`, { error });
      throw error;
    }
  }

  private serializeHeaders(headers: Record<string, string>): Record<string, Buffer> {
    const serializedHeaders: Record<string, Buffer> = {};
    for (const [key, value] of Object.entries(headers)) {
      serializedHeaders[key] = Buffer.from(value);
    }
    return serializedHeaders;
  }

  async registerSchema(
    subject: string,
    schema: string,
    schemaType: SchemaType = SchemaType.AVRO,
  ): Promise<number> {
    if (!this.schemaRegistry) {
      throw new Error('Schema registry not configured');
    }

    try {
      const { id } = await this.schemaRegistry.register(
        { type: schemaType as unknown as any, schema },
        { subject },
      );
      this._logger.info(`Schema registered for subject: ${subject} with ID: ${id}`);
      return id;
    } catch (error) {
      this._logger.error(`Failed to register schema for subject: ${subject}`, { error });
      throw error;
    }
  }
  /**
  // Health check method
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadataTopics = await admin.fetchTopicMetadata();
      const metadata = await admin.fetchTopicMetadata();
      const clusterInfo = await admin.describeCluster();

      await admin.disconnect();

      return {
        status: 'healthy',
        details: {
          brokers: metadataTopics.topics.length,
          topics: metadata.topics.length,
          clusterId: clusterInfo.clusterId,
          // metrics: this.metrics.getMetrics()
        },
      };
    } catch (error: any) {
      return {
        status: 'unhealthy',
        details: { error: error.message },
      };
    }
  }
   */

  // Health check method
  public async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: { error?: string };
  }> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();
      await admin.disconnect();

      return {
        status: 'healthy',
        details: {},
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return {
        status: 'unhealthy',
        details: { error: errorMessage },
      };
    }
  }
}

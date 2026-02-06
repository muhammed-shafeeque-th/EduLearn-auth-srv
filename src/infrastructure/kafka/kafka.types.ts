import { CompressionTypes } from 'kafkajs';

export interface KafkaConfig {
  client: {
    clientId: string;
    brokers: string[];
    ssl?: boolean;
    sasl?: {
      mechanism: 'plain' | 'scram-sha-256' | 'scram-sha-512';
      username: string;
      password: string;
    };
  };
  consumer: {
    groupId: string;
    sessionTimeout?: number;
    rebalanceTimeout?: number;
    heartbeatInterval?: number;
    maxBytesPerPartition?: number;
    minBytes?: number;
    maxBytes?: number;
    maxWaitTimeInMs?: number;
    fetchMinBytes?: number;
    fetchMaxWaitMs?: number;
    autoCommit?: boolean;
    autoCommitInterval?: number;
    retry?: {
      initialRetryTime: number; // 100ms initial delay
      retries: number; // Maximum 10 retries
      factor: number; // Exponential factor (100ms, 200ms, 400ms...)
      maxRetryTime: number; // Cap at 30 seconds
    };
  };
  producer?: {
    maxInFlightRequests?: number;
    idempotent?: boolean;
    transactionTimeout?: number;
    batchSize: number;
    lingerMs: number;
    compressionType: CompressionTypes;
    retry?: {
      initialRetryTime: number; // 100ms initial delay
      retries: number; // Maximum 10 retries
      factor: number; // Exponential factor (100ms, 200ms, 400ms...)
      maxRetryTime: number; // Cap at 30 seconds
    };
  };
  schemaRegistry?: {
    host: string;
    auth?: {
      username: string;
      password: string;
    };
  };
}
export interface EventPattern<T = any> {
  topic: string;
  partition?: number;
  fromBeginning?: boolean;
  schemaType?: new () => T;
  timeout?: number;
  retryConfig?: {
    maxRetries: number;
    backoffFactor: number;
    initialDelay: number;
    jitter: boolean;
  };
  schema?: {
    key?: string;
    value?: string;
  };
}

export interface DeserializedMessage<T = any> {
  key: any;
  value: T;
  headers?: Record<string, string | Buffer>;
  topic: string;
  partition: number;
  offset: string;
  timestamp: string;
}

export type EventHandler<T = any> = (
  data: T,
  context: DeserializedMessage<T>,
) => Promise<void> | void;

export interface EventPatternMetadata {
  pattern: EventPattern;
  handler: EventHandler;
  target: any;
  propertyName: string;
}

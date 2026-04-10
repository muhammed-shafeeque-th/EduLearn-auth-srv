import { CompressionTypes } from 'kafkajs';

export * from './decorators.kafka';
export * from './kafka.client';
export * from './kafka.manager';
export * from './kafka.publisher';
import * as kafkaTypes from './kafka.types';
import { getEnvs } from '@/shared/utils/getEnv';
export { kafkaTypes };

const { KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_CONSUMER_GROUP, NODE_ENV } = getEnvs({
  KAFKA_CLIENT_ID: 'auth-service',
  KAFKA_BROKERS: 'kafka:9092',
  NODE_ENV: 'development',
  KAFKA_USERNAME: { required: false },
  KAFKA_PASSWORD: { required: false },
  KAFKA_CONSUMER_GROUP: 'auth-service-group',
  SCHEMA_REGISTRY_URL: { required: false },
  SCHEMA_REGISTRY_PASSWORD: { required: false },
  SCHEMA_REGISTRY_USERNAME: { required: false },
});

export const defaultConfig: kafkaTypes.KafkaConfig = {
  client: {
    clientId: KAFKA_CLIENT_ID,
    brokers: KAFKA_BROKERS?.toString().split(','),
    ssl: NODE_ENV === 'production',
    sasl: process.env.KAFKA_USERNAME
      ? {
          mechanism: 'scram-sha-256',
          username: process.env.KAFKA_USERNAME,
          password: process.env.KAFKA_PASSWORD,
        }
      : undefined,
    connectionTimeout: 10000,
    requestTimeout: 30000,
  } as kafkaTypes.KafkaConfig['client'],
  consumer: {
    groupId: KAFKA_CONSUMER_GROUP,
    sessionTimeout: 30000,
    rebalanceTimeout: 60000,
    heartbeatInterval: 3000,
    maxBytesPerPartition: 1048576,
    fetchMinBytes: 1024,
    fetchMaxWaitMs: 500,
    autoCommit: true,
    autoCommitInterval: 5000,
    retry: {
      initialRetryTime: 100,
      retries: 10,
      factor: 2,
      maxRetryTime: 30000,
    },
  },
  producer: {
    maxInFlightRequests: 1,
    idempotent: true,
    batchSize: 16384,
    lingerMs: 5,
    compressionType: CompressionTypes.Snappy,
    retry: {
      initialRetryTime: 100,
      retries: 10,
      factor: 2,
      maxRetryTime: 30000,
    },
  },
  schemaRegistry: process.env.SCHEMA_REGISTRY_URL
    ? {
        host: process.env.SCHEMA_REGISTRY_URL,
        auth: process.env.SCHEMA_REGISTRY_USERNAME
          ? {
              username: process.env.SCHEMA_REGISTRY_USERNAME,
              password: process.env.SCHEMA_REGISTRY_PASSWORD,
            }
          : undefined,
      }
    : undefined,
  // deadLetterQueue: {
  //   enabled: true,
  //   topic: 'dead-letter-queue',
  //   maxRetries: 3,
  // },
  // circuitBreaker: {
  //   enabled: true,
  //   failureThreshold: 5,
  //   recoveryTimeout: 60000,
  // },
  // batching: {
  //   enabled: true,
  //   maxBatchSize: 100,
  //   maxWaitTime: 10,
  // },
} as kafkaTypes.KafkaConfig;

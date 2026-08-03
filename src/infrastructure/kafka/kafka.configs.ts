import { CompressionTypes } from 'kafkajs';

import * as kafkaTypes from './kafka.types';
import { getEnvs } from '@/shared/utils/getEnv';

const { KAFKA_BROKER, KAFKA_CLIENT_ID, KAFKA_SASL_ENABLED, KAFKA_CONSUMER_GROUP } = getEnvs({
  KAFKA_CLIENT_ID: 'auth-service',
  KAFKA_BROKER: 'kafka:9092',
  NODE_ENV: 'development',
  KAFKA_SASL_ENABLED: 'false',
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
    brokers: KAFKA_BROKER?.toString().split(','),
    ssl: KAFKA_SASL_ENABLED === 'true',
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

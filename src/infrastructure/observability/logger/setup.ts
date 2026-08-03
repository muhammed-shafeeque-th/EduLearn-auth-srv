import { createLogger, getEnvs, shutdownLogger } from '@edulearn/core';

const { SERVICE_NAME, NODE_ENV, LOG_LEVEL } = getEnvs({
  SERVICE_NAME: 'auth-service ',
  NODE_ENV: 'development',
  LOG_LEVEL: 'info',
});

const logger = createLogger({
  level: LOG_LEVEL.toString(),
  serviceName: SERVICE_NAME.toString(),
  environment: NODE_ENV.toString(),
});

process.on('SIGINT', () => shutdownLogger(logger));
process.on('SIGTERM', () => shutdownLogger(logger));

export { logger };

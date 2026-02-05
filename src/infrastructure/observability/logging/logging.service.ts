import { context, trace } from '@opentelemetry/api';
import { logger, shutdownLogger } from './setup';
import { getEnvs } from '@/shared/utils/getEnv';

const { SERVICE_NAME, NODE_ENV } = getEnvs({
  SERVICE_NAME: 'UserService',
  NODE_ENV: 'development',
});

interface LogContext {
  traceId?: string;
  spanId?: string;
  userId?: string;
  correlationId?: string;
  service?: string;
  environment?: string;
  ctx?: string;

  [key: string]: unknown;
}

export class LoggingService {
  private readonly serviceName: string;
  private readonly ctx?: string;
  public static instance: LoggingService;

  private constructor(context?: string) {
    this.serviceName = SERVICE_NAME.toString();
    this.ctx = context;
  }

  public static getInstance(context?: string): LoggingService {
    if (!LoggingService.instance) {
      LoggingService.instance = new LoggingService(context);
    }
    return LoggingService.instance;
  }

  private buildLogEntry(level: string, message: string, logContext?: LogContext) {
    const activeSpan = trace.getSpan(context.active());
    const spanContext = activeSpan?.spanContext();

    return {
      ...logContext,
      level,
      message,

      traceId: spanContext?.traceId,
      spanId: spanContext?.spanId,

      userId: logContext?.userId,
      correlationId: logContext?.correlationId,
      service: logContext?.service || this.serviceName,
      environment: NODE_ENV.toString(),
      caller: NODE_ENV.toString() !== 'production' ? this.getCaller() + ' ' : undefined,

      ctx: this.ctx,
    };
  }

  info(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry('info', message, context);
    logger.info(message, logEntry);
  }

  error(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry('error', message, context);
    logger.error(message, logEntry);
  }

  warn(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry('warn', message, context);
    logger.warn(message, logEntry);
  }

  debug(message: string, context?: LogContext): void {
    const logEntry = this.buildLogEntry('debug', message, context);
    logger.debug(message, logEntry);
  }

  async shutdown(): Promise<void> {
    await shutdownLogger();
  }

  private getCaller(): string | undefined {
    const stack = new Error().stack;
    if (!stack) return undefined;
    const stackLines = stack.split('\n').map((line) => line.trim());

    for (const line of stackLines) {
      if (
        line &&
        !line.includes('logging.service.ts') &&
        (line.startsWith('at ') || line.match(/\(([^)]+)\)/))
      ) {
        const match = line.match(/\(([^)]+)\)/) || line.match(/at (.+)/);
        return match ? match[1] : undefined;
      }
    }
    return undefined;
  }
}

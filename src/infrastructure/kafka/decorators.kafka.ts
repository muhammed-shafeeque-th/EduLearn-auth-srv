import { withRetry } from '@/shared/utils/retry';
import type { DeserializedMessage, EventPattern, EventPatternMetadata } from './kafka.types';
import { validateDto } from '@/shared/utils/validator';

const EVENT_PATTERN_METADATA_KEY = Symbol('event-pattern');

export function EventPattern<T = any>(pattern: EventPattern | string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const eventPattern: EventPattern = typeof pattern === 'string' ? { topic: pattern } : pattern;

    const originalHandler = descriptor.value;

    descriptor.value = async function (data: T, context: DeserializedMessage<T>) {
      const handlerFn = async () => {
        if (eventPattern.schemaType) {
          await validateDto(eventPattern.schemaType, data as any);
        }

        return originalHandler.call(this, data, context);
      };

      if (eventPattern.timeout) {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Handler timeout')), eventPattern.timeout),
        );

        return Promise.race([runHandlerWithRetry(), timeoutPromise]);
      }

      async function runHandlerWithRetry() {
        if (eventPattern.retryConfig) {
          return withRetry(handlerFn, {
            maxAttempts: eventPattern.retryConfig.maxRetries,
            backoffFactor: eventPattern.retryConfig.backoffFactor,
            initialDelay: eventPattern.retryConfig.initialDelay,
            jitter: eventPattern.retryConfig.jitter,
          });
        }
        return handlerFn();
      }

      return runHandlerWithRetry();
    };

    const existingPatterns =
      Reflect.getMetadata(EVENT_PATTERN_METADATA_KEY, target.constructor) || [];
    existingPatterns.push({
      pattern: eventPattern,
      handler: descriptor.value,
      target,
      propertyName,
    });

    Reflect.defineMetadata(EVENT_PATTERN_METADATA_KEY, existingPatterns, target.constructor);
  };
}

export function getEventPatterns(target: any): EventPatternMetadata[] {
  return Reflect.getMetadata(EVENT_PATTERN_METADATA_KEY, target.constructor) || [];
}

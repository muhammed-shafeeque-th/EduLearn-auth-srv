import { getEnvs } from '@/shared/utils/getEnv';
import {
  Span,
  Tracer,
  trace,
  context,
  Attributes,
  SpanStatusCode,
  Context,
} from '@opentelemetry/api';

const { SERVICE_NAME } = getEnvs({ SERVICE_NAME: 'user-service' });

export class TracingService {
  private static instance: TracingService;
  private tracer: Tracer;

  private constructor() {
    this.tracer = trace.getTracer(SERVICE_NAME.toString());
  }

  public static getInstance() {
    if (!TracingService.instance) {
      TracingService.instance = new TracingService();
    }
    return TracingService.instance;
  }

  startActiveSpan<T>(
    name: string,
    fn: (span: Span) => T | Promise<T>,
    attributes?: Attributes,
  ): T | Promise<T> {
    return this.tracer.startActiveSpan(name, (span) => {
      if (attributes) {
        span.setAttributes(attributes);
      }
      try {
        const result = fn(span);
        if (result instanceof Promise) {
          return result
            .then((res) => {
              span.setStatus({
                code: SpanStatusCode.OK,
                message: 'Operation has been successful',
              });
              return res;
            })
            .catch((error) => {
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message || 'Operation failed',
              });
              throw error;
            })
            .finally(() => {
              span.end();
            });
        }
        span.setStatus({
          code: SpanStatusCode.OK,
          message: 'Operation has been successful',
        });
        return result;
      } catch (error: any) {
        span.recordException(error);
        span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
        throw error;
      }
    });
  }

  startSpan(
    name: string,
    attributes?: Attributes | Record<string | any, string | any>,
    contextOverride?: Context,
  ): Span {
    const ctx = contextOverride || context.active();
    const span = this.tracer.startSpan(name, { attributes }, ctx);
    return span;
  }

  endSpan(span: Span): void {
    span.end();
  }

  recordException(span: Span, error: any): void {
    span.recordException(error);
    span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
  }

  setStatus(span: Span, code: SpanStatusCode, message?: string): void {
    span.setStatus({ code, message });
  }

  setAttribute(span: Span, key: string, value: any): void {
    span.setAttribute(key, value);
  }

  getCurrentSpan(): Span | undefined {
    return trace.getSpan(context.active());
  }
}

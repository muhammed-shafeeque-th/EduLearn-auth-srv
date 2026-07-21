import { Attributes, Context, Span, SpanStatusCode } from '@opentelemetry/api';

export interface ITraceService {
  startActiveSpan<T>(
    name: string,
    fn: (span: Span) => T | Promise<T>,
    attributes?: Attributes,
  ): T | Promise<T>;

  startSpan(
    name: string,
    attributes?: Attributes | Record<string | any, string | any>,
    contextOverride?: Context,
  ): Span;

  endSpan(span: Span): void;

  recordException(span: Span, error: any): void;

  setStatus(span: Span, code: SpanStatusCode, message?: string): void;

  setAttribute(span: Span, key: string, value: any): void;

  getCurrentSpan(): Span | undefined;
}

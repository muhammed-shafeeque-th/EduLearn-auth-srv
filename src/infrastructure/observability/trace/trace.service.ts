import { ITraceService } from '@/application/adaptors/trace.service';
import { TYPES } from '@/shared/constants/identifiers';
import { getEnvs } from '@/shared/utils/getEnv';
import { TracerService } from '@edulearn/core';
import { Span, trace, context, SpanStatusCode } from '@opentelemetry/api';
import { inject, injectable } from 'inversify';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';

const { SERVICE_NAME } = getEnvs({ SERVICE_NAME: 'user-service' });

@injectable()
export class TraceService extends TracerService implements ITraceService {
  public constructor(@inject(TYPES.TracerProvider) traceProvider: NodeTracerProvider) {
    super(traceProvider.getTracer(SERVICE_NAME.toString()));
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

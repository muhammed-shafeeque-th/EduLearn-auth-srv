import { ITraceService, TSpanStatusCode } from '@/application/adaptors/trace.service';
import { TYPES } from '@/shared/constants/identifiers';
import { getEnvs } from '@/shared/utils/getEnv';
import { TracerService } from '@edulearn/core';
import { TSpan, TNodeTracerProvider } from '@edulearn/core';
import { inject, injectable } from 'inversify';

const { SERVICE_NAME } = getEnvs({ SERVICE_NAME: 'user-service' });

@injectable()
export class TraceService extends TracerService implements ITraceService {
  public constructor(@inject(TYPES.TracerProvider) traceProvider: TNodeTracerProvider) {
    super(traceProvider.getTracer(SERVICE_NAME.toString()));
  }

  recordException(span: TSpan, error: any): void {
    span.recordException(error);
    span.setStatus({ code: TSpanStatusCode.ERROR as any, message: error.message });
  }

  setStatus(span: TSpan, code: any, message?: string): void {
    span.setStatus({ code, message });
  }

  setAttribute(span: TSpan, key: string, value: any): void {
    span.setAttribute(key, value);
  }
}

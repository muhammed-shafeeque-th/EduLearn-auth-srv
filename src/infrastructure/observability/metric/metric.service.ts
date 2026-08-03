import { IMetricService } from '@/application/adaptors/metric.service';
import { TYPES } from '@/shared/constants/identifiers';
import { inject, injectable } from 'inversify';
import { MetricsEngine } from './setup';

@injectable()
export class MetricService implements IMetricService {
  public constructor(@inject(TYPES.MetricsEngine) private engine: MetricsEngine) {}

  public measureDBOperationDuration(
    method: string,
    operation?: 'INSERT' | 'DELETE' | 'SELECT' | 'UPDATE',
  ): () => void {
    const end = this.engine.dbRequestDurationSeconds.startTimer({ method, operation });
    return () => {
      end();
    };
  }
  public measureRequestDuration(method: string): () => void {
    const end = this.engine.gRPCRequestDurationSeconds.startTimer({ method });
    return (status_code?: string) => {
      end({ status_code });
    };
  }

  public incrementRequestCounter(method: string, statusCode?: number): void {
    this.engine.grpcRequestsTotal.inc({
      method,
      status_code: statusCode?.toString(),
    });
  }
  public incrementDBRequestCounter(operation?: 'INSERT' | 'DELETE' | 'SELECT' | 'UPDATE'): void {
    this.engine.databaseQueryCounter.inc({ operation });
  }

  public incrementErrorCounter(method: string, statusCode?: number): void {
    this.engine.grpcErrorsTotal.inc({ method, status_code: statusCode?.toString() });
  }
}

import { injectable } from 'inversify';
import { Counter, Gauge, Histogram, register } from 'prom-client';

// interface MetricLabels {
//   [key: string]: string | number;
// }

@injectable()
export class MetricsService {
  private gRPCRequestDurationSeconds: Histogram;
  private databaseQueryCounter: Counter;
  private currentRequestCount: Gauge;
  private dbRequestDurationSeconds: Histogram;
  private grpcRequestsTotal: Counter;
  private grpcErrorsTotal: Counter;

  public constructor() {
    this.gRPCRequestDurationSeconds = new Histogram({
      name: 'course_service_grpc_request_duration_seconds',
      help: 'Latency of gRPC requests in seconds',
      labelNames: ['method', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.databaseQueryCounter = new Counter({
      name: 'database_queries_total',
      help: 'Total number of database queries in Course Service',
      labelNames: ['operation'],
    });

    this.currentRequestCount = new Gauge({
      name: 'number_of_current_processing_requests_by_server',
      help: 'Current size of the request served by server',
    });

    this.dbRequestDurationSeconds = new Histogram({
      name: 'DB_request_duration_seconds',
      help: 'Duration of Database requests in seconds',
      labelNames: ['method', 'operation'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.grpcRequestsTotal = new Counter({
      name: 'grpc_requests_total',
      help: 'Total number of gRPC requests',
      labelNames: ['method', 'status_code'],
    });

    this.grpcErrorsTotal = new Counter({
      name: 'grpc_errors_total',
      help: 'Total number of gRPC errors',
      labelNames: ['method', 'status_code'],
    });
  }

  public measureDBOperationDuration(
    method: string,
    operation?: 'INSERT' | 'DELETE' | 'SELECT' | 'UPDATE',
  ): () => void {
    const end = this.dbRequestDurationSeconds.startTimer({ method, operation });
    return () => {
      end();
    };
  }
  public measureRequestDuration(method: string): () => void {
    const end = this.gRPCRequestDurationSeconds.startTimer({ method });
    return (status_code?: string) => {
      end({ status_code });
    };
  }

  public incrementRequestCounter(method: string, statusCode?: number): void {
    this.grpcRequestsTotal.inc({
      method,
      status_code: statusCode?.toString(),
    });
  }
  public incrementDBRequestCounter(operation?: 'INSERT' | 'DELETE' | 'SELECT' | 'UPDATE'): void {
    this.databaseQueryCounter.inc({ operation });
  }

  public incrementErrorCounter(method: string, statusCode?: number): void {
    this.grpcErrorsTotal.inc({ method, status_code: statusCode?.toString() });
  }

  public async getMetrics(): Promise<string> {
    try {
      return register.metrics();
    } catch (error) {
      console.error('Error while fetching prometheus metrics', error);
      throw error;
    }
  }
}

import { inject, injectable } from 'inversify';
import {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  MetricsEngine as Engine,
  createMetrics,
  getEnvs,
} from '@edulearn/core';
import { Server } from 'http';
import { TYPES } from '@/shared/constants/identifiers';

const { SERVICE_NAME } = getEnvs({ SERVICE_NAME: 'user-service' });

@injectable()
export class MetricsEngine {
  private readonly _engine: Engine;
  gRPCRequestDurationSeconds: HistogramMetric;
  databaseQueryCounter: CounterMetric;
  currentRequestCount: GaugeMetric;
  dbRequestDurationSeconds: HistogramMetric;
  grpcRequestsTotal: CounterMetric;
  grpcErrorsTotal: CounterMetric;

  public constructor(@inject(TYPES.HttpServer) server: Server) {
    this._engine = createMetrics({
      server,
      enabled: true,
      namespace: String(SERVICE_NAME),
    });

    this.gRPCRequestDurationSeconds = this._engine.histogram({
      name: 'course_service_grpc_request_duration_seconds',
      help: 'Latency of gRPC requests in seconds',
      labelNames: ['method', 'status_code'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.databaseQueryCounter = this._engine.counter({
      name: 'database_queries_total',
      help: 'Total number of database queries in Course Service',
      labelNames: ['operation'],
    });

    this.currentRequestCount = this._engine.gauge({
      name: 'number_of_current_processing_requests_by_server',
      help: 'Current size of the request served by server',
    });

    this.dbRequestDurationSeconds = this._engine.histogram({
      name: 'DB_request_duration_seconds',
      help: 'Duration of Database requests in seconds',
      labelNames: ['method', 'operation'],
      buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    });

    this.grpcRequestsTotal = this._engine.counter({
      name: 'grpc_requests_total',
      help: 'Total number of gRPC requests',
      labelNames: ['method', 'status_code'],
    });

    this.grpcErrorsTotal = this._engine.counter({
      name: 'grpc_errors_total',
      help: 'Total number of gRPC errors',
      labelNames: ['method', 'status_code'],
    });
  }

  public get engine() {
    return this._engine;
  }

  public start() {
    this._engine.initialize();
  }

  public shutdown() {
    this._engine.shutdown();
  }
}

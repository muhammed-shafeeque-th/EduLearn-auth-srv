import {
  NodeTracerProvider,
  SimpleSpanProcessor,
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from '@opentelemetry/sdk-trace-node';

import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
  SemanticResourceAttributes,
} from '@opentelemetry/semantic-conventions';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
// import { Sampler, ParentBasedSampler, TraceIdRatioBasedSampler } from '@opentelemetry/sdk-trace-base'; // Correct Sampler imports
import os from 'os';

import { resourceFromAttributes } from '@opentelemetry/resources';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { getEnvs } from '@/shared/utils/getEnv';

// Initialize the OpenTelemetry Node SDK
export function initializeTracer() {
  const { JAEGER_ENDPOINT, NODE_ENV, TRACING_SAMPLING_RATIO, SERVICE_NAME } = getEnvs({
    JAEGER_ENDPOINT: 'http://localhost:4318/v1/traces',
    NODE_ENV: 'development',
    TRACING_SAMPLING_RATIO: 0.1,
    SERVICE_NAME: 'UserService',
  });

  const sampler =
    NODE_ENV === 'production'
      ? new ParentBasedSampler({
          root: new TraceIdRatioBasedSampler(Number(TRACING_SAMPLING_RATIO)),
        })
      : new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(1.0) });

  const otlpExporter = new OTLPTraceExporter({
    url: JAEGER_ENDPOINT.toString(),
  });

  const spanProcessor =
    NODE_ENV.toString() === 'production'
      ? new BatchSpanProcessor(otlpExporter)
      : new SimpleSpanProcessor(otlpExporter);

  const provider = new NodeTracerProvider({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: SERVICE_NAME.toString(),

      [ATTR_SERVICE_VERSION]: process.env.npm_package_version || 'unknown',
      [SemanticResourceAttributes.HOST_NAME]: os.hostname(),
      [SemanticResourceAttributes.OS_TYPE]: os.type(),
      [SemanticResourceAttributes.OS_VERSION]: os.release(),
      [SemanticResourceAttributes.PROCESS_PID]: process.pid,
    }),
    sampler: sampler,
    spanProcessors: [spanProcessor],
  });

  provider.register();

  registerInstrumentations({
    instrumentations: [getNodeAutoInstrumentations()],
  });

  const shutdownTracer = async () => {
    console.log('Shutting down tracer...');
    await provider
      .shutdown()
      .then(() => console.log('Tracer shut down.'))
      .catch((err) => console.error('Error shutting down tracer', err));
    process.exit(0); // Exit process after shutdown
  };

  process.on('SIGTERM', shutdownTracer);
  process.on('SIGINT', shutdownTracer);
}

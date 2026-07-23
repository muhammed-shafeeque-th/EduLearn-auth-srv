import { getEnvs, MetricsServer } from '@edulearn/core';

const { METRICS_PORT } = getEnvs({ METRICS_PORT: 3000 });

const metricsServer = new MetricsServer({
  port: Number(METRICS_PORT),
});

metricsServer.start();

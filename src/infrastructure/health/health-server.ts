import http from 'http';
import { RedisCacheService } from '../redis/cache.service';
import { AppDataSource } from '../database/data-source/data-source';
import { LoggingService } from '../observability/logging/logging.service';

const logger = LoggingService.getInstance();

export function startHealthServer(
  redis: RedisCacheService,
  db: typeof AppDataSource,
  port = 8080,
): void {
  const server = http.createServer(async (req, res) => {
    if (req.url === '/liveness') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'alive', timestamp: new Date().toISOString() }));
      return;
    }

    if (req.url === '/readiness') {
      let ready = true;

      // DB check
      try {
        await db.query('SELECT 1');
      } catch {
        ready = false;
      }
      // Redis check
      try {
        await redis.ping();
      } catch {
        ready = false;
      }
      res.writeHead(ready ? 200 : 503, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          status: ready ? 'ready' : 'not-ready',
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }

    if (req.url === '/health') {
      const health: Record<string, boolean> = {};

      //DB check
      try {
        await db.query('SELECT 1');
        health.db = true;
      } catch {
        health.db = false;
      }

      // Redis check
      try {
        await redis.ping();
        health.redis = true;
      } catch {
        health.redis = false;
      }
      const allHealthy = Object.values(health).every(Boolean);
      res.writeHead(allHealthy ? 200 : 503, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          status: allHealthy ? 'ok' : 'unhealthy',
          dependencies: health,
          timestamp: new Date().toISOString(),
        }),
      );
      return;
    }
    res.writeHead(404);
    res.end();
  });

  server.listen(port, () => {
    logger.info(`[health-server] listening on port ${port}`, { ctx: 'startHealthServer' });
  });
}

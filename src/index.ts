import 'reflect-metadata';
import { App } from './app';
import { LoggingService } from './infrastructure/observability/logging/logging.service';

const logger = LoggingService.getInstance();
const app = new App();

process.on('SIGINT', async () => await app.shutdown());
process.on('SIGTERM', async () => await app.shutdown());

(async () => {
  try {
    await app.initialize();
  } catch (error) {
    logger.error('Error while initializing app ', { error });
    process.exit(1);
  }
})();

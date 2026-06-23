import 'reflect-metadata';
import { App } from './app';
import { LoggerService } from './infrastructure/observability/logger/logger.service';

const logger = LoggerService.getInstance();
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

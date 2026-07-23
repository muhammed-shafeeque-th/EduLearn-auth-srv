import 'reflect-metadata';
import { AuthApplication } from './app';
import { container } from './infrastructure/di/container';
import { TYPES } from './shared/constants/identifiers';
import { ILoggerService } from './application/adaptors/logger.service';

const app: AuthApplication = container.get(TYPES.Application);
const logger: ILoggerService = container.get(TYPES.LoggerService);

process.on('SIGINT', async () => await app.shutdown());
process.on('SIGTERM', async () => await app.shutdown());

app.initialize().catch((error) => {
  logger.error('Error while initializing app ', { error });
  process.exit(1);
});

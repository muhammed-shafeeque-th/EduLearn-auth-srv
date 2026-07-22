import cron from 'node-cron';
import { container } from '@/infrastructure/di/container';
import { TYPES } from '@/shared/constants/identifiers';
import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';

export function registerDeleteExpiredTokensCron() {
  cron.schedule('0 0 * * *', async () => {
    const repository = container.get<IRefreshTokenRepository>(TYPES.IRefreshTokenRepository);

    await repository.deleteExpiredAndRevokedTokens();
  });
}

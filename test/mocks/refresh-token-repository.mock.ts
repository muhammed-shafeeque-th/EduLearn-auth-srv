import { IRefreshTokenRepository } from '@/domain/repository/refresh-token.repository';

export function createMockRefreshTokenRepository(): jest.Mocked<IRefreshTokenRepository> {
  return {
    upsertToken: jest.fn(),
    findByUserId: jest.fn(),
    findUserByToken: jest.fn(),
    updateToken: jest.fn(),
    deleteExpiredAndRevokedTokens: jest.fn(),
  } as unknown as jest.Mocked<IRefreshTokenRepository>;
}

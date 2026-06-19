import { IPasswordResetTokenRepository } from '@/domain/repository/reset-token.repository';

export function createMockResetTokenRepository(): jest.Mocked<IPasswordResetTokenRepository> {
  return {
    createToken: jest.fn(),
    findById: jest.fn(),
    findUserByToken: jest.fn(),
    updateToken: jest.fn(),
    deleteExpiredAndUsedTokens: jest.fn(),
  } as unknown as jest.Mocked<IPasswordResetTokenRepository>;
}

import ITokenService from '@/application/adaptors/token.service';

export function createMockTokenService(): jest.Mocked<ITokenService> {
  return {
    generateAccessToken: jest.fn(),
    generateRefreshToken: jest.fn(),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  } as unknown as jest.Mocked<ITokenService>;
}
